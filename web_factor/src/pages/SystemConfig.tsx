import {
  CodeOutlined,
  DownOutlined,
  ReloadOutlined,
  RightOutlined,
  SaveOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Alert, App, Button, Card, Flex, Form, InputNumber, Popconfirm, Select, Skeleton, Space, Switch, Typography } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '@/api/client';
import { getGlobalSettings, updateGlobalSettings, type GlobalSettings } from '@/api/settings';
import { reloadConfig, restartSystem } from '@/api/status';
import PageHeader from '@factor/components/PageHeader';

const languages = ['en', 'zh', 'zh-TW', 'ja', 'ko', 'es'];

export default function SystemConfig() {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [form] = Form.useForm<GlobalSettings>();
  const [rawConfig, setRawConfig] = useState('');
  const [rawFormat, setRawFormat] = useState<'toml' | 'json'>('toml');
  const [rawOpen, setRawOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [settings, raw] = await Promise.all([getGlobalSettings(), api.raw('/config')]);
      form.setFieldsValue(settings);
      const trimmed = raw.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          setRawConfig(JSON.stringify(JSON.parse(trimmed), null, 2));
          setRawFormat('json');
        } catch {
          setRawConfig(raw);
          setRawFormat('toml');
        }
      } else {
        setRawConfig(raw);
        setRawFormat('toml');
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setLoading(false);
    }
  }, [form]);

  useEffect(() => {
    void load();
    const handler = () => void load();
    window.addEventListener('cc:refresh', handler);
    return () => window.removeEventListener('cc:refresh', handler);
  }, [load]);

  const save = async (values: GlobalSettings) => {
    setSaving(true);
    try {
      await updateGlobalSettings(values);
      void message.success(t('common.success'));
    } catch (reason) {
      void message.error(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={t('nav.system')}
        description={t('system.subtitle', 'Runtime behavior, message presentation and service controls.')}
        extra={(
          <Space wrap>
            <Popconfirm title={t('system.reloadConfirm')} onConfirm={async () => {
              await reloadConfig();
              await load();
              void message.success(t('common.success'));
            }}>
              <Button icon={<ReloadOutlined />}>{t('system.reload')}</Button>
            </Popconfirm>
            <Popconfirm title={t('system.restartConfirm')} onConfirm={async () => {
              await restartSystem();
              void message.success(t('common.success'));
            }}>
              <Button danger icon={<ReloadOutlined />}>{t('system.restart')}</Button>
            </Popconfirm>
          </Space>
        )}
      />
      {error && <Alert type="error" showIcon title={error} style={{ marginBottom: 18 }} />}

      {loading ? <Card><Skeleton active /></Card> : (
        <Form<GlobalSettings> form={form} layout="vertical" requiredMark="optional" onFinish={save}>
          <div className="cc-page-grid">
            <SettingsCard title={t('settings.general', 'General')} icon={<SettingOutlined />}>
              <Form.Item name="language" label={t('settings.language', 'Language')}><Select options={languages.map((value) => ({ value }))} /></Form.Item>
              <Form.Item name="attachment_send" label={t('settings.attachmentSend', 'Attachment send')} extra={t('settings.attachmentSendHint', 'Send file/image attachments back to platform')}>
                <Select options={[{ value: '', label: t('settings.default', 'default') }, { value: 'on' }, { value: 'off' }]} />
              </Form.Item>
              <Form.Item name="idle_timeout_mins" label={t('settings.idleTimeout', 'Idle timeout (min)')} extra={t('settings.idleTimeoutHint', '0 disables automatic stop')}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </SettingsCard>

            <SettingsCard title={t('settings.display', 'Display')}>
              <ToggleItem name="thinking_messages" label={t('settings.thinkingMessages', 'Thinking messages')} hint={t('settings.thinkingMessagesHint', 'Show intermediate thinking messages')} />
              <Form.Item name="thinking_max_len" label={t('settings.thinkingMaxLen', 'Thinking max length')}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
              <ToggleItem name="tool_messages" label={t('settings.toolMessages', 'Tool progress')} hint={t('settings.toolMessagesHint', 'Show tool progress messages')} />
              <Form.Item name="tool_max_len" label={t('settings.toolMaxLen', 'Tool max length')}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
            </SettingsCard>

            <SettingsCard title={t('settings.streamPreview', 'Stream preview')}>
              <ToggleItem name="stream_preview_enabled" label={t('settings.streamPreviewEnabled', 'Enable')} hint={t('settings.streamPreviewEnabledHint', 'Show streaming updates in IM')} />
              <Form.Item name="stream_preview_interval_ms" label={t('settings.streamPreviewInterval', 'Interval (ms)')}><InputNumber min={100} style={{ width: '100%' }} /></Form.Item>
            </SettingsCard>

            <SettingsCard title={t('settings.rateLimit', 'Rate limit')}>
              <Form.Item name="rate_limit_max_messages" label={t('settings.rlMaxMessages', 'Max messages')}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
              <Form.Item name="rate_limit_window_secs" label={t('settings.rlWindowSecs', 'Window (sec)')}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
              <Form.Item name="log_level" label={t('settings.logLevel', 'Log level')}><Select options={['debug', 'info', 'warn', 'error'].map((value) => ({ value }))} /></Form.Item>
            </SettingsCard>
          </div>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving} style={{ marginTop: 18 }}>
            {t('common.save')}
          </Button>
        </Form>
      )}

      <Card
        className="cc-surface-card cc-section"
        title={<Space><CodeOutlined />{t('system.rawConfig', 'Raw config')}<TagLabel text={rawFormat} /></Space>}
        extra={<Button type="text" icon={rawOpen ? <DownOutlined /> : <RightOutlined />} onClick={() => setRawOpen((value) => !value)} />}
      >
        {rawOpen && (
          <div className="cc-code-block">
            <pre><code>{rawConfig || t('common.noData')}</code></pre>
          </div>
        )}
      </Card>
    </div>
  );
}

function SettingsCard({ title, icon, children }: { title: React.ReactNode; icon?: React.ReactNode; children: React.ReactNode }) {
  return <Card className="cc-surface-card" title={<Space>{icon}{title}</Space>}>{children}</Card>;
}

function ToggleItem({ name, label, hint }: { name: keyof GlobalSettings; label: string; hint: string }) {
  return (
    <div className="cc-settings-row">
      <span className="cc-settings-copy">
        <Typography.Text strong>{label}</Typography.Text>
        <Typography.Text type="secondary">{hint}</Typography.Text>
      </span>
      <Form.Item name={name} valuePropName="checked" noStyle><Switch /></Form.Item>
    </div>
  );
}

function TagLabel({ text }: { text: string }) {
  return <Typography.Text code>{text}</Typography.Text>;
}
