import { describe, expect, it } from 'vitest';
import { theme } from 'antd';
import { factorRoutePaths } from '@factor/App';
import i18n from '@factor/i18n';
import { createTheme } from '@factor/theme';

describe('factor frontend contract', () => {
  it('keeps the supported route contract including legacy chat redirects', () => {
    expect(factorRoutePaths).toEqual([
      '/',
      '/login',
      '/projects',
      '/projects/:name',
      '/providers',
      '/skills',
      '/sessions',
      '/sessions/:name',
      '/sessions/:name/:sessionId',
      '/chat',
      '/chat/:name',
      '/cron',
      '/system',
    ]);
  });

  it('keeps action and status colors semantically distinct in both modes', () => {
    const light = createTheme('light');
    const dark = createTheme('dark');

    expect(light.algorithm).toBe(theme.defaultAlgorithm);
    expect(dark.algorithm).toBe(theme.darkAlgorithm);
    for (const config of [light, dark]) {
      expect(config.token?.colorPrimary).toBe('#1677FF');
      expect(config.token?.colorInfo).toBe('#1677FF');
      expect(config.token?.colorSuccess).toBe('#52C41A');
      expect(config.token?.colorWarning).toBe('#FAAD14');
      expect(config.token?.colorError).toBe('#FF4D4F');
    }
  });

  it('provides Factor copy for every upstream language', () => {
    const expectations: Record<string, string> = {
      en: 'Agent operations',
      zh: '智能体运维',
      'zh-TW': '智慧代理營運',
      ja: 'エージェント運用',
      es: 'Operaciones de agentes',
      ko: '에이전트 운영',
    };

    for (const [language, copy] of Object.entries(expectations)) {
      expect(i18n.getResource(language, 'translation', 'factor.brandSubtitle')).toBe(copy);
    }
  });

  it('provides localized session workspace copy for every language', () => {
    const expectations: Record<string, [string, string, string]> = {
      en: ['Session list', 'Running', 'Start Web session'],
      zh: ['会话列表', '运行中', '开始 Web 会话'],
      'zh-TW': ['工作階段列表', '執行中', '開始 Web 工作階段'],
      ja: ['セッション一覧', '実行中', 'Web セッションを開始'],
      es: ['Lista de sesiones', 'En ejecución', 'Iniciar sesión web'],
      ko: ['세션 목록', '실행 중', 'Web 세션 시작'],
    };

    for (const [language, [list, running, start]] of Object.entries(expectations)) {
      expect(i18n.getResource(language, 'translation', 'sessions.workspaceList')).toBe(list);
      expect(i18n.getResource(language, 'translation', 'sessions.running')).toBe(running);
      expect(i18n.getResource(language, 'translation', 'sessions.startWebSession')).toBe(start);
      expect(i18n.getResource(language, 'translation', 'sessions.workProcess')).toBeTruthy();
      expect(i18n.getResource(language, 'translation', 'sessions.thinkingSummary')).toBeTruthy();
      expect(i18n.getResource(language, 'translation', 'sessions.toolCall')).toBeTruthy();
      expect(i18n.getResource(language, 'translation', 'sessions.toolResult')).toBeTruthy();
    }
  });

  it('provides localized skills workspace copy for every language', () => {
    const expectations: Record<string, [string, string, string]> = {
      en: ['Search skills', 'Details', 'View source'],
      zh: ['搜索技能', '详情', '查看来源'],
      'zh-TW': ['搜尋技能', '詳情', '查看來源'],
      ja: ['スキルを検索', '詳細', 'ソースを表示'],
      es: ['Buscar habilidades', 'Detalles', 'Ver origen'],
      ko: ['스킬 검색', '상세', '소스 보기'],
    };

    for (const [language, [search, details, source]] of Object.entries(expectations)) {
      expect(i18n.getResource(language, 'translation', 'skills.searchPlaceholder')).toBe(search);
      expect(i18n.getResource(language, 'translation', 'skills.details')).toBe(details);
      expect(i18n.getResource(language, 'translation', 'skills.viewSource')).toBe(source);
    }
  });

  it('provides localized cron management copy for every language', () => {
    const expectations: Record<string, [string, string, string]> = {
      en: ['Search scheduled jobs', 'Run this job now?', 'Every weekday at 09:00'],
      zh: ['搜索定时任务', '确定立即执行这个任务吗？', '工作日 09:00'],
      'zh-TW': ['搜尋排程工作', '確定立即執行這個工作嗎？', '工作日 09:00'],
      ja: ['スケジュールジョブを検索', 'このジョブを今すぐ実行しますか？', '平日 09:00'],
      es: ['Buscar tareas programadas', '¿Ejecutar esta tarea ahora?', 'Días laborables a las 09:00'],
      ko: ['예약 작업 검색', '이 작업을 지금 실행할까요?', '평일 09:00'],
    };

    for (const [language, [search, confirm, schedule]] of Object.entries(expectations)) {
      expect(i18n.getResource(language, 'translation', 'cron.searchPlaceholder')).toBe(search);
      expect(i18n.getResource(language, 'translation', 'cron.runConfirm')).toBe(confirm);
      expect(i18n.getResource(language, 'translation', 'cron.weekdays9')).toBe(schedule);
    }
  });

  it('provides localized management workspace copy for every language', () => {
    for (const language of ['en', 'zh', 'zh-TW', 'ja', 'es', 'ko']) {
      expect(i18n.getResource(language, 'translation', 'system.serviceOperations')).toBeTruthy();
      expect(i18n.getResource(language, 'translation', 'setup.projectInfo')).toBeTruthy();
      expect(i18n.getResource(language, 'translation', 'projects.permissionDefault')).toBeTruthy();
    }
  });
});
