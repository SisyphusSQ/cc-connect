import { describe, expect, it } from 'vitest';
import { theme } from 'antd';
import { factorRoutePaths } from '@factor/App';
import i18n from '@factor/i18n';
import { createTheme } from '@factor/theme';

describe('factor frontend contract', () => {
  it('keeps every route exposed by the upstream web application', () => {
    expect(factorRoutePaths).toEqual([
      '/',
      '/login',
      '/projects',
      '/projects/:name',
      '/providers',
      '/skills',
      '/chat',
      '/chat/:name',
      '/cron',
      '/system',
    ]);
  });

  it('uses the project theme in both color modes', () => {
    const light = createTheme('light');
    const dark = createTheme('dark');

    expect(light.algorithm).toBe(theme.defaultAlgorithm);
    expect(light.token?.colorPrimary).toBe('#168a55');
    expect(dark.algorithm).toBe(theme.darkAlgorithm);
    expect(dark.token?.colorPrimary).toBe('#45e58f');
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
});
