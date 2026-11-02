#!/usr/bin/env python3
"""DSH cross-machine sync.

Transport: a private GitHub repository.  The repository contains a snapshot of
selected DSH settings, plugins, skills, tools and workspace/project memory.
Credentials, sessions, caches, attachments and node_modules never enter it.

The tool is intentionally dependency-free (Python standard library + git) so a
second PC can bootstrap from the same repository.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import socket
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

HOME = Path(os.environ.get("DSH_SYNC_HOME", str(Path.home())))
DSH = HOME / ".dsh"
WORKSPACE = Path(os.environ.get(
    "DSH_SYNC_WORKSPACE",
    str(HOME / "Documents" / "deepseek-harness" / "default-workspace"),
))
REPO = Path(os.environ.get("DSH_SYNC_REPO", str(DSH / "sync-repo")))
CONFIG_PATH = Path(os.environ.get("DSH_SYNC_CONFIG", str(DSH / "sync-config.json")))
STATE_PATH = Path(os.environ.get("DSH_SYNC_STATE", str(DSH / "sync-state.json")))
PAYLOAD = REPO / "payload"
DEFAULT_REMOTE = ""
DEFAULT_BRANCH = "main"
FORMAT = 1

PROJECT_MEMORY_FILES = (
    "AGENTS.md", "HANDOFF.md", "MEMORY.md", "PLAN.md",
    "PROJECT_STATE.json", "JOURNAL.md", "README.md",
)
GLOBAL_FILES = ("AGENTS.md", "preferences.json", "USER_PROFILE.md")
WORKSPACE_FILES = ("AGENTS.md", "MEMORY.md", "HANDOFF.md")
STORAGE_FILES = ("schedule.json",)

EXCLUDE_DIRS = {
    "node_modules", ".git", "__pycache__", ".playwright-mcp",
    ".plugin-manager", "cache", "attachments", "sessions",
    "backup", "backups-sync", "sync-repo", "dsh-runtimes",
}
EXCLUDE_SUFFIXES = {".pyc", ".pyo", ".log", ".tmp", ".zip", ".7z", ".rar"}
EXCLUDE_NAMES = {".credentials.yaml", ".env", "id_rsa", "id_ed25519", "known_hosts"}
SECRET_PATTERNS = (
    re.compile(r"\bsk-[A-Za-z0-9]{16,}\b"),
    re.compile(r"\bgh[pousr]_[A-Za-z0-9]{20,}\b"),
    re.compile(r"\bgithub_pat_[A-Za-z0-9_]{20,}\b"),
    re.compile(r"\bAKIA[0-9A-Z]{16}\b"),
    re.compile(r"-----BEGIN (?:RSA |OPENSSH |EC |PRIVATE )?KEY-----"),
)


def now() -> str:
    return datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds")


def stamp() -> str:
    return datetime.now().strftime("%Y%m%d-%H%M%S")


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def run(cmd: list[str], cwd: Path | None = None, check: bool = True) -> subprocess.CompletedProcess:
    proc = subprocess.run(
        cmd, cwd=str(cwd) if cwd else None, text=True, encoding="utf-8",
        errors="replace", capture_output=True,
    )
    if check and proc.returncode != 0:
        raise RuntimeError(
            f"command failed ({proc.returncode}): {' '.join(cmd)}\n"
            f"{proc.stdout}\n{proc.stderr}"
        )
    return proc


def load_config() -> dict:
    if CONFIG_PATH.exists():
        try:
            return json.loads(CONFIG_PATH.read_text(encoding="utf-8-sig"))
        except Exception:
            pass
    return {}


def save_config(cfg: dict) -> None:
    CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)
    CONFIG_PATH.write_text(json.dumps(cfg, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def load_state() -> dict:
    if STATE_PATH.exists():
        try:
            state = json.loads(STATE_PATH.read_text(encoding="utf-8"))
            if isinstance(state, dict):
                state.setdefault("entries", {})
                state.setdefault("templates", {})
                return state
        except Exception:
            pass
    return {"entries": {}, "templates": {}, "remote_head": None, "last_sync": None}


def save_state(state: dict) -> None:
    STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    STATE_PATH.write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def is_excluded(path: Path) -> bool:
    if path.name in EXCLUDE_NAMES:
        return True
    if any(part in EXCLUDE_DIRS for part in path.parts):
        return True
    if path.suffix.lower() in EXCLUDE_SUFFIXES:
        return True
    if path.name.startswith(".sync-conflict-"):
        return True
    return False


def is_text(data: bytes) -> bool:
    if b"\x00" in data:
        return False
    try:
        data.decode("utf-8")
        return True
    except UnicodeDecodeError:
        return False


def to_repo_text(text: str) -> str:
    # Workspace is under HOME; replace the more specific path first.
    for source, token in ((WORKSPACE, "{{WORKSPACE}}"), (HOME, "{{HOME}}")):
        text = text.replace(str(source), token)
        text = text.replace(str(source).replace("\\", "/"), token)
    return text


def transform_enabled(entry_id: str) -> bool:
    """Keep sync-engine source and its docs byte-identical.

    Their literal {{HOME}} / {{WORKSPACE}} placeholders are code, not data.
    """
    # Only configuration-shaped files get path substitution. Documentation,
    # tools and plugin sources may legitimately contain literal placeholders.
    if entry_id.startswith(("tools/", "plugins/", "workspace/", "projects/", "skills/", "presets/")):
        return False
    return entry_id.endswith((".json", ".yml", ".yaml"))


def from_repo_text(text: str, entry_id: str) -> str:
    # JSON strings must keep forward slashes; plain text may use native paths.
    json_like = entry_id.lower().endswith((".json", ".jsonc"))
    home = str(HOME).replace("\\", "/") if json_like else str(HOME)
    workspace = str(WORKSPACE).replace("\\", "/") if json_like else str(WORKSPACE)
    return text.replace("{{WORKSPACE}}", workspace).replace("{{HOME}}", home)


def scan_secrets(text: str, entry_id: str) -> None:
    for pattern in SECRET_PATTERNS:
        match = pattern.search(text)
        if match:
            raise RuntimeError(
                f"secret-like value blocked in {entry_id}: {match.group(0)[:12]}… "
                "remove it or add an explicit exclusion before syncing"
            )


def add_file(specs: list[tuple[str, Path]], path: Path, entry_id: str) -> None:
    if path.is_file() and not is_excluded(path):
        specs.append((entry_id, path))


def add_tree(specs: list[tuple[str, Path]], root: Path, prefix: str) -> None:
    if not root.is_dir():
        return
    for path in sorted(root.rglob("*")):
        if not path.is_file() or is_excluded(path):
            continue
        rel = path.relative_to(root).as_posix()
        specs.append((f"{prefix}/{rel}", path))


def collect_specs(cfg: dict) -> list[tuple[str, Path]]:
    specs: list[tuple[str, Path]] = []
    for name in GLOBAL_FILES:
        add_file(specs, DSH / name, f"global/{name}")
    add_file(specs, DSH / "profiles" / "desktop" / "package.json", "profile/desktop/package.json")
    add_file(specs, DSH / "profiles" / "desktop" / "cordis.patch.yml", "profile/desktop/cordis.patch.yml")
    for name in STORAGE_FILES:
        add_file(specs, DSH / "storages" / name, f"storages/{name}")
    add_tree(specs, DSH / ".agent-presets", "presets")
    add_tree(specs, HOME / ".agents" / "skills", "skills")
    add_tree(specs, DSH / "tools", "tools")
    add_tree(specs, WORKSPACE / "plugins", "plugins")
    for name in WORKSPACE_FILES:
        add_file(specs, WORKSPACE / name, f"workspace/{name}")
    if cfg.get("include_project_memory", True):
        projects = HOME / "Documents" / "我的项目"
        if projects.is_dir():
            for project in sorted(projects.iterdir()):
                if not project.is_dir() or project.name.startswith("."):
                    continue
                for name in PROJECT_MEMORY_FILES:
                    add_file(specs, project / name, f"projects/{project.name}/{name}")
    if cfg.get("include_kb", False):
        add_tree(specs, DSH / "kb", "kb")
    # Deduplicate by id, preserving the first source.
    seen: set[str] = set()
    unique: list[tuple[str, Path]] = []
    for entry_id, path in specs:
        if entry_id not in seen:
            seen.add(entry_id)
            unique.append((entry_id, path))
    return unique


def target_for(entry_id: str) -> Path:
    parts = entry_id.split("/")
    if len(parts) < 2:
        raise RuntimeError(f"invalid sync entry: {entry_id}")
    if parts[0] == "global":
        return DSH / "/".join(parts[1:])
    if parts[0] == "profile" and parts[1] == "desktop":
        return DSH / "profiles" / "desktop" / "/".join(parts[2:])
    if parts[0] == "presets":
        return DSH / ".agent-presets" / "/".join(parts[1:])
    if parts[0] == "storages":
        return DSH / "storages" / "/".join(parts[1:])
    if parts[0] == "skills":
        return HOME / ".agents" / "skills" / "/".join(parts[1:])
    if parts[0] == "tools":
        return DSH / "tools" / "/".join(parts[1:])
    if parts[0] == "plugins":
        return WORKSPACE / "plugins" / "/".join(parts[1:])
    if parts[0] == "workspace":
        return WORKSPACE / "/".join(parts[1:])
    if parts[0] == "projects":
        return HOME / "Documents" / "我的项目" / "/".join(parts[1:])
    if parts[0] == "kb":
        return DSH / "kb" / "/".join(parts[1:])
    raise RuntimeError(f"unknown sync namespace: {entry_id}")


def ensure_git_identity() -> None:
    for key, value in (("user.name", "DSH Sync"), ("user.email", "dsh-sync@users.noreply.github.com")):
        current = run(["git", "config", "--get", key], cwd=REPO, check=False).stdout.strip()
        if not current:
            run(["git", "config", key, value], cwd=REPO)


def remote_url(cfg: dict) -> str:
    return cfg.get("remote") or ""


def branch(cfg: dict) -> str:
    return cfg.get("branch") or DEFAULT_BRANCH


def ensure_repo(cfg: dict) -> None:
    if not remote_url(cfg):
        raise RuntimeError("remote not configured; run `init --remote <git-url>` first")
    REPO.parent.mkdir(parents=True, exist_ok=True)
    if not (REPO / ".git").is_dir():
        if REPO.exists():
            shutil.rmtree(REPO)
        remote = remote_url(cfg)
        probe = run(["git", "ls-remote", remote, branch(cfg)], check=False)
        if probe.returncode == 0 and probe.stdout.strip():
            run(["git", "clone", "--branch", branch(cfg), remote, str(REPO)])
        else:
            REPO.mkdir(parents=True, exist_ok=True)
            run(["git", "init", "-b", branch(cfg)], cwd=REPO)
            run(["git", "remote", "add", "origin", remote], cwd=REPO)
    ensure_git_identity()
    ensure_root_files()


def ensure_root_files() -> None:
    readme = REPO / "README.md"
    if not readme.exists():
        readme.write_text(ROOT_README, encoding="utf-8")
    bootstrap = REPO / "bootstrap.ps1"
    if not bootstrap.exists():
        bootstrap.write_text(BOOTSTRAP_PS1, encoding="utf-8")
    ignore = REPO / ".gitignore"
    if not ignore.exists():
        ignore.write_text(
            "payload/**/__pycache__/\npayload/**/*.pyc\npayload/**/.git/\n"
            "payload/**/node_modules/\n",
            encoding="utf-8",
        )


def git_has_local_changes() -> bool:
    return bool(run(["git", "status", "--porcelain"], cwd=REPO).stdout.strip())


def sync_remote(cfg: dict) -> None:
    fetch = run(["git", "fetch", "origin", branch(cfg)], cwd=REPO, check=False)
    if fetch.returncode != 0:
        return
    head = run(["git", "rev-parse", "--verify", "origin/" + branch(cfg)], cwd=REPO, check=False)
    if head.returncode == 0 and head.stdout.strip():
        # The repository is a generated snapshot; rebase local generated commits.
        run(["git", "pull", "--rebase", "origin", branch(cfg)], cwd=REPO, check=False)


def remote_head(cfg: dict) -> str | None:
    run(["git", "fetch", "origin", branch(cfg)], cwd=REPO, check=False)
    proc = run(["git", "rev-parse", "--verify", "origin/" + branch(cfg)], cwd=REPO, check=False)
    return proc.stdout.strip() or None


def stage_payload(cfg: dict) -> dict:
    specs = collect_specs(cfg)
    if not specs:
        raise RuntimeError("nothing to sync; check the DSH paths")
    if PAYLOAD.exists():
        shutil.rmtree(PAYLOAD)
    PAYLOAD.mkdir(parents=True, exist_ok=True)
    manifest_entries = []
    for entry_id, source in specs:
        data = source.read_bytes()
        if len(data) > int(cfg.get("max_file_mb", 5)) * 1024 * 1024:
            print(f"skip large file: {entry_id}")
            continue
        text = is_text(data)
        if text:
            decoded = data.decode("utf-8")
            rendered = to_repo_text(decoded) if transform_enabled(entry_id) else decoded
            scan_secrets(rendered, entry_id)
            payload = rendered.encode("utf-8")
        else:
            payload = data
        target = PAYLOAD / entry_id
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(payload)
        manifest_entries.append({
            "id": entry_id,
            "sha256": sha256_bytes(payload),
            "size": len(payload),
            "text": text,
        })
    manifest = {
        "format": FORMAT,
        "created_at": now(),
        "created_by": socket.gethostname(),
        "entries": manifest_entries,
    }
    (REPO / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    return manifest


def local_hashes(specs: list[tuple[str, Path]]) -> dict:
    hashes = {}
    for entry_id, source in specs:
        if source.is_file():
            hashes[entry_id] = sha256_file(source)
    return hashes


def cmd_init(args) -> int:
    cfg = load_config()
    old_remote = str(cfg.get("remote") or "").strip()
    new_remote = str(args.remote if args.remote is not None else old_remote).strip()
    if not new_remote:
        cfg.setdefault("branch", DEFAULT_BRANCH)
        cfg.setdefault("include_project_memory", True)
        cfg.setdefault("include_kb", False)
        cfg.setdefault("max_file_mb", 10)
        save_config(cfg)
        print("remote not configured; run `init --remote <git-url>` with a private empty repo")
        print(f"config: {CONFIG_PATH}")
        return 0
    if new_remote != old_remote and (REPO / ".git").exists():
        backup = REPO.with_name(f"{REPO.name}.old-{stamp()}")
        shutil.move(str(REPO), str(backup))
        state = load_state()
        state["entries"] = {}
        state["templates"] = {}
        state["remote_head"] = None
        state["last_sync"] = None
        save_state(state)
        print(f"old local sync cache backed up to {backup}")
    cfg["remote"] = new_remote
    cfg.setdefault("branch", DEFAULT_BRANCH)
    cfg.setdefault("include_project_memory", True)
    cfg.setdefault("include_kb", False)
    cfg.setdefault("max_file_mb", 10)
    save_config(cfg)
    ensure_repo(cfg)
    print(f"config: {CONFIG_PATH}")
    print(f"repo:   {REPO}")
    print(f"remote: {cfg['remote']}")
    return 0


def template_hash(path: Path, entry: dict) -> str:
    data = path.read_bytes()
    if entry.get("text") and is_text(data) and transform_enabled(str(entry.get("id", ""))):
        data = to_repo_text(data.decode("utf-8")).encode("utf-8")
    return sha256_bytes(data)


def cmd_push(args) -> int:
    cfg = load_config()
    if args.remote:
        cfg["remote"] = args.remote
    if not cfg.get("remote"):
        raise RuntimeError("remote not configured; run `init --remote <git-url>` first")
    ensure_repo(cfg)
    state = load_state()
    before = remote_head(cfg)
    if before and state.get("remote_head") and before != state["remote_head"]:
        raise RuntimeError(
            "remote sync repo changed since this PC's last sync; run `pull` first "
            "and resolve any conflict copies before pushing"
        )
    sync_remote(cfg)
    manifest = stage_payload(cfg)
    specs = collect_specs(cfg)
    run(["git", "add", "-A"], cwd=REPO)
    if run(["git", "status", "--porcelain"], cwd=REPO).stdout.strip():
        message = args.message or f"sync: {socket.gethostname()} {now()}"
        run(["git", "commit", "-m", message], cwd=REPO)
    proc = run(["git", "push", "-u", "origin", branch(cfg)], cwd=REPO, check=False)
    if proc.returncode != 0:
        raise RuntimeError(f"git push failed:\n{proc.stderr or proc.stdout}")
    state = load_state()
    state["entries"] = local_hashes(specs)
    by_id = {entry["id"]: entry for entry in manifest["entries"]}
    state["templates"] = {
        entry_id: by_id[entry_id]["sha256"]
        for entry_id in state["entries"] if entry_id in by_id
    }
    state["remote_head"] = remote_head(cfg)
    state["last_sync"] = now()
    save_state(state)
    print(f"pushed {len(manifest['entries'])} files to {cfg['remote']}")
    return 0


def backup_targets(entries: list[dict]) -> Path:
    dest = DSH / "backups-sync" / stamp()
    for entry in entries:
        target = target_for(entry["id"])
        if target.is_file():
            backup = dest / entry["id"]
            backup.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(target, backup)
    dest.mkdir(parents=True, exist_ok=True)
    return dest


def cmd_pull(args) -> int:
    cfg = load_config()
    ensure_repo(cfg)
    head = remote_head(cfg)
    if not head:
        raise RuntimeError("remote repository has no commits yet; push from the first PC")
    sync_remote(cfg)
    manifest_path = REPO / "manifest.json"
    if not manifest_path.exists():
        raise RuntimeError("manifest.json missing in sync repo; run push from the first PC")
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    entries = [e for e in manifest.get("entries", []) if (PAYLOAD / e["id"]).is_file()]
    state = load_state()
    base_entries = state.get("entries", {})
    base_templates = state.get("templates", {})
    backup = backup_targets(entries)
    applied = conflicts = kept = 0
    for entry in entries:
        entry_id = entry["id"]
        target = target_for(entry_id)
        remote_bytes = (PAYLOAD / entry_id).read_bytes()
        remote_template = sha256_bytes(remote_bytes)
        local_raw = sha256_file(target) if target.is_file() else None
        local_template = template_hash(target, entry) if target.is_file() else None
        base_raw = base_entries.get(entry_id)
        base_template = base_templates.get(entry_id)
        if local_template is not None and local_template == remote_template:
            state.setdefault("entries", {})[entry_id] = local_raw
            state.setdefault("templates", {})[entry_id] = local_template
            continue
        if (
            local_template is not None and base_raw and base_template
            and local_raw != base_raw and remote_template != base_template
        ):
            conflict = target.with_name(target.name + f".sync-conflict-{stamp()}")
            conflict.parent.mkdir(parents=True, exist_ok=True)
            data = remote_bytes
            if entry.get("text") and is_text(data) and transform_enabled(entry_id):
                data = from_repo_text(data.decode("utf-8"), entry_id).encode("utf-8")
            conflict.write_bytes(data)
            conflicts += 1
            print(f"conflict: {entry_id} -> {conflict.name} (local kept)")
            continue
        if (
            local_template is not None and base_raw and base_template
            and local_raw != base_raw and remote_template == base_template
        ):
            kept += 1
            state.setdefault("entries", {})[entry_id] = local_raw
            state.setdefault("templates", {})[entry_id] = local_template
            continue
        if args.dry_run:
            applied += 1
            continue
        target.parent.mkdir(parents=True, exist_ok=True)
        data = remote_bytes
        if entry.get("text") and is_text(data) and transform_enabled(entry_id):
            data = from_repo_text(data.decode("utf-8"), entry_id).encode("utf-8")
        target.write_bytes(data)
        state.setdefault("entries", {})[entry_id] = sha256_bytes(data)
        state.setdefault("templates", {})[entry_id] = remote_template
        applied += 1
        print(f"applied: {entry_id}")
    if not args.dry_run:
        state["remote_head"] = head
        state["last_sync"] = now()
        save_state(state)
    print(
        f"pull complete: {applied} applied, {conflicts} conflict copies, "
        f"{kept} local kept; backup: {backup}"
    )
    if applied and not args.quiet:
        print("Restart Harness once if profile/plugin/settings changed.")
    return 0 if conflicts == 0 else 2


def cmd_auto_pull(args) -> int:
    cfg = load_config()
    if not (REPO / ".git").exists():
        return 0
    try:
        head = remote_head(cfg)
        state = load_state()
        if not head or head == state.get("remote_head"):
            return 0
        # Auto mode is conservative: still backs up and writes conflict copies.
        return cmd_pull(argparse.Namespace(dry_run=False, force=False, quiet=True))
    except Exception as exc:  # startup must never spam a console
        log = DSH / "sync-autopull.log"
        log.parent.mkdir(parents=True, exist_ok=True)
        with log.open("a", encoding="utf-8") as fh:
            fh.write(f"[{now()}] auto-pull failed: {exc}\n")
        return 1


def cmd_auto_push(args) -> int:
    cfg = load_config()
    if not remote_url(cfg) or not (REPO / ".git").exists():
        return 0
    try:
        specs = collect_specs(cfg)
        current = local_hashes(specs)
        state = load_state()
        if current == state.get("entries"):
            return 0
        return cmd_push(argparse.Namespace(remote=None, message=f"auto-sync: {now()}"))
    except Exception as exc:
        log = DSH / "sync-autosync.log"
        log.parent.mkdir(parents=True, exist_ok=True)
        with log.open("a", encoding="utf-8") as fh:
            fh.write(f"[{now()}] auto-push failed: {exc}\n")
        return 1


def cmd_auto_sync(args) -> int:
    pull_code = cmd_auto_pull(args)
    if pull_code != 0:
        return pull_code
    return cmd_auto_push(args)


def cmd_settings(args) -> int:
    cfg = load_config()
    try:
        data = json.loads(args.json or "{}")
    except Exception as exc:
        raise RuntimeError(f"invalid settings JSON: {exc}")
    if not isinstance(data, dict):
        raise RuntimeError("settings must be a JSON object")
    if "branch" in data:
        branch_name = str(data["branch"] or "").strip()
        if not branch_name or any(ch.isspace() for ch in branch_name):
            raise RuntimeError("branch must be a non-empty name without spaces")
        cfg["branch"] = branch_name
    if "includeProjectMemory" in data:
        cfg["include_project_memory"] = bool(data["includeProjectMemory"])
    if "includeKb" in data:
        cfg["include_kb"] = bool(data["includeKb"])
    if "maxFileMb" in data:
        try:
            size = int(data["maxFileMb"])
        except Exception:
            raise RuntimeError("maxFileMb must be an integer")
        cfg["max_file_mb"] = max(1, min(size, 200))
    if "autosyncMinutes" in data:
        try:
            minutes = int(data["autosyncMinutes"])
        except Exception:
            raise RuntimeError("autosyncMinutes must be an integer")
        cfg["autosync_minutes"] = max(1, min(minutes, 1440))
    save_config(cfg)
    print(json.dumps({"ok": True, "config": cfg}, ensure_ascii=False))
    return 0


def cmd_status(args) -> int:
    cfg = load_config()
    state = load_state()
    repo_exists = (REPO / ".git").exists()
    head = run(["git", "rev-parse", "--short", "HEAD"], cwd=REPO, check=False).stdout.strip() if repo_exists else ""
    startup = Path(os.environ.get("APPDATA", str(HOME / "AppData" / "Roaming"))) / (
        "Microsoft/Windows/Start Menu/Programs/Startup/dsh-sync-pull.cmd"
    )
    log_path = DSH / "sync-autopull.log"
    log_tail = ""
    if log_path.exists():
        try:
            log_tail = log_path.read_text(encoding="utf-8", errors="replace")[-2000:]
        except Exception:
            pass
    conflicts = len(list(DSH.glob("backups-sync/**/*.sync-conflict-*")))
    entries = collect_specs(cfg)
    if getattr(args, "json", False):
        print(json.dumps({
            "repo": str(REPO),
            "repoExists": repo_exists,
            "remote": remote_url(cfg),
            "branch": branch(cfg),
            "lastSync": state.get("last_sync"),
            "head": head,
            "dirty": git_has_local_changes() if repo_exists else False,
            "entries": len(entries),
            "includeProjectMemory": bool(cfg.get("include_project_memory", True)),
            "includeKb": bool(cfg.get("include_kb", False)),
            "maxFileMb": int(cfg.get("max_file_mb", 10)),
            "autosyncMinutes": int(cfg.get("autosync_minutes", 10)),
            "autostart": startup.is_file(),
            "autopullCmd": autopull_cmd_path().is_file(),
            "conflicts": conflicts,
            "logTail": log_tail,
        }, ensure_ascii=False))
        return 0
    print(f"repo:      {REPO}")
    print(f"remote:    {remote_url(cfg)}")
    print(f"branch:    {branch(cfg)}")
    print(f"last sync: {state.get('last_sync') or 'never'}")
    if repo_exists:
        print(f"git head:  {head}")
        print(f"dirty:     {git_has_local_changes()}")
    print(f"entries:   {len(entries)} local candidates")
    return 0


def cmd_list(args) -> int:
    cfg = load_config()
    for entry_id, source in collect_specs(cfg):
        print(f"{entry_id}\t{source}")
    return 0


def autopull_cmd_path() -> Path:
    return DSH / "sync-autopull.cmd"


def write_autopull_cmd(exe: Path, script: Path) -> Path:
    cmd = autopull_cmd_path()
    log = DSH / "sync-autosync.log"
    cmd.write_text(
        "@echo off\r\n"
        f'"{exe}" "{script}" auto-sync >> "{log}" 2>&1\r\n',
        encoding="utf-8",
    )
    return cmd


def cmd_install_autostart(args) -> int:
    if os.name != "nt":
        print("install-autostart currently supports Windows only")
        return 1
    cfg = load_config()
    try:
        interval = int(getattr(args, "interval", None) or cfg.get("autosync_minutes", 10))
    except Exception:
        interval = 10
    interval = max(1, min(interval, 1440))
    cfg["autosync_minutes"] = interval
    save_config(cfg)
    python = Path(sys.executable)
    pythonw = python.with_name("pythonw.exe")
    exe = pythonw if pythonw.exists() else python
    script = Path(__file__).resolve()
    autopull = write_autopull_cmd(exe, script)
    startup = Path(os.environ.get("APPDATA", str(HOME / "AppData" / "Roaming"))) / (
        "Microsoft/Windows/Start Menu/Programs/Startup"
    )
    startup.mkdir(parents=True, exist_ok=True)
    cmd = startup / "dsh-sync-pull.cmd"
    cmd.write_text(
        "@echo off\r\n"
        "timeout /t 15 /nobreak >nul\r\n"
        f'call "{autopull}"\r\n',
        encoding="utf-8",
    )
    print(f"installed startup: {cmd}")
    run(["schtasks", "/Delete", "/TN", "DSH Sync Auto Pull", "/F"], check=False)
    task = run([
        "schtasks", "/Create", "/SC", "MINUTE", "/MO", str(interval),
        "/TN", "DSH Sync Auto Sync", "/TR", f'"{autopull}"', "/F",
    ], check=False)
    if task.returncode == 0:
        print(f"installed periodic auto-sync: every {interval} minutes")
    else:
        print(f"periodic auto-sync not installed: {(task.stderr or task.stdout).strip()[:200]}")
    return 0


def cmd_uninstall_autostart(args) -> int:
    if os.name != "nt":
        return 1
    startup = Path(os.environ.get("APPDATA", str(HOME / "AppData" / "Roaming"))) / (
        "Microsoft/Windows/Start Menu/Programs/Startup"
    )
    for path in (startup / "dsh-sync-pull.cmd", autopull_cmd_path()):
        if path.exists():
            path.unlink()
            print(f"removed: {path}")
    run(["schtasks", "/Delete", "/TN", "DSH Sync Auto Sync", "/F"], check=False)
    run(["schtasks", "/Delete", "/TN", "DSH Sync Auto Pull", "/F"], check=False)
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="DSH cross-machine sync")
    sub = parser.add_subparsers(dest="command", required=True)
    p = sub.add_parser("init")
    p.add_argument("--remote", default=None)
    p = sub.add_parser("push")
    p.add_argument("--remote")
    p.add_argument("--message")
    p = sub.add_parser("pull")
    p.add_argument("--dry-run", action="store_true")
    p.add_argument("--force", action="store_true")
    p.add_argument("--quiet", action="store_true")
    p = sub.add_parser("auto-pull")
    p.add_argument("--quiet", action="store_true")
    p = sub.add_parser("auto-push")
    p.add_argument("--quiet", action="store_true")
    p = sub.add_parser("auto-sync")
    p.add_argument("--quiet", action="store_true")
    sub.add_parser("status").add_argument("--json", action="store_true")
    p = sub.add_parser("settings")
    p.add_argument("--json", required=True)
    sub.add_parser("list")
    p = sub.add_parser("install-autostart")
    p.add_argument("--interval", type=int)
    sub.add_parser("uninstall-autostart")
    args = parser.parse_args()
    handlers = {
        "init": cmd_init, "push": cmd_push, "pull": cmd_pull,
        "auto-pull": cmd_auto_pull, "auto-push": cmd_auto_push,
        "auto-sync": cmd_auto_sync, "status": cmd_status, "list": cmd_list,
        "settings": cmd_settings,
        "install-autostart": cmd_install_autostart,
        "uninstall-autostart": cmd_uninstall_autostart,
    }
    try:
        return handlers[args.command](args)
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1


ROOT_README = """# dsh-sync (private)

