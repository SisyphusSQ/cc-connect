import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '@/i18n/locales/en.json';
import es from '@/i18n/locales/es.json';
import ja from '@/i18n/locales/ja.json';
import ko from '@/i18n/locales/ko.json';
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
    cron: { subtitle: 'Schedule prompts and local commands for project sessions.' },
    dashboard: { subtitle: 'System health, projects and recent conversations at a glance.' },
    heartbeat: { lastError: 'Last error' },
    projects: {
      subtitle: 'Manage agents, platforms and project-level behavior.', showWorkdirIndicator: 'Working directory indicator',
      showWorkdirIndicatorHint: 'Show the working directory in agent replies',
    },
    system: { subtitle: 'Runtime settings, raw configuration and service controls.' },
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
    cron: { subtitle: '为项目会话定时执行提示词或本地命令。' },
    dashboard: { subtitle: '集中查看系统状态、项目和最近会话。' },
    heartbeat: { lastError: '最近错误' },
    projects: {
      subtitle: '管理智能体、平台和项目级行为。', showWorkdirIndicator: '工作目录标识',
      showWorkdirIndicatorHint: '在智能体回复中显示当前工作目录',
    },
    system: { subtitle: '管理运行时设置、原始配置和服务操作。' },
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
    cron: { subtitle: '為專案工作階段排程提示詞或本機命令。' },
    dashboard: { subtitle: '集中檢視系統狀態、專案與最近工作階段。' },
    heartbeat: { lastError: '最近錯誤' },
    projects: {
      subtitle: '管理智慧代理、平台與專案層級行為。', showWorkdirIndicator: '工作目錄標示',
      showWorkdirIndicatorHint: '在智慧代理回覆中顯示目前工作目錄',
    },
    system: { subtitle: '管理執行階段設定、原始設定與服務操作。' },
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
    cron: { subtitle: 'プロジェクトセッションのプロンプトやローカルコマンドをスケジュールします。' },
    dashboard: { subtitle: 'システム状態、プロジェクト、最近の会話をまとめて確認します。' },
    heartbeat: { lastError: '最新のエラー' },
    projects: {
      subtitle: 'エージェント、プラットフォーム、プロジェクト単位の動作を管理します。', showWorkdirIndicator: '作業ディレクトリ表示',
      showWorkdirIndicatorHint: 'エージェントの返信に作業ディレクトリを表示します',
    },
    system: { subtitle: 'ランタイム設定、元の設定、サービス操作を管理します。' },
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
    cron: { subtitle: 'Programa prompts y comandos locales para las sesiones del proyecto.' },
    dashboard: { subtitle: 'Consulta el estado del sistema, los proyectos y las conversaciones recientes.' },
    heartbeat: { lastError: 'Último error' },
    projects: {
      subtitle: 'Administra agentes, plataformas y el comportamiento de cada proyecto.', showWorkdirIndicator: 'Indicador del directorio de trabajo',
      showWorkdirIndicatorHint: 'Muestra el directorio de trabajo en las respuestas del agente',
    },
    system: { subtitle: 'Administra los ajustes de ejecución, la configuración original y los controles del servicio.' },
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
    cron: { subtitle: '프로젝트 세션의 프롬프트와 로컬 명령을 예약합니다.' },
    dashboard: { subtitle: '시스템 상태, 프로젝트, 최근 대화를 한눈에 확인합니다.' },
    heartbeat: { lastError: '최근 오류' },
    projects: {
      subtitle: '에이전트, 플랫폼, 프로젝트별 동작을 관리합니다.', showWorkdirIndicator: '작업 디렉터리 표시',
      showWorkdirIndicatorHint: '에이전트 응답에 현재 작업 디렉터리를 표시합니다',
    },
    system: { subtitle: '런타임 설정, 원본 구성, 서비스 제어를 관리합니다.' },
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

const baseTranslations: Record<string, Translation> = { en, zh, 'zh-TW': zhTW, ja, es, ko };
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
