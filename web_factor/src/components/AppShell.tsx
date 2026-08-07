import {
  AppstoreOutlined,
  ApiOutlined,
  ClockCircleOutlined,
  CodeOutlined,
  DashboardOutlined,
  FolderOpenOutlined,
  GlobalOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MessageOutlined,
  MoonOutlined,
  ReloadOutlined,
  SettingOutlined,
  SunOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { Button, Drawer, Dropdown, Grid, Layout, Menu, Space, Tooltip, Typography } from 'antd';
import type { MenuProps } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/auth';
import { useThemeStore } from '@/store/theme';
import { getStatus } from '@/api/status';
import { AppHeaderContext, useAppHeaderContextValue, type AppHeaderState } from './AppHeaderContext';

const { Header, Sider, Content, Footer } = Layout;
const { useBreakpoint } = Grid;

const languages = [
  { key: 'en', label: 'English' },
  { key: 'zh', label: '简体中文' },
  { key: 'zh-TW', label: '繁體中文' },
  { key: 'ja', label: '日本語' },
  { key: 'ko', label: '한국어' },
  { key: 'es', label: 'Español' },
];

export default function AppShell() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();
  const mobile = !screens.lg;
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [version, setVersion] = useState('');
  const [pageHeader, setPageHeader] = useState<AppHeaderState | null>(null);
  const logout = useAuthStore((state) => state.logout);
  const { theme: themeMode, setTheme } = useThemeStore();
  const headerContext = useAppHeaderContextValue(setPageHeader);

  useEffect(() => {
    getStatus().then((status) => setVersion(status.version || '')).catch(() => undefined);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const navItems = useMemo<{ key: string; icon: React.ReactNode; label: string }[]>(() => [
    { key: '/', icon: <DashboardOutlined />, label: t('nav.dashboard') },
    { key: '/projects', icon: <FolderOpenOutlined />, label: t('nav.projects') },
    { key: '/providers', icon: <ApiOutlined />, label: t('nav.providers') },
    { key: '/skills', icon: <ToolOutlined />, label: t('nav.skills') },
    { key: '/sessions', icon: <MessageOutlined />, label: t('nav.sessions') },
    { key: '/cron', icon: <ClockCircleOutlined />, label: t('nav.cron') },
    { key: '/system', icon: <SettingOutlined />, label: t('nav.system') },
  ], [t]);

  const selectedKey = navItems
    .map((item) => item.key)
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .find((key) => key === '/' ? location.pathname === '/' : location.pathname.startsWith(key)) || '/';

  const menu = (
    <div className="cc-nav-panel">
      <div className="cc-brand">
        <span className="cc-brand-mark"><CodeOutlined /></span>
        {(!collapsed || mobile) && (
          <span className="cc-brand-copy">
            <strong>CC-Connect</strong>
            <small>{t('factor.brandSubtitle')}</small>
          </span>
        )}
      </div>
      <Menu
        className="cc-nav-menu"
        mode="inline"
        inlineCollapsed={!mobile && collapsed}
        selectedKeys={[selectedKey]}
        items={navItems}
        onClick={({ key }) => navigate(key)}
      />
      {!mobile && (
        <Button
          type="text"
          className="cc-collapse-button"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? t('factor.expandNavigation') : t('factor.collapseNavigation')}
        />
      )}
    </div>
  );

  const cycleTheme = () => {
    const next = { light: 'dark', dark: 'system', system: 'light' } as const;
    setTheme(next[themeMode]);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    window.dispatchEvent(new CustomEvent('cc:refresh'));
    window.setTimeout(() => setRefreshing(false), 700);
  };

  const languageMenu: MenuProps = {
    selectedKeys: [i18n.language],
    items: languages,
    onClick: ({ key }) => {
      void i18n.changeLanguage(key);
      localStorage.setItem('cc_lang', key);
    },
  };

  return (
    <AppHeaderContext.Provider value={headerContext}>
    <Layout className={`cc-shell${pageHeader?.immersive ? ' cc-shell-immersive' : ''}`}>
      {!mobile && (
        <Sider
          className="cc-sider"
          width={240}
          collapsedWidth={72}
          collapsed={collapsed}
          trigger={null}
        >
          {menu}
        </Sider>
      )}
      <Drawer
        placement="left"
        size={280}
        open={mobile && mobileOpen}
        onClose={() => setMobileOpen(false)}
        closable={false}
        styles={{ body: { padding: 0 } }}
      >
        {menu}
      </Drawer>

      <Layout className="cc-main-layout">
        <Header className={`cc-header${pageHeader ? ' cc-header-contextual' : ''}`}>
          <div className="cc-header-primary">
            {mobile && (
              <Button
                type="text"
                icon={<MenuUnfoldOutlined />}
                onClick={() => setMobileOpen(true)}
                aria-label={t('factor.openNavigation')}
              />
            )}
            {pageHeader?.leading}
            {pageHeader ? (
              <>
                <div className="cc-context-title cc-context-title-page">
                  <Typography.Title level={4}>{pageHeader.title}</Typography.Title>
                  {pageHeader.subtitle && <Typography.Text type="secondary">{pageHeader.subtitle}</Typography.Text>}
                </div>
                {pageHeader.details && <div className="cc-header-details">{pageHeader.details}</div>}
              </>
            ) : (
              <div className="cc-context-title">
                <Typography.Text type="secondary">CC-Connect</Typography.Text>
                <Typography.Title level={4}>{navItems.find((item) => item.key === selectedKey)?.label}</Typography.Title>
              </div>
            )}
          </div>
          <div className="cc-header-tools">
            {pageHeader?.actions && <div className="cc-header-actions">{pageHeader.actions}</div>}
            {pageHeader?.actions && <span className="cc-header-divider" aria-hidden="true" />}
            <Tooltip title={t('common.refresh')}>
              <Button type="text" icon={<ReloadOutlined spin={refreshing} />} onClick={handleRefresh} aria-label={t('common.refresh')} />
            </Tooltip>
            <Dropdown menu={languageMenu} placement="bottomRight" trigger={['click']}>
              <Button className="cc-header-secondary-action" type="text" icon={<GlobalOutlined />} aria-label={t('factor.language')} />
            </Dropdown>
            <Tooltip title={themeMode}>
              <Button
                className="cc-header-secondary-action"
                type="text"
                icon={themeMode === 'light' ? <SunOutlined /> : themeMode === 'dark' ? <MoonOutlined /> : <AppstoreOutlined />}
                onClick={cycleTheme}
                aria-label={t('factor.theme')}
              />
            </Tooltip>
            <Tooltip title={t('login.logout')}>
              <Button type="text" danger icon={<LogoutOutlined />} onClick={logout} aria-label={t('login.logout')} />
            </Tooltip>
          </div>
        </Header>

        <Content className={`cc-content${pageHeader?.immersive ? ' cc-content-immersive' : ''}`}>
          <div className={`cc-content-inner${pageHeader?.immersive ? ' cc-content-inner-immersive' : ''}`}>
            <Outlet />
          </div>
          {!pageHeader?.immersive && <Footer className="cc-footer">
            <span>© {new Date().getFullYear()} CC-Connect Factor</span>
            {version && <span> · {version.startsWith('v') ? version : `v${version}`}</span>}
          </Footer>}
        </Content>
      </Layout>
    </Layout>
    </AppHeaderContext.Provider>
  );
}
