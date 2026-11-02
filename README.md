# dsh-sync-ui

DeepSeek Harness 的跨电脑同步插件：把设置、插件、技能、工具和工作记忆同步到另一台电脑。


## 功能

- 左侧栏「跨电脑同步」+ 会话头部「同步」入口。
- 状态：私有仓库、上次同步、文件数、自动同步、冲突副本、HEAD。
- 一键「推送本机」「从云端拉取」。
- 自动同步：拉取远端；本机有变化且远端未变时自动推送；冲突时停止。Windows 登录后 + 每 10 分钟。
- 自带同步引擎，不依赖本机另装 dsh-sync 工具；使用 DSH 自带 Python。

## 安装

### 方式 A：一键脚本（Windows）

```powershell
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

脚本会把仓库克隆到默认 DSH 插件目录，并打印安装命令。随后让 DSH Agent 执行它打印的 `plugin_manager install_bundle`。

### 方式 B：手动克隆

```powershell
git clone https://github.com/Simon-Kuo/dsh-sync-ui "$env:USERPROFILE\Documents\deepseek-harness\default-workspace\plugins\dsh-sync-ui"
```

然后在 DSH 里让 Agent 执行：

```text
plugin_manager install_bundle target "C:\Users\<你>\Documents\deepseek-harness\default-workspace\plugins\dsh-sync-ui"
```

重启 Harness 后，左侧栏出现「跨电脑同步」。

### Release 包

从 [Releases](https://github.com/Simon-Kuo/dsh-sync-ui/releases) 下载 zip，解压到上面的 `plugins\dsh-sync-ui` 目录，再执行同一条 `plugin_manager` 命令。

> npm 包尚未发布；当前公开安装源是 GitHub。发布 npm 需要仓库所有者先登录 npm。

## 首次配置

1. 在 GitHub 创建一个 **private、空的** 仓库，例如 `https://github.com/<你的账号>/dsh-sync.git`。
2. 本机登录 GitHub（`gh auth login`）或配置好 Git 凭据。
3. 打开左侧「跨电脑同步」，在「连接私有仓库」里填入这个 HTTPS 地址，保存并初始化。
4. 点「推送本机」创建第一份快照。

## 第二台电脑

1. 在 B 上登录**同一个 GitHub 账号**。
2. 按上面方式 A 安装插件。
3. 打开面板，填入**同一个**私有仓库地址。
4. 点「从云端拉取」；重启 Harness 让 profile/插件设置生效。
5. 如果本地插件没出现，让 Agent 用 `plugin_manager install_bundle` 指向同步后的插件目录。

## 同步范围

- 全局 `AGENTS.md`、`preferences.json`、`USER_PROFILE.md`
- profile `package.json`、`cordis.patch.yml`
- `storages/schedule.json`、`.agent-presets/`
- `~/.agents/skills/`、`~/.dsh/tools/`
- 工作区 `plugins/`
- 工作区 `AGENTS/MEMORY/HANDOFF`
- `~/Documents/我的项目/*/` 的记忆文件

**不包含**：`.credentials.yaml`、会话正文、附件、缓存、`node_modules`、`.git`、`workspace.json`、Electron UI localStorage、超过 10MB 的文件。

## 可调设置

面板里可以直接改，不需要手改配置：

- **同步仓库**：自己的 private Git 仓库；换仓会备份旧本地缓存。
- **分支**：默认 `main`。
- **自动同步**：关闭/开启；间隔可选 5/10/15/30/60 分钟。先拉取，本机有变化且远端未变时再推送。
- **同步范围**：项目记忆、可选的本地资料库（KB）。
- **单文件上限**：默认 10MB。
- 保存后自动刷新状态；「安装/更新自动同步」应用当前间隔。

## 安全

- 同步仓库必须是 **private**。
- 推送前扫描 `sk-…`、GitHub token、私钥等；发现即拒绝。
- 拉取前备份到 `~/.dsh/backups-sync/<时间>/`。
- 两边都改过时写 `*.sync-conflict-<时间>`，不硬覆盖。
- 面板只调用本机引擎；不会把你的 token 发到插件作者的服务器，也没有作者服务器。

## 命令（可选）

面板背后的 Host 命令是 `/dsh-sync`，也可在对话里直接输入：

```text
/dsh-sync status
/dsh-sync configure https://github.com/<你>/dsh-sync.git
/dsh-sync push
/dsh-sync pull
/dsh-sync autostart
```

## 局限

- 不是 DSH 账号级云同步：DSH 没有公开的账号配置云接口；本插件用**用户自己的私有 Git 仓库**作为传输层。
- 两台电脑必须能访问同一个私有仓库（同一个 GitHub 账号或协作者权限）。
- profile/插件拉取后需要重启 Harness；B 首次可能需要 `plugin_manager` 完成本地插件链接。
- 自动推送未开启：A 改完需点「推送本机」或说「同步到云端」。
- Windows 任务计划用于自动同步；其他平台需手动。

## 许可证

MIT。



