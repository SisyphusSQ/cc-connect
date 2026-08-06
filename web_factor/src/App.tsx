import { ConfigProvider, App as AntApp } from 'antd';
import enUS from 'antd/es/locale/en_US';
import esES from 'antd/es/locale/es_ES';
import jaJP from 'antd/es/locale/ja_JP';
import koKR from 'antd/es/locale/ko_KR';
import zhCN from 'antd/es/locale/zh_CN';
import zhTW from 'antd/es/locale/zh_TW';
import { Flex, Spin } from 'antd';
import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/auth';
import { useThemeStore } from '@/store/theme';
import AppShell from '@factor/components/AppShell';
import { createTheme } from '@factor/theme';

const Dashboard = lazy(() => import('@factor/pages/Dashboard'));
const Login = lazy(() => import('@factor/pages/Login'));
const ProjectList = lazy(() => import('@factor/pages/projects/ProjectList'));
const ProjectDetail = lazy(() => import('@factor/pages/projects/ProjectDetail'));
const ProviderList = lazy(() => import('@factor/pages/ProviderList'));
const SkillList = lazy(() => import('@factor/pages/SkillList'));
const ChatList = lazy(() => import('@factor/pages/chat/ChatList'));
const ChatView = lazy(() => import('@factor/pages/chat/ChatView'));
const CronList = lazy(() => import('@factor/pages/CronList'));
const SystemConfig = lazy(() => import('@factor/pages/SystemConfig'));

export const factorRoutePaths = [
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
] as const;

const antdLocales: Record<string, typeof enUS> = {
  en: enUS,
  es: esES,
  ja: jaJP,
  ko: koKR,
  zh: zhCN,
  'zh-TW': zhTW,
};

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { i18n } = useTranslation();
  const resolvedTheme = useThemeStore((state) => state.resolved);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <ConfigProvider
      locale={antdLocales[i18n.language] || enUS}
      theme={createTheme(resolvedTheme)}
    >
      <AntApp>
        <Suspense fallback={<Flex align="center" justify="center" style={{ minHeight: '100vh' }}><Spin size="large" /></Flex>}>
          <Routes>
            <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
            <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="projects" element={<ProjectList />} />
              <Route path="projects/:name" element={<ProjectDetail />} />
              <Route path="providers" element={<ProviderList />} />
              <Route path="skills" element={<SkillList />} />
              <Route path="chat" element={<ChatList />} />
              <Route path="chat/:name" element={<ChatView />} />
              <Route path="cron" element={<CronList />} />
              <Route path="system" element={<SystemConfig />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AntApp>
    </ConfigProvider>
  );
}
