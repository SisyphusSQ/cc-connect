import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '@/i18n/locales/en.json';
import es from '@/i18n/locales/es.json';
import ja from '@/i18n/locales/ja.json';
import ko from '@/i18n/locales/ko.json';
import ru from '@/i18n/locales/ru.json';
import zh from '@/i18n/locales/zh.json';
import zhTW from '@/i18n/locales/zh-TW.json';

type Translation = Record<string, unknown>;

const factorTranslations: Record<string, Translation> = {
  en: {
    factor: {
      brandSubtitle: 'Agent operations', console: 'Factor Console', sessionCount: '{{count}} sessions',
      messageCount: '{{count}} messages', active: 'active', idle: 'idle', live: 'live', enable: 'Enable',
      disable: 'Disable', global: 'global', unsupportedMessage: 'Unsupported message', typing: 'Agent is responding…',
      theme: 'Theme', language: 'Language', openNavigation: 'Open navigation', expandNavigation: 'Expand navigation',
      collapseNavigation: 'Collapse navigation',
    },
    common: { copy: 'Copy', copied: 'Copied', edit: 'Edit', saved: 'Saved' },
    chat: { selectProject: 'Choose a project to open its live agent conversation.' },
    skills: {
      projectFilter: 'Choose project', searchPlaceholder: 'Search skills', sourceFilter: 'Filter by source', allSources: 'All sources',
      skill: 'Skill', description: 'Description', action: 'Action', details: 'Details', skillDetails: 'Skill details', copySource: 'Copy source',
      filteredSkillCount: '{{count}} of {{total}} skills', scanDirCount: 'Scan directories ({{count}})', noMatches: 'No matching skills',
      showTotal: '{{count}} skills', viewSource: 'View source', loadFailed: 'Failed to load local skills', presetsLoadFailed: 'Failed to load recommended skills',
    },
    sessions: {
      workspaceList: 'Session list', workspaceCount: '{{count}} sessions', searchPlaceholder: 'Search sessions',
      projectFilter: 'Filter by project', allPlatforms: 'All platforms', platformFilter: 'Filter by platform',
      statusFilter: 'Filter by status', allStatuses: 'All statuses', running: 'Running',
      partialLoad: 'Some projects could not be loaded: {{projects}}', selectHint: 'Select a session to continue',
      selectHintDetail: 'Sessions from every project are available on the left.',
      startWebSession: 'Start Web session', newSession: 'New session', startOtherProject: 'Start in another project',
      continue: 'Continue', chooseProjectHint: 'Choose the project for the Web session.', chooseProject: 'Choose a project',
      workProcess: 'Work process', thinkingSummary: 'Reasoning summary', toolCall: 'Tool call', toolResult: 'Tool result', processUpdate: 'Progress update',
      processRunning: 'Running', processCompleted: 'Completed', processFailed: 'Failed', processTruncated: 'Only the latest progress is shown.',
    },
    cron: {
      subtitle: 'Schedule prompts and local commands for project sessions.', task: 'Task', scope: 'Scope', status: 'Status', disabled: 'Disabled', error: 'Error', neverRun: 'Never run',
      details: 'Details', moreActions: 'More actions', runConfirm: 'Run this job now?', deleted: 'Job deleted', searchPlaceholder: 'Search scheduled jobs', projectFilter: 'Filter by project',
      status_all: 'All statuses', status_enabled: 'Enabled', status_disabled: 'Disabled', status_error: 'With errors', totalCount: '{{count}} total', enabledCount: '{{count}} enabled', errorCount: '{{count}} errors',
      loadFailed: 'Failed to load scheduled jobs', showTotal: '{{count}} jobs', noMatches: 'No matching jobs', customExpression: 'Custom expression', customSchedule: 'Custom schedule',
      every5Minutes: 'Every 5 minutes', every15Minutes: 'Every 15 minutes', everyHour: 'Every hour', daily9: 'Daily at 09:00', weekdays9: 'Every weekday at 09:00',
      taskContent: 'Task content', basicInfo: 'Basic information', sessionRequiredHint: 'The session determines where results are delivered.', selectSessionKeyRequired: 'Select a session',
      advanced: 'Advanced settings', sessionMode: 'Session mode', reuseSession: 'Reuse current session', newSessionPerRun: 'Create a new session for each run', timeout: 'Timeout',
      timeoutHint: 'Empty uses the 30-minute default; 0 means no limit.', minutes: 'min', notification: 'Notifications', notification_inherit: 'Follow global default',
      notification_all: 'Start and result', notification_result: 'Result only', notification_none: 'No notifications',
    },
    dashboard: { subtitle: 'System health, projects and recent conversations at a glance.' },
    heartbeat: { lastError: 'Last error', triggerConfirm: 'Run heartbeat now?', pauseConfirm: 'Pause heartbeat?', resumeConfirm: 'Resume heartbeat?', everyMinutes: 'Every {{count}} min', runSummary: '{{count}} runs', notEnabledShort: 'Not enabled' },
    projects: {
      subtitle: 'Manage agents, platforms and project-level behavior.', showWorkdirIndicator: 'Working directory indicator',
      showWorkdirIndicatorHint: 'Show the working directory in agent replies', resourceSummary: 'Resource summary', manageSessions: 'Manage sessions', connected: 'Connected', offline: 'Offline', permissionDefault: 'Default', permissionAcceptEdits: 'Accept edits', permissionPlan: 'Plan', permissionBypass: 'Bypass permissions', permissionDontAsk: "Don\'t ask",
    },
    system: { subtitle: 'Runtime settings, raw configuration and service controls.', viewRawConfig: 'View raw config', serviceOperations: 'Service operations', serviceOperationsHint: 'Reload configuration from disk or restart the running service.', unsaved: 'Unsaved changes', upToDate: 'Settings up to date' },
    setup: { projectInfo: 'Project info', platformStep: 'Platform', setupStep: 'Setup' },
  },
  zh: {
    factor: {
      brandSubtitle: '智能体运维', console: 'Factor 控制台', sessionCount: '{{count}} 个会话',
      messageCount: '{{count}} 条消息', active: '活跃', idle: '空闲', live: '在线', enable: '启用',
      disable: '停用', global: '全局', unsupportedMessage: '暂不支持的消息', typing: '智能体正在回复…',
      theme: '主题', language: '语言', openNavigation: '打开导航', expandNavigation: '展开导航', collapseNavigation: '收起导航',
    },
    common: { copy: '复制', copied: '已复制', edit: '编辑', saved: '已保存' },
    chat: { selectProject: '选择一个项目，打开智能体实时会话。' },
    skills: {
      projectFilter: '选择项目', searchPlaceholder: '搜索技能', sourceFilter: '按来源筛选', allSources: '全部来源',
      skill: '技能', description: '说明', action: '操作', details: '详情', skillDetails: '技能详情', copySource: '复制来源',
      filteredSkillCount: '显示 {{count}} / {{total}} 个技能', scanDirCount: '扫描目录（{{count}}）', noMatches: '没有匹配的技能',
      showTotal: '共 {{count}} 个技能', viewSource: '查看来源', loadFailed: '本地技能加载失败', presetsLoadFailed: '推荐技能加载失败',
    },
    sessions: {
      workspaceList: '会话列表', workspaceCount: '{{count}} 个会话', searchPlaceholder: '搜索会话',
      projectFilter: '按项目筛选', allPlatforms: '全部平台', platformFilter: '按平台筛选',
      statusFilter: '按状态筛选', allStatuses: '全部状态', running: '运行中',
      partialLoad: '以下项目加载失败：{{projects}}', selectHint: '选择一个会话继续',
      selectHintDetail: '左侧汇总了所有项目的会话。',
      startWebSession: '开始 Web 会话', newSession: '新建会话', startOtherProject: '在其他项目开始会话',
      continue: '继续', chooseProjectHint: '选择 Web 会话所属的项目。', chooseProject: '选择项目',
      workProcess: '工作过程', thinkingSummary: '思考摘要', toolCall: '工具调用', toolResult: '工具结果', processUpdate: '过程更新',
      processRunning: '进行中', processCompleted: '已完成', processFailed: '失败', processTruncated: '仅展示最近的过程记录。',
    },
    cron: {
      subtitle: '为项目会话定时执行提示词或本地命令。', task: '任务', scope: '作用范围', status: '状态', disabled: '已停用', error: '异常', neverRun: '尚未运行',
      details: '详情', moreActions: '更多操作', runConfirm: '确定立即执行这个任务吗？', deleted: '任务已删除', searchPlaceholder: '搜索定时任务', projectFilter: '按项目筛选',
      status_all: '全部状态', status_enabled: '已启用', status_disabled: '已停用', status_error: '有异常', totalCount: '共 {{count}} 个', enabledCount: '{{count}} 个启用', errorCount: '{{count}} 个异常',
      loadFailed: '定时任务加载失败', showTotal: '共 {{count}} 个任务', noMatches: '没有匹配的任务', customExpression: '自定义表达式', customSchedule: '自定义计划',
      every5Minutes: '每 5 分钟', every15Minutes: '每 15 分钟', everyHour: '每小时', daily9: '每天 09:00', weekdays9: '工作日 09:00',
      taskContent: '任务内容', basicInfo: '基本信息', sessionRequiredHint: '会话决定任务结果发送到哪里。', selectSessionKeyRequired: '选择会话',
      advanced: '高级设置', sessionMode: '会话模式', reuseSession: '复用当前会话', newSessionPerRun: '每次运行新建会话', timeout: '超时时间',
      timeoutHint: '留空使用默认 30 分钟；0 表示不限制。', minutes: '分钟', notification: '通知策略', notification_inherit: '跟随全局默认',
      notification_all: '开始和结果都通知', notification_result: '仅通知结果', notification_none: '不发送通知',
    },
    dashboard: { subtitle: '集中查看系统状态、项目和最近会话。' },
    heartbeat: { lastError: '最近错误', triggerConfirm: '确定立即执行心跳吗？', pauseConfirm: '确定暂停心跳吗？', resumeConfirm: '确定恢复心跳吗？', everyMinutes: '每 {{count}} 分钟', runSummary: '已执行 {{count}} 次', notEnabledShort: '未启用' },
    projects: {
      subtitle: '管理智能体、平台和项目级行为。', showWorkdirIndicator: '工作目录标识',
      showWorkdirIndicatorHint: '在智能体回复中显示当前工作目录', resourceSummary: '资源概览', manageSessions: '管理会话', connected: '已连接', offline: '离线', permissionDefault: '默认', permissionAcceptEdits: '自动接受编辑', permissionPlan: '规划模式', permissionBypass: '跳过权限检查', permissionDontAsk: '不询问',
    },
    system: { subtitle: '管理运行时设置、原始配置和服务操作。', viewRawConfig: '查看原始配置', serviceOperations: '服务操作', serviceOperationsHint: '从磁盘重新加载配置，或重启当前服务。', unsaved: '有未保存的更改', upToDate: '设置已是最新' },
    setup: { projectInfo: '项目信息', platformStep: '连接平台', setupStep: '完成配置' },
  },
  'zh-TW': {
    factor: {
      brandSubtitle: '智慧代理營運', console: 'Factor 控制台', sessionCount: '{{count}} 個工作階段',
      messageCount: '{{count}} 則訊息', active: '活躍', idle: '閒置', live: '在線', enable: '啟用',
      disable: '停用', global: '全域', unsupportedMessage: '尚不支援的訊息', typing: '智慧代理正在回覆…',
      theme: '主題', language: '語言', openNavigation: '開啟導覽', expandNavigation: '展開導覽', collapseNavigation: '收合導覽',
    },
    common: { copy: '複製', copied: '已複製', edit: '編輯', saved: '已儲存' },
    chat: { selectProject: '選擇一個專案，開啟智慧代理即時對話。' },
    skills: {
      projectFilter: '選擇專案', searchPlaceholder: '搜尋技能', sourceFilter: '依來源篩選', allSources: '所有來源',
      skill: '技能', description: '說明', action: '操作', details: '詳情', skillDetails: '技能詳情', copySource: '複製來源',
      filteredSkillCount: '顯示 {{count}} / {{total}} 個技能', scanDirCount: '掃描目錄（{{count}}）', noMatches: '沒有符合的技能',
      showTotal: '共 {{count}} 個技能', viewSource: '查看來源', loadFailed: '本機技能載入失敗', presetsLoadFailed: '推薦技能載入失敗',
    },
    sessions: {
      workspaceList: '工作階段列表', workspaceCount: '{{count}} 個工作階段', searchPlaceholder: '搜尋工作階段',
      projectFilter: '依專案篩選', allPlatforms: '所有平台', platformFilter: '依平台篩選',
      statusFilter: '依狀態篩選', allStatuses: '所有狀態', running: '執行中',
      partialLoad: '以下專案載入失敗：{{projects}}', selectHint: '選擇工作階段以繼續',
      selectHintDetail: '左側彙整了所有專案的工作階段。',
      startWebSession: '開始 Web 工作階段', newSession: '新增工作階段', startOtherProject: '在其他專案開始工作階段',
      continue: '繼續', chooseProjectHint: '選擇 Web 工作階段所屬的專案。', chooseProject: '選擇專案',
      workProcess: '工作過程', thinkingSummary: '思考摘要', toolCall: '工具呼叫', toolResult: '工具結果', processUpdate: '過程更新',
      processRunning: '進行中', processCompleted: '已完成', processFailed: '失敗', processTruncated: '僅顯示最近的過程記錄。',
    },
    cron: {
      subtitle: '為專案工作階段排程提示詞或本機命令。', task: '工作', scope: '範圍', status: '狀態', disabled: '已停用', error: '異常', neverRun: '尚未執行',
      details: '詳情', moreActions: '更多操作', runConfirm: '確定立即執行這個工作嗎？', deleted: '工作已刪除', searchPlaceholder: '搜尋排程工作', projectFilter: '依專案篩選',
      status_all: '所有狀態', status_enabled: '已啟用', status_disabled: '已停用', status_error: '有異常', totalCount: '共 {{count}} 個', enabledCount: '{{count}} 個啟用', errorCount: '{{count}} 個異常',
      loadFailed: '排程工作載入失敗', showTotal: '共 {{count}} 個工作', noMatches: '沒有符合的工作', customExpression: '自訂表示式', customSchedule: '自訂排程',
      every5Minutes: '每 5 分鐘', every15Minutes: '每 15 分鐘', everyHour: '每小時', daily9: '每天 09:00', weekdays9: '工作日 09:00',
      taskContent: '工作內容', basicInfo: '基本資訊', sessionRequiredHint: '工作階段決定結果傳送的位置。', selectSessionKeyRequired: '選擇工作階段',
      advanced: '進階設定', sessionMode: '工作階段模式', reuseSession: '重用目前工作階段', newSessionPerRun: '每次執行建立新工作階段', timeout: '逾時時間',
      timeoutHint: '留空使用預設 30 分鐘；0 表示不限制。', minutes: '分鐘', notification: '通知策略', notification_inherit: '依全域預設',
      notification_all: '開始與結果都通知', notification_result: '僅通知結果', notification_none: '不傳送通知',
    },
    dashboard: { subtitle: '集中檢視系統狀態、專案與最近工作階段。' },
    heartbeat: { lastError: '最近錯誤', triggerConfirm: '確定立即執行心跳嗎？', pauseConfirm: '確定暫停心跳嗎？', resumeConfirm: '確定恢復心跳嗎？', everyMinutes: '每 {{count}} 分鐘', runSummary: '已執行 {{count}} 次', notEnabledShort: '未啟用' },
    projects: {
      subtitle: '管理智慧代理、平台與專案層級行為。', showWorkdirIndicator: '工作目錄標示',
      showWorkdirIndicatorHint: '在智慧代理回覆中顯示目前工作目錄', resourceSummary: '資源概覽', manageSessions: '管理工作階段', connected: '已連線', offline: '離線', permissionDefault: '預設', permissionAcceptEdits: '自動接受編輯', permissionPlan: '規劃模式', permissionBypass: '略過權限檢查', permissionDontAsk: '不詢問',
    },
    system: { subtitle: '管理執行階段設定、原始設定與服務操作。', viewRawConfig: '查看原始設定', serviceOperations: '服務操作', serviceOperationsHint: '從磁碟重新載入設定，或重新啟動目前服務。', unsaved: '有未儲存的變更', upToDate: '設定已是最新' },
    setup: { projectInfo: '專案資訊', platformStep: '連接平台', setupStep: '完成設定' },
  },
  ja: {
    factor: {
      brandSubtitle: 'エージェント運用', console: 'Factor コンソール', sessionCount: '{{count}} セッション',
      messageCount: '{{count}} 件のメッセージ', active: 'アクティブ', idle: '待機中', live: 'オンライン', enable: '有効化',
      disable: '無効化', global: 'グローバル', unsupportedMessage: '未対応のメッセージ', typing: 'エージェントが応答中…',
      theme: 'テーマ', language: '言語', openNavigation: 'ナビゲーションを開く', expandNavigation: 'ナビゲーションを展開',
      collapseNavigation: 'ナビゲーションを折りたたむ',
    },
    common: { copy: 'コピー', copied: 'コピーしました', edit: '編集', saved: '保存しました' },
    chat: { selectProject: 'プロジェクトを選択して、エージェントとのライブ会話を開きます。' },
    skills: {
      projectFilter: 'プロジェクトを選択', searchPlaceholder: 'スキルを検索', sourceFilter: 'ソースで絞り込む', allSources: 'すべてのソース',
      skill: 'スキル', description: '説明', action: '操作', details: '詳細', skillDetails: 'スキル詳細', copySource: 'ソースをコピー',
      filteredSkillCount: '{{total}} 件中 {{count}} 件', scanDirCount: 'スキャンディレクトリ（{{count}}）', noMatches: '一致するスキルはありません',
      showTotal: '{{count}} 件のスキル', viewSource: 'ソースを表示', loadFailed: 'ローカルスキルを読み込めませんでした', presetsLoadFailed: 'おすすめスキルを読み込めませんでした',
    },
    sessions: {
      workspaceList: 'セッション一覧', workspaceCount: '{{count}} セッション', searchPlaceholder: 'セッションを検索',
      projectFilter: 'プロジェクトで絞り込む', allPlatforms: 'すべてのプラットフォーム', platformFilter: 'プラットフォームで絞り込む',
      statusFilter: '状態で絞り込む', allStatuses: 'すべての状態', running: '実行中',
      partialLoad: '次のプロジェクトを読み込めませんでした：{{projects}}', selectHint: '続行するセッションを選択',
      selectHintDetail: 'すべてのプロジェクトのセッションが左側に表示されます。',
      startWebSession: 'Web セッションを開始', newSession: '新しいセッション', startOtherProject: '別のプロジェクトで開始',
      continue: '続行', chooseProjectHint: 'Web セッションのプロジェクトを選択してください。', chooseProject: 'プロジェクトを選択',
      workProcess: '作業プロセス', thinkingSummary: '思考の要約', toolCall: 'ツール呼び出し', toolResult: 'ツール結果', processUpdate: '進捗更新',
      processRunning: '実行中', processCompleted: '完了', processFailed: '失敗', processTruncated: '最新の進捗のみ表示しています。',
    },
    cron: {
      subtitle: 'プロジェクトセッションのプロンプトやローカルコマンドをスケジュールします。', task: 'ジョブ', scope: '対象', status: '状態', disabled: '無効', error: 'エラー', neverRun: '未実行',
      details: '詳細', moreActions: 'その他の操作', runConfirm: 'このジョブを今すぐ実行しますか？', deleted: 'ジョブを削除しました', searchPlaceholder: 'スケジュールジョブを検索', projectFilter: 'プロジェクトで絞り込む',
      status_all: 'すべての状態', status_enabled: '有効', status_disabled: '無効', status_error: 'エラーあり', totalCount: '全 {{count}} 件', enabledCount: '有効 {{count}} 件', errorCount: 'エラー {{count}} 件',
      loadFailed: 'スケジュールジョブを読み込めませんでした', showTotal: '{{count}} 件のジョブ', noMatches: '一致するジョブはありません', customExpression: 'カスタム式', customSchedule: 'カスタムスケジュール',
      every5Minutes: '5 分ごと', every15Minutes: '15 分ごと', everyHour: '1 時間ごと', daily9: '毎日 09:00', weekdays9: '平日 09:00',
      taskContent: 'ジョブ内容', basicInfo: '基本情報', sessionRequiredHint: 'セッションは結果の送信先を決定します。', selectSessionKeyRequired: 'セッションを選択',
      advanced: '詳細設定', sessionMode: 'セッションモード', reuseSession: '現在のセッションを再利用', newSessionPerRun: '実行ごとに新しいセッションを作成', timeout: 'タイムアウト',
      timeoutHint: '空欄は既定の 30 分、0 は無制限です。', minutes: '分', notification: '通知', notification_inherit: 'グローバル既定に従う',
      notification_all: '開始と結果', notification_result: '結果のみ', notification_none: '通知しない',
    },
    dashboard: { subtitle: 'システム状態、プロジェクト、最近の会話をまとめて確認します。' },
    heartbeat: { lastError: '最新のエラー', triggerConfirm: 'ハートビートを今すぐ実行しますか？', pauseConfirm: 'ハートビートを一時停止しますか？', resumeConfirm: 'ハートビートを再開しますか？', everyMinutes: '{{count}} 分ごと', runSummary: '{{count}} 回実行', notEnabledShort: '無効' },
    projects: {
      subtitle: 'エージェント、プラットフォーム、プロジェクト単位の動作を管理します。', showWorkdirIndicator: '作業ディレクトリ表示',
      showWorkdirIndicatorHint: 'エージェントの返信に作業ディレクトリを表示します', resourceSummary: 'リソース概要', manageSessions: 'セッション管理', connected: '接続済み', offline: 'オフライン', permissionDefault: 'デフォルト', permissionAcceptEdits: '編集を許可', permissionPlan: '計画モード', permissionBypass: '権限を省略', permissionDontAsk: '確認しない',
    },
    system: { subtitle: 'ランタイム設定、元の設定、サービス操作を管理します。', viewRawConfig: '元の設定を表示', serviceOperations: 'サービス操作', serviceOperationsHint: 'ディスクから設定を再読込するか、実行中のサービスを再起動します。', unsaved: '未保存の変更', upToDate: '設定は最新です' },
    setup: { projectInfo: 'プロジェクト情報', platformStep: 'プラットフォーム', setupStep: 'セットアップ' },
  },
  es: {
    factor: {
      brandSubtitle: 'Operaciones de agentes', console: 'Consola Factor', sessionCount: '{{count}} sesiones',
      messageCount: '{{count}} mensajes', active: 'activo', idle: 'inactivo', live: 'en línea', enable: 'Activar',
      disable: 'Desactivar', global: 'global', unsupportedMessage: 'Mensaje no compatible', typing: 'El agente está respondiendo…',
      theme: 'Tema', language: 'Idioma', openNavigation: 'Abrir navegación', expandNavigation: 'Expandir navegación',
      collapseNavigation: 'Contraer navegación',
    },
    common: { copy: 'Copiar', copied: 'Copiado', edit: 'Editar', saved: 'Guardado' },
    chat: { selectProject: 'Elige un proyecto para abrir la conversación en vivo con su agente.' },
    skills: {
      projectFilter: 'Elegir proyecto', searchPlaceholder: 'Buscar habilidades', sourceFilter: 'Filtrar por origen', allSources: 'Todos los orígenes',
      skill: 'Habilidad', description: 'Descripción', action: 'Acción', details: 'Detalles', skillDetails: 'Detalles de la habilidad', copySource: 'Copiar origen',
      filteredSkillCount: '{{count}} de {{total}} habilidades', scanDirCount: 'Directorios de análisis ({{count}})', noMatches: 'No hay habilidades coincidentes',
      showTotal: '{{count}} habilidades', viewSource: 'Ver origen', loadFailed: 'No se pudieron cargar las habilidades locales', presetsLoadFailed: 'No se pudieron cargar las habilidades recomendadas',
    },
    sessions: {
      workspaceList: 'Lista de sesiones', workspaceCount: '{{count}} sesiones', searchPlaceholder: 'Buscar sesiones',
      projectFilter: 'Filtrar por proyecto', allPlatforms: 'Todas las plataformas', platformFilter: 'Filtrar por plataforma',
      statusFilter: 'Filtrar por estado', allStatuses: 'Todos los estados', running: 'En ejecución',
      partialLoad: 'No se pudieron cargar algunos proyectos: {{projects}}', selectHint: 'Selecciona una sesión para continuar',
      selectHintDetail: 'Las sesiones de todos los proyectos están disponibles a la izquierda.',
      startWebSession: 'Iniciar sesión web', newSession: 'Nueva sesión', startOtherProject: 'Iniciar en otro proyecto',
      continue: 'Continuar', chooseProjectHint: 'Elige el proyecto para la sesión web.', chooseProject: 'Elegir proyecto',
      workProcess: 'Proceso de trabajo', thinkingSummary: 'Resumen de razonamiento', toolCall: 'Llamada de herramienta', toolResult: 'Resultado de herramienta', processUpdate: 'Actualización de progreso',
      processRunning: 'En curso', processCompleted: 'Completado', processFailed: 'Error', processTruncated: 'Solo se muestra el progreso más reciente.',
    },
    cron: {
      subtitle: 'Programa prompts y comandos locales para las sesiones del proyecto.', task: 'Tarea', scope: 'Ámbito', status: 'Estado', disabled: 'Desactivada', error: 'Error', neverRun: 'Sin ejecutar',
      details: 'Detalles', moreActions: 'Más acciones', runConfirm: '¿Ejecutar esta tarea ahora?', deleted: 'Tarea eliminada', searchPlaceholder: 'Buscar tareas programadas', projectFilter: 'Filtrar por proyecto',
      status_all: 'Todos los estados', status_enabled: 'Activadas', status_disabled: 'Desactivadas', status_error: 'Con errores', totalCount: '{{count}} en total', enabledCount: '{{count}} activadas', errorCount: '{{count}} errores',
      loadFailed: 'No se pudieron cargar las tareas programadas', showTotal: '{{count}} tareas', noMatches: 'No hay tareas coincidentes', customExpression: 'Expresión personalizada', customSchedule: 'Programación personalizada',
      every5Minutes: 'Cada 5 minutos', every15Minutes: 'Cada 15 minutos', everyHour: 'Cada hora', daily9: 'Cada día a las 09:00', weekdays9: 'Días laborables a las 09:00',
      taskContent: 'Contenido de la tarea', basicInfo: 'Información básica', sessionRequiredHint: 'La sesión determina dónde se entregan los resultados.', selectSessionKeyRequired: 'Seleccionar una sesión',
      advanced: 'Ajustes avanzados', sessionMode: 'Modo de sesión', reuseSession: 'Reutilizar la sesión actual', newSessionPerRun: 'Crear una sesión en cada ejecución', timeout: 'Tiempo de espera',
      timeoutHint: 'Vacío usa 30 minutos; 0 significa sin límite.', minutes: 'min', notification: 'Notificaciones', notification_inherit: 'Usar valor global',
      notification_all: 'Inicio y resultado', notification_result: 'Solo resultado', notification_none: 'Sin notificaciones',
    },
    dashboard: { subtitle: 'Consulta el estado del sistema, los proyectos y las conversaciones recientes.' },
    heartbeat: { lastError: 'Último error', triggerConfirm: '¿Ejecutar el heartbeat ahora?', pauseConfirm: '¿Pausar el heartbeat?', resumeConfirm: '¿Reanudar el heartbeat?', everyMinutes: 'Cada {{count}} min', runSummary: '{{count}} ejecuciones', notEnabledShort: 'No activado' },
    projects: {
      subtitle: 'Administra agentes, plataformas y el comportamiento de cada proyecto.', showWorkdirIndicator: 'Indicador del directorio de trabajo',
      showWorkdirIndicatorHint: 'Muestra el directorio de trabajo en las respuestas del agente', resourceSummary: 'Resumen de recursos', manageSessions: 'Gestionar sesiones', connected: 'Conectado', offline: 'Sin conexión', permissionDefault: 'Predeterminado', permissionAcceptEdits: 'Aceptar ediciones', permissionPlan: 'Planificación', permissionBypass: 'Omitir permisos', permissionDontAsk: 'No preguntar',
    },
    system: { subtitle: 'Administra los ajustes de ejecución, la configuración original y los controles del servicio.', viewRawConfig: 'Ver configuración original', serviceOperations: 'Operaciones del servicio', serviceOperationsHint: 'Recarga la configuración del disco o reinicia el servicio activo.', unsaved: 'Cambios sin guardar', upToDate: 'Ajustes actualizados' },
    setup: { projectInfo: 'Información del proyecto', platformStep: 'Plataforma', setupStep: 'Configuración' },
  },
  ko: {
    factor: {
      brandSubtitle: '에이전트 운영', console: 'Factor 콘솔', sessionCount: '세션 {{count}}개',
      messageCount: '메시지 {{count}}개', active: '활성', idle: '대기', live: '온라인', enable: '활성화',
      disable: '비활성화', global: '전역', unsupportedMessage: '지원하지 않는 메시지', typing: '에이전트가 응답 중입니다…',
      theme: '테마', language: '언어', openNavigation: '탐색 열기', expandNavigation: '탐색 펼치기', collapseNavigation: '탐색 접기',
    },
    common: { copy: '복사', copied: '복사됨', edit: '편집', saved: '저장됨' },
    chat: { selectProject: '프로젝트를 선택해 에이전트와의 실시간 대화를 여세요.' },
    skills: {
      projectFilter: '프로젝트 선택', searchPlaceholder: '스킬 검색', sourceFilter: '소스별 필터', allSources: '모든 소스',
      skill: '스킬', description: '설명', action: '작업', details: '상세', skillDetails: '스킬 상세', copySource: '소스 복사',
      filteredSkillCount: '{{total}}개 중 {{count}}개 스킬', scanDirCount: '검색 디렉터리({{count}})', noMatches: '일치하는 스킬이 없습니다',
      showTotal: '스킬 {{count}}개', viewSource: '소스 보기', loadFailed: '로컬 스킬을 불러오지 못했습니다', presetsLoadFailed: '추천 스킬을 불러오지 못했습니다',
    },
    sessions: {
      workspaceList: '세션 목록', workspaceCount: '세션 {{count}}개', searchPlaceholder: '세션 검색',
      projectFilter: '프로젝트별 필터', allPlatforms: '모든 플랫폼', platformFilter: '플랫폼별 필터',
      statusFilter: '상태별 필터', allStatuses: '모든 상태', running: '실행 중',
      partialLoad: '일부 프로젝트를 불러오지 못했습니다: {{projects}}', selectHint: '계속할 세션을 선택하세요',
      selectHintDetail: '모든 프로젝트의 세션이 왼쪽에 표시됩니다.',
      startWebSession: 'Web 세션 시작', newSession: '새 세션', startOtherProject: '다른 프로젝트에서 시작',
      continue: '계속', chooseProjectHint: 'Web 세션의 프로젝트를 선택하세요.', chooseProject: '프로젝트 선택',
      workProcess: '작업 과정', thinkingSummary: '추론 요약', toolCall: '도구 호출', toolResult: '도구 결과', processUpdate: '진행 업데이트',
      processRunning: '진행 중', processCompleted: '완료', processFailed: '실패', processTruncated: '최근 진행 기록만 표시합니다.',
    },
    cron: {
      subtitle: '프로젝트 세션의 프롬프트와 로컬 명령을 예약합니다.', task: '작업', scope: '범위', status: '상태', disabled: '비활성', error: '오류', neverRun: '실행 전',
      details: '상세', moreActions: '추가 작업', runConfirm: '이 작업을 지금 실행할까요?', deleted: '작업이 삭제되었습니다', searchPlaceholder: '예약 작업 검색', projectFilter: '프로젝트별 필터',
      status_all: '모든 상태', status_enabled: '활성', status_disabled: '비활성', status_error: '오류 있음', totalCount: '총 {{count}}개', enabledCount: '활성 {{count}}개', errorCount: '오류 {{count}}개',
      loadFailed: '예약 작업을 불러오지 못했습니다', showTotal: '작업 {{count}}개', noMatches: '일치하는 작업이 없습니다', customExpression: '사용자 지정 표현식', customSchedule: '사용자 지정 일정',
      every5Minutes: '5분마다', every15Minutes: '15분마다', everyHour: '매시간', daily9: '매일 09:00', weekdays9: '평일 09:00',
      taskContent: '작업 내용', basicInfo: '기본 정보', sessionRequiredHint: '세션은 결과가 전달될 위치를 결정합니다.', selectSessionKeyRequired: '세션 선택',
      advanced: '고급 설정', sessionMode: '세션 모드', reuseSession: '현재 세션 재사용', newSessionPerRun: '실행할 때마다 새 세션 생성', timeout: '시간 제한',
      timeoutHint: '비워 두면 기본 30분, 0은 제한 없음입니다.', minutes: '분', notification: '알림', notification_inherit: '전역 기본값 사용',
      notification_all: '시작 및 결과', notification_result: '결과만', notification_none: '알림 없음',
    },
    dashboard: { subtitle: '시스템 상태, 프로젝트, 최근 대화를 한눈에 확인합니다.' },
    heartbeat: { lastError: '최근 오류', triggerConfirm: '하트비트를 지금 실행할까요?', pauseConfirm: '하트비트를 일시 중지할까요?', resumeConfirm: '하트비트를 다시 시작할까요?', everyMinutes: '{{count}}분마다', runSummary: '{{count}}회 실행', notEnabledShort: '비활성' },
    projects: {
      subtitle: '에이전트, 플랫폼, 프로젝트별 동작을 관리합니다.', showWorkdirIndicator: '작업 디렉터리 표시',
      showWorkdirIndicatorHint: '에이전트 응답에 현재 작업 디렉터리를 표시합니다', resourceSummary: '리소스 요약', manageSessions: '세션 관리', connected: '연결됨', offline: '오프라인', permissionDefault: '기본값', permissionAcceptEdits: '편집 허용', permissionPlan: '계획 모드', permissionBypass: '권한 검사 생략', permissionDontAsk: '묻지 않음',
    },
    system: { subtitle: '런타임 설정, 원본 구성, 서비스 제어를 관리합니다.', viewRawConfig: '원본 구성 보기', serviceOperations: '서비스 작업', serviceOperationsHint: '디스크에서 구성을 다시 불러오거나 실행 중인 서비스를 재시작합니다.', unsaved: '저장하지 않은 변경', upToDate: '설정이 최신 상태입니다' },
    setup: { projectInfo: '프로젝트 정보', platformStep: '플랫폼', setupStep: '설정' },
  },
  ru: {
    factor: {
      brandSubtitle: 'Операции агентов', console: 'Консоль Factor', sessionCount: '{{count}} сессий',
      messageCount: '{{count}} сообщений', active: 'активна', idle: 'простаивает', live: 'онлайн', enable: 'Включить',
      disable: 'Отключить', global: 'глобальный', unsupportedMessage: 'Неподдерживаемое сообщение', typing: 'Агент отвечает…',
      theme: 'Тема', language: 'Язык', openNavigation: 'Открыть навигацию', expandNavigation: 'Развернуть навигацию', collapseNavigation: 'Свернуть навигацию',
    },
    common: { copy: 'Копировать', copied: 'Скопировано', edit: 'Изменить', saved: 'Сохранено' },
    chat: { selectProject: 'Выберите проект, чтобы открыть живой диалог с агентом.' },
    skills: {
      projectFilter: 'Выберите проект', searchPlaceholder: 'Поиск навыков', sourceFilter: 'Фильтр по источнику', allSources: 'Все источники',
      skill: 'Навык', description: 'Описание', action: 'Действие', details: 'Подробности', skillDetails: 'Подробности навыка', copySource: 'Копировать источник',
      filteredSkillCount: '{{count}} из {{total}} навыков', scanDirCount: 'Папки сканирования ({{count}})', noMatches: 'Совпадений нет', showTotal: '{{count}} навыков', viewSource: 'Открыть источник', loadFailed: 'Не удалось загрузить локальные навыки', presetsLoadFailed: 'Не удалось загрузить рекомендуемые навыки',
    },
    sessions: {
      workspaceList: 'Список сессий', workspaceCount: '{{count}} сессий', searchPlaceholder: 'Поиск сессий',
      projectFilter: 'Фильтр по проекту', allPlatforms: 'Все платформы', platformFilter: 'Фильтр по платформе',
      statusFilter: 'Фильтр по статусу', allStatuses: 'Все статусы', running: 'Выполняется',
      selectHint: 'Выберите сессию, чтобы продолжить', selectHintDetail: 'Сессии всех проектов доступны слева.',
      startWebSession: 'Начать Web-сессию', newSession: 'Новая сессия', startOtherProject: 'Начать в другом проекте',
      continue: 'Продолжить', chooseProjectHint: 'Выберите проект для Web-сессии.', chooseProject: 'Выберите проект',
      workProcess: 'Процесс работы', thinkingSummary: 'Краткое содержание рассуждений', toolCall: 'Вызов инструмента', toolResult: 'Результат инструмента', processUpdate: 'Обновление процесса',
      processRunning: 'Выполняется', processCompleted: 'Завершено', processFailed: 'Ошибка', processTruncated: 'Показаны только последние записи процесса.',
    },
    cron: {
      searchPlaceholder: 'Поиск запланированных задач', runConfirm: 'Запустить эту задачу сейчас?', weekdays9: 'Каждый будний день в 09:00',
    },
    dashboard: { subtitle: 'Состояние системы, проекты и последние разговоры — на одном экране.' },
    projects: {
      subtitle: 'Управление агентами, платформами и поведением проектов.', showWorkdirIndicator: 'Индикатор рабочей папки',
      showWorkdirIndicatorHint: 'Показывать рабочую папку в ответах агента', resourceSummary: 'Сводка ресурсов', manageSessions: 'Управление сессиями', connected: 'Подключено', offline: 'Офлайн', permissionDefault: 'По умолчанию', permissionAcceptEdits: 'Разрешить изменения', permissionPlan: 'План', permissionBypass: 'Обойти разрешения', permissionDontAsk: 'Не спрашивать',
    },
    system: { subtitle: 'Настройки выполнения, исходная конфигурация и управление сервисом.', viewRawConfig: 'Исходная конфигурация', serviceOperations: 'Операции сервиса', serviceOperationsHint: 'Перечитать конфигурацию с диска или перезапустить сервис.', unsaved: 'Есть несохранённые изменения', upToDate: 'Настройки актуальны' },
    setup: { projectInfo: 'Данные проекта', platformStep: 'Платформа', setupStep: 'Настройка' },
  },
};

