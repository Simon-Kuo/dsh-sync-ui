window.__ModuleLoader__.load({
  id: 'dsh-sync-ui',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const NS = 'dsh-sync';
    const PANEL_ID = 'dsh-sync-panel';
    const SESSION_KEY = 'dsh-sync-session';
    const sessionStore = { id: null };

    const zh = {
      label: '同步',
      panel: '跨电脑同步',
      title: '跨电脑同步',
      lede: '把设置、插件、技能、工具和工作记忆同步到另一台电脑。传输层是私有 GitHub 快照，不上传凭据、会话和附件。',
      back: '返回对话',
      refresh: '刷新状态',
      push: '推送本机',
      pull: '从云端拉取',
      auto: '安装自动同步',
      autoUpdate: '更新自动同步',
      working: '处理中…',
      connected: '已连接',
      notConnected: '未连接',
      noSession: '先在任意对话里点击右上角「同步」，再回到这里；同步操作需要一个活动会话。',
      lastSync: '上次同步',
      never: '从未',
      files: '同步文件',
      branch: '分支',
      repo: '私有仓库',
      autostart: '自动同步',
      enabled: '已启用',
      disabled: '未启用',
      conflicts: '冲突副本',
      none: '无',
      localState: '本地仓库',
      clean: '干净',
      dirty: '有未提交改动',
      log: '最近输出',
      scope: '同步范围',
      scopeText: '设置、profile、自动化任务、预设、技能、工具、本地插件、工作区记忆、项目记忆文件。',
      security: '安全',
      securityText: '推送前扫描密钥；拉取前备份；冲突写 .sync-conflict 时间戳副本；仓库保持 private。',
      setup: '电脑 B 接入',
      setupText: '在另一台电脑登录同一个 GitHub 账号，按本插件 README 安装后即可拉取。',
      connect: '同步仓库',
      connectHint: '填写你自己的 private Git 仓库 HTTPS 地址。更换仓库会备份旧本地同步缓存并重新初始化。',
      repoPlaceholder: 'https://github.com/你的账号/dsh-sync.git',
      connectButton: '保存并初始化',
      changeButton: '保存并更换仓库',
      connectFailed: '仓库初始化失败',
      notConfigured: '尚未配置私有仓库',
      settings: '同步设置',
      branch: '分支',
      intervalMinutes: '自动同步间隔',
      scopeProjects: '同步项目记忆',
      scopeKb: '同步本地资料库（KB）',
      content: '同步内容',
      contentHint: '只同步你勾选的类别；项目记忆可以逐个选择。',
      scopeSettings: '全局设置与偏好',
      scopePlugins: '已安装插件',
      scopeSkills: '技能',
      scopeTools: '工具',
      scopeWorkspace: '工作区记忆（AGENTS/MEMORY/HANDOFF）',
      projectsLabel: '项目记忆',
      projectsEmpty: '没有发现项目',
      projectsAll: '全部项目（不选则等于全部）',
      maxFileMb: '单文件上限 (MB)',
      saveSettings: '保存设置',
      disableAuto: '关闭自动同步',
      minutes5: '5 分钟',
      minutes10: '10 分钟',
      minutes15: '15 分钟',
      minutes30: '30 分钟',
      minutes60: '60 分钟',
      loadFailed: '读取失败',
      actionFailed: '操作失败',
      emptyLog: '还没有输出。',
      cloud: 'DSH · CLOUD SYNC',
    };
    const en = {
      label: 'Sync',
      panel: 'Cross-machine sync',
      title: 'Cross-machine sync',
      lede: 'Sync settings, plugins, skills, tools and working memory to another computer through a private GitHub snapshot. Credentials, sessions and attachments stay local.',
      back: 'Back to chat',
      refresh: 'Refresh',
      push: 'Push this PC',
      pull: 'Pull from cloud',
      auto: 'Install auto-sync',
      autoUpdate: 'Update auto-sync',
      working: 'Working…',
      connected: 'Connected',
      notConnected: 'Not connected',
      noSession: 'Open a conversation, click Sync in its header, then return here. Sync actions need an active session.',
      lastSync: 'Last sync',
      never: 'Never',
      files: 'Files',
      branch: 'Branch',
      repo: 'Private repo',
      autostart: 'Auto-sync',
      enabled: 'Enabled',
      disabled: 'Off',
      conflicts: 'Conflict copies',
      none: 'None',
      localState: 'Local repo',
      clean: 'Clean',
      dirty: 'Uncommitted changes',
      log: 'Last output',
      scope: 'Scope',
      scopeText: 'Settings, profile, automations, presets, skills, tools, local plugins, workspace memory and project memory files.',
      security: 'Safety',
      securityText: 'Secret scan before push; backup before pull; conflicts become timestamped .sync-conflict copies; the repo stays private.',
      setup: 'Computer B',
      setupText: 'On the other computer, sign in to the same GitHub account and install this plugin as described in its README.',
      connect: 'Sync repository',
      connectHint: 'Paste your own private Git repository HTTPS URL. Changing it backs up the old local sync cache and initializes the new repository.',
      repoPlaceholder: 'https://github.com/your-name/dsh-sync.git',
      connectButton: 'Save and initialize',
      changeButton: 'Save and switch repository',
      connectFailed: 'Could not initialize the repository',
      notConfigured: 'No private repository configured',
      settings: 'Sync settings',
      branch: 'Branch',
      intervalMinutes: 'Auto-sync interval',
      scopeProjects: 'Sync project memory',
      scopeKb: 'Sync local knowledge base (KB)',
      content: 'Sync content',
      contentHint: 'Only checked categories are synced. Project memory can be selected per project.',
      scopeSettings: 'Global settings and preferences',
      scopePlugins: 'Installed plugins',
      scopeSkills: 'Skills',
      scopeTools: 'Tools',
      scopeWorkspace: 'Workspace memory (AGENTS/MEMORY/HANDOFF)',
      projectsLabel: 'Project memory',
      projectsEmpty: 'No projects found',
      projectsAll: 'All projects (empty selection means all)',
      maxFileMb: 'Max file size (MB)',
      saveSettings: 'Save settings',
      disableAuto: 'Disable auto-sync',
      minutes5: '5 min',
      minutes10: '10 min',
      minutes15: '15 min',
      minutes30: '30 min',
      minutes60: '60 min',
      loadFailed: 'Could not load status',
      actionFailed: 'Action failed',
      emptyLog: 'No output yet.',
      cloud: 'DSH · CLOUD SYNC',
    };

    const CSS = `
      .dsh-sync-header-entry {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        height: 28px;
        padding: 0 9px;
        border: 1px solid var(--dsw-alias-border-l1);
        border-radius: 7px;
        background: transparent;
        color: var(--dsw-alias-label-primary);
        font: inherit;
        font-size: 12px;
        line-height: 1;
        white-space: nowrap;
        cursor: pointer;
      }
      .dsh-sync-header-entry:hover { background: var(--dsw-alias-bg-layer-2); }
      .dsh-sync-header-entry svg { flex: none; opacity: .78; }
      .dsh-sync-page {
        box-sizing: border-box;
        min-height: 100%;
        padding: 36px clamp(22px, 5vw, 64px) 56px;
        background: var(--dsw-alias-bg-base);
        color: var(--dsw-alias-label-primary);
        font-size: 14px;
        line-height: 1.6;
        overflow: auto;
      }
      .dsh-sync-inner { max-width: 900px; margin: 0 auto; }
      .dsh-sync-topbar { display: flex; align-items: center; min-height: 28px; margin-bottom: 6px; }
      .dsh-sync-back {
        height: 28px; padding: 0 8px; border: 0; border-radius: 7px;
        background: transparent; color: var(--dsw-alias-label-secondary);
        font: inherit; font-size: 12.5px; cursor: pointer;
      }
      .dsh-sync-back:hover { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
      .dsh-sync-eyebrow {
        font-family: var(--dsh-font-mono, ui-monospace, monospace);
        font-size: 10.5px; letter-spacing: .22em; text-transform: uppercase;
        color: var(--dsw-alias-label-secondary);
      }
      .dsh-sync-title {
        margin: 10px 0 6px; font-size: clamp(26px, 3.4vw, 36px);
        line-height: 1.2; letter-spacing: -.02em; font-weight: 700;
      }
      .dsh-sync-lede { margin: 0; max-width: 62ch; color: var(--dsw-alias-label-secondary); font-size: 13.5px; }
      .dsh-sync-hero {
        margin-top: 26px; padding: 24px 26px;
        border: 1px solid var(--dsw-alias-border-l1); border-radius: 16px;
        background: var(--dsw-alias-bg-layer-1);
        display: flex; align-items: center; gap: 18px; flex-wrap: wrap;
      }
      .dsh-sync-hero-icon {
        display: inline-flex; align-items: center; justify-content: center;
        width: 44px; height: 44px; flex: none; border-radius: 12px;
        background: var(--dsw-alias-bg-layer-2);
        color: var(--dsw-alias-label-secondary);
      }
      .dsh-sync-hero-title { font-size: 18px; font-weight: 650; }
      .dsh-sync-hero-sub { color: var(--dsw-alias-label-secondary); font-size: 12.5px; }
      .dsh-sync-status {
        margin-left: auto; padding: 4px 9px; border-radius: 999px;
        font-size: 11.5px; color: var(--dsw-alias-state-success-primary);
        background: var(--dsw-alias-bg-layer-2);
      }
      .dsh-sync-actions { display: flex; gap: 9px; flex-wrap: wrap; margin-top: 18px; }
      .dsh-sync-setup {
        margin-top: 14px; padding: 16px; border: 1px solid var(--dsw-alias-border-l1);
        border-radius: 12px; background: var(--dsw-alias-bg-layer-1);
      }
      .dsh-sync-setup h3 { margin: 0 0 4px; font-size: 13px; font-weight: 600; }
      .dsh-sync-setup p { margin: 0 0 10px; color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 1.6; }
      .dsh-sync-setup-row { display: flex; gap: 8px; flex-wrap: wrap; }
      .dsh-sync-settings {
        margin-top: 14px; padding: 16px; border: 1px solid var(--dsw-alias-border-l1);
        border-radius: 12px; background: var(--dsw-alias-bg-layer-1);
      }
      .dsh-sync-settings h3 { margin: 0 0 10px; font-size: 13px; font-weight: 600; }
      .dsh-sync-settings-grid {
        display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 12px;
      }
      .dsh-sync-field { display: flex; flex-direction: column; gap: 5px; }
      .dsh-sync-field > span { color: var(--dsw-alias-label-secondary); font-size: 12px; }
      .dsh-sync-field input, .dsh-sync-field select {
        box-sizing: border-box; width: 100%; height: 32px; padding: 0 9px;
        border: 1px solid var(--dsw-alias-border-l1); border-radius: 8px;
        background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary);
        font: inherit; font-size: 12.5px;
      }
      .dsh-sync-check { display: flex; align-items: center; gap: 8px; color: var(--dsw-alias-label-primary); font-size: 12.5px; }
      .dsh-sync-check input { width: 15px; height: 15px; margin: 0; accent-color: var(--dsw-alias-brand-primary); }
      .dsh-sync-check-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px 16px; }
      .dsh-sync-projects { margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--dsw-alias-border-l1); }
      .dsh-sync-projects-title { margin-bottom: 8px; color: var(--dsw-alias-label-secondary); font-size: 12px; }
      .dsh-sync-project-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 7px 14px; max-height: 180px; overflow: auto; }
      .dsh-sync-empty { color: var(--dsw-alias-label-secondary); font-size: 12px; }
      .dsh-sync-settings-actions { display: flex; gap: 9px; flex-wrap: wrap; margin-top: 14px; }
      .dsh-sync-input {
        box-sizing: border-box; flex: 1 1 320px; min-width: 0; height: 32px;
        padding: 0 10px; border: 1px solid var(--dsw-alias-border-l1);
        border-radius: 8px; background: var(--dsw-alias-bg-base);
        color: var(--dsw-alias-label-primary); font: inherit; font-size: 12.5px;
      }
      .dsh-sync-input:focus { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 1px; }
      .dsh-sync-btn {
        height: 32px; padding: 0 12px; border: 1px solid var(--dsw-alias-border-l1);
        border-radius: 8px; background: var(--dsw-alias-bg-layer-1);
        color: var(--dsw-alias-label-primary); font: inherit; font-size: 12.5px;
        cursor: pointer;
      }
      .dsh-sync-btn:hover { background: var(--dsw-alias-bg-layer-2); }
      .dsh-sync-btn:disabled { opacity: .5; cursor: default; }
      .dsh-sync-btn.primary {
        border-color: var(--dsw-alias-brand-primary);
        background: var(--dsw-alias-brand-primary);
        color: var(--dsw-alias-label-primary-inverted, #fff);
      }
      .dsh-sync-btn.primary:hover { filter: brightness(1.05); }
      .dsh-sync-grid {
        display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
        gap: 12px; margin-top: 14px;
      }
      .dsh-sync-card {
        border: 1px solid var(--dsw-alias-border-l1); border-radius: 12px;
        background: var(--dsw-alias-bg-layer-1); padding: 14px 16px;
      }
      .dsh-sync-card-label { color: var(--dsw-alias-label-secondary); font-size: 12px; }
      .dsh-sync-card-value { margin-top: 4px; font-size: 15px; font-weight: 600; overflow-wrap: anywhere; }
      .dsh-sync-card-value.mono { font-family: var(--dsh-font-mono, ui-monospace, monospace); font-size: 12.5px; }
      .dsh-sync-notice {
        margin-top: 20px; padding: 16px 18px; border: 1px solid var(--dsw-alias-border-l1);
        border-radius: 12px; background: var(--dsw-alias-bg-layer-1);
        color: var(--dsw-alias-label-secondary); font-size: 13px;
      }
      .dsh-sync-log {
        margin-top: 14px; padding: 14px 16px; border: 1px solid var(--dsw-alias-border-l1);
        border-radius: 12px; background: var(--dsw-alias-bg-layer-1);
      }
      .dsh-sync-log h3 { margin: 0 0 8px; font-size: 13px; font-weight: 600; }
      .dsh-sync-log pre {
        margin: 0; max-height: 190px; overflow: auto; white-space: pre-wrap;
        color: var(--dsw-alias-label-secondary);
        font-family: var(--dsh-font-mono, ui-monospace, monospace);
        font-size: 11.5px; line-height: 1.6;
      }
      .dsh-sync-info {
        display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 18px;
      }
      .dsh-sync-info-card {
        border: 1px solid var(--dsw-alias-border-l1); border-radius: 12px;
        background: var(--dsw-alias-bg-layer-1); padding: 14px 16px;
      }
      .dsh-sync-info-card h3 { margin: 0 0 4px; font-size: 13px; font-weight: 600; }
      .dsh-sync-info-card p { margin: 0; color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 1.6; }
      .dsh-sync-error { margin-top: 12px; color: var(--dsw-alias-state-danger-primary); font-size: 12.5px; }
      @media (max-width: 720px) { .dsh-sync-info { grid-template-columns: 1fr; } }
      @media (max-width: 640px) {
        .dsh-sync-page { padding: 24px 16px 40px; }
        .dsh-sync-hero { padding: 20px; }
        .dsh-sync-status { margin-left: 0; }
      }
    `;

    function CloudIcon({ size = 16 }) {
      return h('svg', {
        width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
        stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round',
        strokeLinejoin: 'round', 'aria-hidden': true,
      },
      h('path', { d: 'M7.2 18.2h9.9a3.9 3.9 0 0 0 .4-7.8A5.3 5.3 0 0 0 7 9a4.6 4.6 0 0 0 .2 9.2Z' }),
      h('path', { d: 'M9.2 13.3h5.6M12 10.5v5.6' }));
    }

    function readSession() {
      if (sessionStore.id) return sessionStore.id;
      try { return localStorage.getItem(SESSION_KEY) || null; } catch { return null; }
    }

    function rememberSession(sessionId) {
      if (!sessionId) return;
      sessionStore.id = sessionId;
      try { localStorage.setItem(SESSION_KEY, sessionId); } catch { /* ignore */ }
    }

    function fmtTime(value) {
      if (!value) return null;
      try { return new Date(value).toLocaleString(); } catch { return value; }
    }

    async function executeSync(ctx, sessionId, action, signal, argument = '') {
      const line = `/dsh-sync ${action}${argument ? ` ${argument}` : ''}`;
      const remote = await ctx.remote.commands.execute(sessionId, line, [], signal);
      if (remote && remote.ok === false) {
        throw new Error(remote.error?.message || 'command failed');
      }
      const execution = remote && typeof remote === 'object' && 'ok' in remote ? remote.value : remote;
      if (!execution) throw new Error('command did not resolve');
      const result = execution.result || execution;
      if (!result) throw new Error('command returned no result');
      if (result.kind === 'error') throw new Error(result.text || 'command failed');
      try {
        return JSON.parse(result.text || '{}');
      } catch {
        return { action, ok: true, output: result.text || '', data: null };
      }
    }

    function SyncHeaderEntry({ sessionId, ctx, t }) {
      React.useEffect(() => rememberSession(sessionId), [sessionId]);
      return h('button', {
        type: 'button',
        className: 'dsh-sync-header-entry',
        title: t('panel'),
        'aria-label': t('panel'),
        onClick: () => {
          rememberSession(sessionId);
          if (ctx.layout && typeof ctx.layout.selectPanel === 'function') {
            ctx.layout.selectPanel(PANEL_ID);
          }
        },
      }, [h(CloudIcon, { key: 'icon', size: 14 }), h('span', { key: 'label' }, t('label'))]);
    }

    function SyncPanel({ ctx, t }) {
      const [sessionId] = React.useState(() => readSession());
      const [status, setStatus] = React.useState(null);
      const [busy, setBusy] = React.useState('');
      const [error, setError] = React.useState('');
      const [log, setLog] = React.useState('');
      const [repoInput, setRepoInput] = React.useState('');
      const [branchInput, setBranchInput] = React.useState('main');
      const [maxFileMb, setMaxFileMb] = React.useState(10);
      const [intervalMinutes, setIntervalMinutes] = React.useState(10);
      const [scope, setScope] = React.useState({
        settings: true,
        plugins: true,
        skills: true,
        tools: true,
        workspaceMemory: true,
        projectMemory: true,
        kb: false,
      });
      const [projects, setProjects] = React.useState([]);
      const [selectedProjects, setSelectedProjects] = React.useState([]);

      const run = async (action, argument = '') => {
        if (!sessionId) {
          setError(t('noSession'));
          return;
        }
        setBusy(action);
        setError('');
        const controller = new AbortController();
        try {
          const result = await executeSync(ctx, sessionId, action, controller.signal, argument);
          if (action === 'status') {
            if (result.data) setStatus(result.data);
            else setError(t('loadFailed'));
          } else {
            setLog(result.output || t('emptyLog'));
            if (!result.ok) setError(action === 'configure' ? t('connectFailed') : t('actionFailed'));
            const next = await executeSync(ctx, sessionId, 'status', controller.signal);
            if (next.data) setStatus(next.data);
          }
        } catch (failure) {
          setError(`${t('actionFailed')}: ${failure?.message || failure}`);
        } finally {
          setBusy('');
        }
      };

      React.useEffect(() => {
        if (!sessionId) return undefined;
        run('status');
        const timer = setInterval(() => {
          if (!busy) run('status');
        }, 30000);
        return () => clearInterval(timer);
      }, [sessionId]);

      React.useEffect(() => {
        if (status?.remote) setRepoInput(status.remote);
      }, [status?.remote]);

      React.useEffect(() => {
        if (!status) return;
        setBranchInput(status.branch || 'main');
        setMaxFileMb(status.maxFileMb || 10);
        setIntervalMinutes(status.autosyncMinutes || 10);
        if (status.scope && typeof status.scope === 'object') {
          setScope({
            settings: status.scope.settings !== false,
            plugins: status.scope.plugins !== false,
            skills: status.scope.skills !== false,
            tools: status.scope.tools !== false,
            workspaceMemory: status.scope.workspaceMemory !== false,
            projectMemory: status.scope.projectMemory !== false,
            kb: !!status.scope.kb,
          });
        }
        const list = Array.isArray(status.projects) ? status.projects : [];
        setProjects(list);
        const saved = Array.isArray(status.projectNames) ? status.projectNames : [];
        setSelectedProjects(saved.length ? saved.filter((name) => list.includes(name)) : list);
      }, [
        status?.branch,
        status?.includeKb,
        status?.maxFileMb,
        status?.autosyncMinutes,
        status?.scope?.settings,
        status?.scope?.plugins,
        status?.scope?.skills,
        status?.scope?.tools,
        status?.scope?.workspaceMemory,
        status?.scope?.projectMemory,
        status?.scope?.kb,
        status?.projectNames?.join('|'),
        status?.projects?.join('|'),
      ]);

      const push = () => run('push');
      const pull = () => run('pull');
      const auto = () => run('autostart', String(intervalMinutes));
      const disableAuto = () => run('uninstall-autostart');
      const saveSettings = () => run('settings', JSON.stringify({
        branch: branchInput.trim(),
        includeProjectMemory: scope.projectMemory && selectedProjects.length > 0,
        includeKb: scope.kb,
        scope: {
          ...scope,
          projectMemory: scope.projectMemory && selectedProjects.length > 0,
        },
        projectNames: selectedProjects,
        maxFileMb: Number(maxFileMb) || 10,
        autosyncMinutes: Number(intervalMinutes) || 10,
      }));
      const toggleScope = (key) => setScope((previous) => ({ ...previous, [key]: !previous[key] }));
      const toggleProject = (name) => setSelectedProjects((previous) => (
        previous.includes(name)
          ? previous.filter((item) => item !== name)
          : [...previous, name]
      ));
      const back = () => {
        if (ctx.layout && typeof ctx.layout.selectPanel === 'function') {
          ctx.layout.selectPanel('conversation');
        }
      };
      const autostart = status?.autostart;
      const last = fmtTime(status?.lastSync);
      const localSize = status?.entries != null ? `${status.entries}` : '—';
      const intervalKey = `minutes${intervalMinutes}`;
      const intervalLabel = t(intervalKey) === intervalKey ? `${intervalMinutes} min` : t(intervalKey);

      return h('div', { className: 'dsh-sync-page' },
        h('div', { className: 'dsh-sync-inner' }, [
          h('div', { className: 'dsh-sync-topbar', key: 'topbar' },
            h('button', { type: 'button', className: 'dsh-sync-back', onClick: back }, `‹ ${t('back')}`)),
          h('div', { className: 'dsh-sync-eyebrow', key: 'eyebrow' }, t('cloud')),
          h('h1', { className: 'dsh-sync-title', key: 'title' }, t('title')),
          h('p', { className: 'dsh-sync-lede', key: 'lede' }, t('lede')),
          !sessionId ? h('div', { className: 'dsh-sync-notice', key: 'nosession' }, t('noSession')) : null,
          h('div', { className: 'dsh-sync-hero', key: 'hero' }, [
            h('span', { className: 'dsh-sync-hero-icon', key: 'icon' }, h(CloudIcon, { size: 22 })),
            h('div', { key: 'text' }, [
              h('div', { className: 'dsh-sync-hero-title', key: 'title' }, t('repo')),
              h('div', { className: 'dsh-sync-hero-sub', key: 'sub' }, status?.remote || t('notConfigured')),
            ]),
            h('span', { className: 'dsh-sync-status', key: 'status' }, status?.remote ? t('connected') : t('notConnected')),
          ]),
          h('div', { className: 'dsh-sync-setup', key: 'connect' }, [
            h('h3', { key: 'title' }, t('connect')),
            h('p', { key: 'hint' }, t('connectHint')),
            h('div', { className: 'dsh-sync-setup-row', key: 'row' }, [
              h('input', {
                key: 'input',
                className: 'dsh-sync-input',
                value: repoInput,
                placeholder: t('repoPlaceholder'),
                spellCheck: false,
                onChange: (event) => setRepoInput(event.target.value),
              }),
              h('button', {
                key: 'save',
                type: 'button',
                className: 'dsh-sync-btn primary',
                disabled: !!busy || !sessionId || !repoInput.trim() || repoInput.trim() === status?.remote,
                onClick: () => run('configure', repoInput.trim()),
              }, status?.remote ? t('changeButton') : t('connectButton')),
            ]),
          ]),
          h('div', { className: 'dsh-sync-settings', key: 'content' }, [
            h('h3', { key: 'title' }, t('content')),
            h('p', { key: 'hint' }, t('contentHint')),
            h('div', { className: 'dsh-sync-check-grid', key: 'scope' }, [
              h('label', { className: 'dsh-sync-check', key: 'settings' }, [
                h('input', { key: 'i', type: 'checkbox', checked: scope.settings, onChange: () => toggleScope('settings') }),
                h('span', { key: 'l' }, t('scopeSettings')),
              ]),
              h('label', { className: 'dsh-sync-check', key: 'plugins' }, [
                h('input', { key: 'i', type: 'checkbox', checked: scope.plugins, onChange: () => toggleScope('plugins') }),
                h('span', { key: 'l' }, t('scopePlugins')),
              ]),
              h('label', { className: 'dsh-sync-check', key: 'skills' }, [
                h('input', { key: 'i', type: 'checkbox', checked: scope.skills, onChange: () => toggleScope('skills') }),
                h('span', { key: 'l' }, t('scopeSkills')),
              ]),
              h('label', { className: 'dsh-sync-check', key: 'tools' }, [
                h('input', { key: 'i', type: 'checkbox', checked: scope.tools, onChange: () => toggleScope('tools') }),
                h('span', { key: 'l' }, t('scopeTools')),
              ]),
              h('label', { className: 'dsh-sync-check', key: 'workspace' }, [
                h('input', { key: 'i', type: 'checkbox', checked: scope.workspaceMemory, onChange: () => toggleScope('workspaceMemory') }),
                h('span', { key: 'l' }, t('scopeWorkspace')),
              ]),
              h('label', { className: 'dsh-sync-check', key: 'projects' }, [
                h('input', { key: 'i', type: 'checkbox', checked: scope.projectMemory, onChange: () => toggleScope('projectMemory') }),
                h('span', { key: 'l' }, t('scopeProjects')),
              ]),
              h('label', { className: 'dsh-sync-check', key: 'kb' }, [
                h('input', { key: 'i', type: 'checkbox', checked: scope.kb, onChange: () => toggleScope('kb') }),
                h('span', { key: 'l' }, t('scopeKb')),
              ]),
            ]),
            scope.projectMemory ? h('div', { className: 'dsh-sync-projects', key: 'project-list' }, [
              h('div', { className: 'dsh-sync-projects-title', key: 'title' }, t('projectsLabel')),
              projects.length
                ? h('div', { className: 'dsh-sync-project-list', key: 'list' }, projects.map((name) => h('label', {
                  key: name,
                  className: 'dsh-sync-check',
                }, [
                  h('input', {
                    key: 'i',
                    type: 'checkbox',
                    checked: selectedProjects.includes(name),
                    onChange: () => toggleProject(name),
                  }),
                  h('span', { key: 'l' }, name),
                ])))
                : h('div', { className: 'dsh-sync-empty', key: 'empty' }, t('projectsEmpty')),
            ]) : null,
          ]),
          h('div', { className: 'dsh-sync-settings', key: 'settings' }, [
            h('h3', { key: 'title' }, t('settings')),
            h('div', { className: 'dsh-sync-settings-grid', key: 'grid' }, [
              h('label', { className: 'dsh-sync-field', key: 'branch' }, [
                h('span', { key: 'l' }, t('branch')),
                h('input', {
                  key: 'i',
                  value: branchInput,
                  spellCheck: false,
                  onChange: (event) => setBranchInput(event.target.value),
                }),
              ]),
              h('label', { className: 'dsh-sync-field', key: 'interval' }, [
                h('span', { key: 'l' }, t('intervalMinutes')),
                h('select', {
                  key: 's',
                  value: intervalMinutes,
                  onChange: (event) => setIntervalMinutes(Number(event.target.value)),
                }, [5, 10, 15, 30, 60].map((minutes) => h('option', {
                  key: minutes,
                  value: minutes,
                }, t(`minutes${minutes}`)))),
              ]),
              h('label', { className: 'dsh-sync-field', key: 'max' }, [
                h('span', { key: 'l' }, t('maxFileMb')),
                h('input', {
                  key: 'i',
                  type: 'number',
                  min: 1,
                  max: 200,
                  value: maxFileMb,
                  onChange: (event) => setMaxFileMb(Number(event.target.value)),
                }),
              ]),
            ]),
            h('div', { className: 'dsh-sync-settings-actions', key: 'actions' }, [
              h('button', {
                key: 'save',
                type: 'button',
                className: 'dsh-sync-btn primary',
                disabled: !!busy || !sessionId,
                onClick: saveSettings,
              }, busy === 'settings' ? t('working') : t('saveSettings')),
              h('button', {
                key: 'auto',
                type: 'button',
                className: 'dsh-sync-btn',
                disabled: !!busy || !sessionId,
                onClick: auto,
              }, busy === 'autostart' ? t('working') : (autostart ? t('autoUpdate') : t('auto'))),
              autostart ? h('button', {
                key: 'disable',
                type: 'button',
                className: 'dsh-sync-btn',
                disabled: !!busy || !sessionId,
                onClick: disableAuto,
              }, t('disableAuto')) : null,
            ]),
          ]),
          h('div', { className: 'dsh-sync-actions', key: 'actions' }, [
            h('button', { key: 'push', type: 'button', className: 'dsh-sync-btn primary', disabled: !!busy || !sessionId || !status?.remote, onClick: push }, busy === 'push' ? t('working') : t('push')),
            h('button', { key: 'pull', type: 'button', className: 'dsh-sync-btn', disabled: !!busy || !sessionId || !status?.remote, onClick: pull }, busy === 'pull' ? t('working') : t('pull')),
            h('button', { key: 'refresh', type: 'button', className: 'dsh-sync-btn', disabled: !!busy || !sessionId, onClick: () => run('status') }, t('refresh')),
          ]),
          error ? h('div', { className: 'dsh-sync-error', key: 'error' }, error) : null,
          h('div', { className: 'dsh-sync-grid', key: 'grid' }, [
            h('div', { className: 'dsh-sync-card', key: 'last' }, [
              h('div', { className: 'dsh-sync-card-label', key: 'l' }, t('lastSync')),
              h('div', { className: 'dsh-sync-card-value', key: 'v' }, last || t('never')),
            ]),
            h('div', { className: 'dsh-sync-card', key: 'files' }, [
              h('div', { className: 'dsh-sync-card-label', key: 'l' }, t('files')),
              h('div', { className: 'dsh-sync-card-value', key: 'v' }, localSize),
            ]),
            h('div', { className: 'dsh-sync-card', key: 'auto' }, [
              h('div', { className: 'dsh-sync-card-label', key: 'l' }, t('autostart')),
              h('div', { className: 'dsh-sync-card-value', key: 'v' }, autostart
                ? `${t('enabled')} · ${intervalLabel}`
                : t('disabled')),
            ]),
            h('div', { className: 'dsh-sync-card', key: 'conflicts' }, [
              h('div', { className: 'dsh-sync-card-label', key: 'l' }, t('conflicts')),
              h('div', { className: 'dsh-sync-card-value', key: 'v' }, status?.conflicts ? String(status.conflicts) : t('none')),
            ]),
            h('div', { className: 'dsh-sync-card', key: 'head' }, [
              h('div', { className: 'dsh-sync-card-label', key: 'l' }, t('localState')),
              h('div', { className: 'dsh-sync-card-value mono', key: 'v' }, status?.head || '—'),
            ]),
          ]),
          log ? h('div', { className: 'dsh-sync-log', key: 'log' }, [
            h('h3', { key: 'h' }, t('log')),
            h('pre', { key: 'pre' }, log),
          ]) : null,
          h('div', { className: 'dsh-sync-info', key: 'info' }, [
            h('div', { className: 'dsh-sync-info-card', key: 'scope' }, [
              h('h3', { key: 'h' }, t('scope')),
              h('p', { key: 'p' }, t('scopeText')),
            ]),
            h('div', { className: 'dsh-sync-info-card', key: 'security' }, [
              h('h3', { key: 'h' }, t('security')),
              h('p', { key: 'p' }, t('securityText')),
            ]),
          ]),
          h('div', { className: 'dsh-sync-info', key: 'setup' },
            h('div', { className: 'dsh-sync-info-card' }, [
              h('h3', { key: 'h' }, t('setup')),
              h('p', { key: 'p' }, t('setupText')),
            ])),
        ]));
    }

    return {
      inject: ['slots', 'locale', 'layout', 'remote', 'remote.commands'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-sync: locale');
        const t = ctx.locale.bind(NS);
        ctx.effect(() => {
          const style = document.createElement('style');
          style.dataset.plugin = 'dsh-sync-ui';
          style.textContent = CSS;
          document.head.appendChild(style);
          return () => style.remove();
        }, 'dsh-sync: styles');

        ctx.slots.inject('conversation.session.header.utilities', () => ctx.slots.register({
          name: 'conversation.session.header.utilities',
          id: 'dsh-sync-header',
          order: -15,
          locale: NS,
          label: () => t('label'),
        }, (props) => h(SyncHeaderEntry, { ...props, ctx, t })));

        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist',
          id: PANEL_ID,
          order: 30,
          locale: NS,
          label: () => t('panel'),
        }, ({ size = 18 }) => h(CloudIcon, { size })));

        ctx.slots.inject('main', () => ctx.slots.register({
          name: 'main',
          key: PANEL_ID,
          locale: NS,
          inject: () => ({ ctx, t }),
        }, SyncPanel));
      },
    };
  },
});
