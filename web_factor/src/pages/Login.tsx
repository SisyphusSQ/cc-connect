import {
  ApiOutlined,
  CodeOutlined,
  GlobalOutlined,
  MoonOutlined,
  SunOutlined,
} from '@ant-design/icons';
import { Alert, Button, Card, Dropdown, Form, Input, Space, Tooltip, Typography } from 'antd';
import type { MenuProps } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '@/api/client';
import { getStatus } from '@/api/status';
import { useAuthStore } from '@/store/auth';
import { useThemeStore } from '@/store/theme';

interface LoginValues {
  token: string;
  serverUrl?: string;
}

const languages = [
  { key: 'en', label: 'English' },
  { key: 'zh', label: '简体中文' },
  { key: 'zh-TW', label: '繁體中文' },
  { key: 'ja', label: '日本語' },
  { key: 'ko', label: '한국어' },
  { key: 'es', label: 'Español' },
  { key: 'ru', label: 'Русский' },
];

export default function Login() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const login = useAuthStore((state) => state.login);
  const { theme, setTheme } = useThemeStore();
  const [form] = Form.useForm<LoginValues>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const autoLoginAttempted = useRef(false);

  useEffect(() => {
    if (autoLoginAttempted.current) return;
    const queryToken = searchParams.get('token');
    if (!queryToken) return;
    autoLoginAttempted.current = true;

    void (async () => {
      setLoading(true);
      try {
        api.setToken(queryToken);
        await getStatus();
        login(queryToken);
        navigate('/', { replace: true });
      } catch {
        form.setFieldValue('token', queryToken);
        setError(t('login.invalidToken'));
        api.setToken('');
      } finally {
        setLoading(false);
      }
    })();
  }, [form, login, navigate, searchParams, t]);

  const handleSubmit = async ({ token, serverUrl }: LoginValues) => {
    setLoading(true);
    setError('');
    try {
      const normalized = token.trim();
      api.setToken(normalized);
      await getStatus();
      login(normalized, serverUrl?.trim());
      navigate('/');
    } catch {
      setError(t('login.invalidToken'));
      api.setToken('');
    } finally {
      setLoading(false);
    }
  };

  const languageMenu: MenuProps = {
    selectedKeys: [i18n.language],
    items: languages,
    onClick: ({ key }) => {
      void i18n.changeLanguage(key);
      localStorage.setItem('cc_lang', key);
    },
  };

  const nextTheme = { light: 'dark', dark: 'system', system: 'light' } as const;

  return (
    <main className="cc-login-shell">
      <Space className="cc-login-controls">
        <Dropdown menu={languageMenu} placement="bottomRight">
          <Button icon={<GlobalOutlined />}>{i18n.language}</Button>
        </Dropdown>
        <Tooltip title={theme}>
          <Button
            icon={theme === 'light' ? <SunOutlined /> : theme === 'dark' ? <MoonOutlined /> : <ApiOutlined />}
            onClick={() => setTheme(nextTheme[theme])}
            aria-label={t('factor.theme')}
          />
        </Tooltip>
      </Space>

      <Card className="cc-login-card" styles={{ body: { padding: 34 } }}>
        <div className="cc-login-brand">
          <span className="cc-brand-mark"><CodeOutlined /></span>
          <div>
            <Typography.Title level={3} style={{ margin: 0 }}>CC-Connect</Typography.Title>
            <Typography.Text type="secondary">{t('factor.console')}</Typography.Text>
          </div>
        </div>

        <Typography.Title className="cc-login-title" level={2} style={{ textAlign: 'center', marginBottom: 4 }}>
          {t('login.title')}
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ textAlign: 'center', marginBottom: 26 }}>
          {t('login.subtitle')}
        </Typography.Paragraph>

        {error && (
          <Alert
            type="error"
            showIcon
            title={error}
            style={{ marginBottom: 18 }}
          />
        )}

        <Form<LoginValues>
          form={form}
          layout="vertical"
          requiredMark={false}
          onFinish={handleSubmit}
        >
          <input type="text" name="username" autoComplete="username" value="cc-connect-admin" readOnly hidden />
          <Form.Item
            label={t('login.token')}
            name="token"
            rules={[{ required: true, whitespace: true, message: t('login.token') }]}
          >
            <Input.Password autoFocus autoComplete="current-password" placeholder="mgmt-secret-xxx" size="large" />
          </Form.Item>
          <Form.Item
            label={`${t('login.serverUrl')} (${t('common.optional')})`}
            name="serverUrl"
          >
            <Input autoComplete="url" placeholder="http://localhost:9820" size="large" />
          </Form.Item>
          <Button
            block
            type="primary"
            htmlType="submit"
            size="large"
            loading={loading}
            icon={<ApiOutlined />}
          >
            {t('login.connect')}
          </Button>
        </Form>
      </Card>
    </main>
  );
}