function mergeTranslation(base: Translation, addition: Translation): Translation {
  const merged: Translation = { ...base };
  for (const [key, value] of Object.entries(addition)) {
    const baseValue = base[key];
    const baseSection = baseValue && typeof baseValue === 'object' && !Array.isArray(baseValue)
      ? baseValue as Translation
      : {};
    merged[key] = value && typeof value === 'object' && !Array.isArray(value)
      ? { ...baseSection, ...(value as Translation) }
      : value;
  }
  return merged;
}

const baseTranslations: Record<string, Translation> = { en, zh, 'zh-TW': zhTW, ja, es, ko, ru };
const resources = Object.fromEntries(Object.entries(baseTranslations).map(([language, base]) => [
  language,
  { translation: mergeTranslation(base, factorTranslations[language]) },
]));

function resolveLanguage() {
  try {
    const stored = import.meta.env.MODE !== 'test' && typeof window !== 'undefined'
      ? window.localStorage?.getItem('cc_lang')
      : null;
    if (stored) return stored;
  } catch {
    // Storage can be unavailable in SSR, sandboxed frames, and DOM test runtimes.
  }
  return typeof navigator !== 'undefined' ? navigator.language.split('-')[0] || 'en' : 'en';
}

void i18n.use(initReactI18next).init({
  resources,
  lng: resolveLanguage(),
  fallbackLng: 'en',
  showSupportNotice: false,
  interpolation: { escapeValue: false },
});

export default i18n;