Private transport for DeepSeek Harness cross-machine sync.

Do not make this repository public. It contains DSH settings, plugins, skills,
tools and workspace/project memory; credentials, sessions and caches are
excluded by the sync tool.

Use `python ~/.dsh/tools/sync/sync.py push` on the source PC and
`python ~/.dsh/tools/sync/sync.py pull` on the target PC.
"""

BOOTSTRAP_PS1 = r"""param(
  [Parameter(Mandatory=$true)][string]$Repo
)
$ErrorActionPreference = "Stop"
$dsh = Join-Path $env:USERPROFILE ".dsh"
$repoDir = Join-Path $dsh "sync-repo"
if (-not (Test-Path $repoDir)) {
  gh repo clone $Repo $repoDir
}
$src = Join-Path $repoDir "payload\tools\sync"
$dst = Join-Path $dsh "tools\sync"
New-Item -ItemType Directory -Force -Path $dst | Out-Null
Copy-Item (Join-Path $src "sync.py") (Join-Path $dst "sync.py") -Force
$python = (Get-Command python -ErrorAction SilentlyContinue).Source
if (-not $python) {
  $candidate = Get-ChildItem (Join-Path $dsh "dsh-runtimes") -Recurse -Filter python.exe -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($candidate) { $python = $candidate.FullName }
}
if (-not $python) { throw "Python not found; install Python or run through the DSH Agent." }
& $python (Join-Path $dst "sync.py") pull
& $python (Join-Path $dst "sync.py") install-autostart
Write-Host "Restart Harness if settings or plugins changed."
Write-Host "If a local plugin is missing, ask the DSH Agent to install it with plugin_manager."
"""


if __name__ == "__main__":
    sys.exit(main())



