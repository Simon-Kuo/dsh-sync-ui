import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const INSTALLED_SCRIPT = path.join(homedir(), '.dsh', 'tools', 'sync', 'sync.py');
const BUNDLED_SCRIPT = path.join(HERE, 'engine', 'sync.py');
const BUNDLED_PYTHON = path.join(
  homedir(), '.dsh', 'dsh-runtimes', 'dsh-primary-runtime', 'dependencies', 'python',
  process.platform === 'win32' ? 'python.exe' : 'bin/python3',
);

export const inject = ['commands'];

let running = false;

function pythonPath() {
  if (process.env.DSH_SYNC_PYTHON) return process.env.DSH_SYNC_PYTHON;
  if (process.platform === 'win32' && existsSync(BUNDLED_PYTHON)) return BUNDLED_PYTHON;
  return process.platform === 'win32' ? 'python' : 'python3';
}

function scriptPath() {
  if (process.env.DSH_SYNC_SCRIPT) return process.env.DSH_SYNC_SCRIPT;
  // Public installs use the bundled engine; an existing local installation is
  // only a fallback for users who already have the standalone tool.
  if (existsSync(BUNDLED_SCRIPT)) return BUNDLED_SCRIPT;
  return INSTALLED_SCRIPT;
}

function argsFor(action, argument) {
  switch (action) {
    case 'status':
      return ['status', '--json'];
    case 'push':
      return ['push'];
    case 'pull':
      return ['pull'];
    case 'autostart': {
      const interval = String(argument || '').trim();
      return interval ? ['install-autostart', '--interval', interval] : ['install-autostart'];
    }
    case 'uninstall-autostart':
      return ['uninstall-autostart'];
    case 'settings':
      return ['settings', '--json', String(argument || '{}')];
    case 'configure': {
      const url = String(argument || '').trim();
      if (!url) throw new Error('configure needs a private Git repository URL');
      if (!/^(https:\/\/|ssh:\/\/|git@)/i.test(url)) {
        throw new Error('repository URL must start with https://, ssh:// or git@');
      }
      return ['init', '--remote', url];
    }
    default:
      throw new Error(`unknown sync action: ${action}`);
  }
}

function runSync(action, argument, signal) {
  const args = argsFor(action, argument);
  const python = pythonPath();
  const script = scriptPath();
  return new Promise((resolve) => {
    execFile(
      python,
      [script, ...args],
      {
        timeout: 180_000,
        maxBuffer: 8 * 1024 * 1024,
        windowsHide: true,
        signal,
      },
      (error, stdout = '', stderr = '') => {
        const code = error && typeof error.code === 'number' ? error.code : error ? 1 : 0;
        let data = null;
        if (action === 'status') {
          try {
            data = JSON.parse(String(stdout).trim());
          } catch {
            data = null;
          }
        }
        resolve({
          action,
          ok: code === 0,
          code,
          output: `${stdout}${stderr}`.trim().slice(-12_000),
          data,
          python,
          script,
        });
      },
    );
  });
}

export function apply(ctx) {
  const dispose = ctx.commands.register({
    name: 'dsh-sync',
    description: 'Sync DSH settings, plugins, skills and memory through a user-owned private Git repository.',
    input: { hint: 'status | push | pull | autostart | configure <git-url>' },
    handler: async ({ rawInput, signal }) => {
      const cleaned = String(rawInput || '').trim().replace(/^\/?dsh-sync\s*/i, '');
      const tokens = cleaned.split(/\s+/);
      const action = tokens[0] || 'status';
      const argument = tokens.slice(1).join(' ');
      if (running) {
        return { kind: 'error', text: JSON.stringify({ action, ok: false, code: -1, output: 'a sync action is already running' }) };
      }
      running = true;
      try {
        const result = await runSync(action, argument, signal);
        return { kind: 'success', text: JSON.stringify(result) };
      } catch (error) {
        return {
          kind: 'error',
          text: JSON.stringify({ action, ok: false, code: -1, output: String(error?.message || error) }),
        };
      } finally {
        running = false;
      }
    },
  });
  ctx.effect(() => () => dispose());
}
