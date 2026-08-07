import type { ThemeConfig } from 'antd';
import { theme } from 'antd';

const sharedTokens: ThemeConfig['token'] = {
  borderRadius: 12,
  borderRadiusLG: 16,
  colorPrimary: '#1677FF',
  colorSuccess: '#52C41A',
  colorInfo: '#1677FF',
  colorWarning: '#FAAD14',
  colorError: '#FF4D4F',
  fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontSize: 14,
  controlHeight: 36,
};

export function createTheme(mode: 'light' | 'dark'): ThemeConfig {
  return {
    algorithm: mode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
    cssVar: { prefix: 'cc' },
    hashed: false,
    token: sharedTokens,
    components: {
      Button: {
        primaryShadow: 'none',
        borderRadius: 10,
      },
      Card: {
        borderRadiusLG: 16,
        headerBg: 'transparent',
      },
      Menu: {
        itemBorderRadius: 10,
        itemMarginInline: 8,
      },
      Modal: {
        borderRadiusLG: 18,
      },
    },
  };
}
