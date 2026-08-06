import type { ThemeConfig } from 'antd';
import { theme } from 'antd';

const sharedTokens: ThemeConfig['token'] = {
  borderRadius: 12,
  borderRadiusLG: 16,
  colorPrimary: '#19a463',
  colorSuccess: '#19a463',
  colorInfo: '#2589e8',
  colorWarning: '#d99a19',
  colorError: '#df4d55',
  fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontSize: 14,
  controlHeight: 36,
};

export function createTheme(mode: 'light' | 'dark'): ThemeConfig {
  const dark = mode === 'dark';
  return {
    algorithm: dark ? theme.darkAlgorithm : theme.defaultAlgorithm,
    cssVar: { prefix: 'cc' },
    hashed: false,
    token: {
      ...sharedTokens,
      colorPrimary: dark ? '#45e58f' : '#168a55',
      colorBgBase: dark ? '#080b0a' : '#f5f7f6',
      colorTextBase: dark ? '#f0f4f2' : '#17201c',
      colorBorder: dark ? '#26332d' : '#d9e1dd',
    },
    components: {
      Button: {
        primaryShadow: 'none',
        borderRadius: 10,
      },
      Card: {
        borderRadiusLG: 16,
        headerBg: 'transparent',
      },
      Layout: {
        bodyBg: dark ? '#080b0a' : '#f5f7f6',
        headerBg: dark ? '#0d1210' : '#ffffff',
        siderBg: dark ? '#0d1210' : '#ffffff',
      },
      Menu: {
        itemBorderRadius: 10,
        itemMarginInline: 8,
        itemSelectedBg: dark ? 'rgba(69, 229, 143, 0.13)' : 'rgba(22, 138, 85, 0.1)',
        itemSelectedColor: dark ? '#68efa4' : '#116b43',
        darkItemBg: '#0d1210',
      },
      Modal: {
        borderRadiusLG: 18,
      },
      Table: {
        headerBg: dark ? '#121a16' : '#f0f4f2',
        rowHoverBg: dark ? '#111814' : '#f7faf8',
      },
    },
  };
}
