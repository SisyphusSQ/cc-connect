import {
  ArrowLeftOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  HeartOutlined,
  LinkOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  PoweroffOutlined,
  RocketOutlined,
  SettingOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import {
  Alert,
  App,
  Avatar,
  Badge,
  Button,
  Card,
  Descriptions,
  Empty,
  Flex,
  Form,
  Input,
  InputNumber,
  List,
  Modal,
  Popconfirm,
  Segmented,
  Select,
  Skeleton,
  Space,
  Switch,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  deleteProject,
  getProject,
  listAgentTypes,
  updateProject,
  type ProjectDetail as ProjectDetailType,
} from '@/api/projects';
import {
  activateProvider,
  addProvider,
  listGlobalProviders,
  listProviders,
  removeProvider,
  saveProviderRefs,
  type GlobalProvider,
  type Provider,
} from '@/api/providers';
import {
  getHeartbeat,
  pauseHeartbeat,
  resumeHeartbeat,
  setHeartbeatInterval,
  triggerHeartbeat,
  type HeartbeatStatus,
} from '@/api/heartbeat';
import { restartSystem } from '@/api/status';
import { formatTime } from '@/lib/utils';
import { platformMeta } from '@/lib/platformMeta';
import PageHeader from '@factor/components/PageHeader';
import PlatformManualForm from '@factor/pages/projects/PlatformManualForm';
import PlatformSetupQR from '@factor/pages/projects/PlatformSetupQR';

interface SettingsValues {
  agentType: string;
  workDir: string;
  agentMode: string;
  replyFooter: boolean;
  showContextIndicator: boolean;
  showWorkdirIndicator: boolean;
  injectSender: boolean;
  language: string;
  adminFrom: string;
  disabledCommands: string;
  platformAllowFrom: Record<string, string>;
}

interface CustomProviderValues {
  name: string;
  api_key?: string;
  base_url?: string;
  model?: string;
}

const qrPlatforms = new Set(['feishu', 'lark', 'weixin']);
const waitForService = (maxMilliseconds: number) => new Promise<void>((resolve) => {
  const start = Date.now();
  const poll = () => {
    fetch('/api/v1/status')
      .then((response) => response.ok ? resolve() : Promise.reject(new Error('not ready')))
      .catch(() => {
        if (Date.now() - start > maxMilliseconds) resolve();
        else window.setTimeout(poll, 500);
      });
  };
  window.setTimeout(poll, 1500);
});

export default function ProjectDetail() {
  const { t } = useTranslation();
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { message, modal } = App.useApp();
  const [settingsForm] = Form.useForm<SettingsValues>();
  const [customProviderForm] = Form.useForm<CustomProviderValues>();
  const [project, setProject] = useState<ProjectDetailType | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [globalProviders, setGlobalProviders] = useState<GlobalProvider[]>([]);
  const [providerRefs, setProviderRefs] = useState<string[]>([]);
  const [heartbeat, setHeartbeat] = useState<HeartbeatStatus | null>(null);
  const [agentTypes, setAgentTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [providerModalOpen, setProviderModalOpen] = useState(false);
  const [providerAddMode, setProviderAddMode] = useState<'global' | 'custom'>('global');
  const [intervalModalOpen, setIntervalModalOpen] = useState(false);
  const [interval, setInterval] = useState(30);
  const [platformModalOpen, setPlatformModalOpen] = useState(false);
  const [platformType, setPlatformType] = useState('');
  const [restartModalOpen, setRestartModalOpen] = useState(false);
  const selectedAgentType = Form.useWatch('agentType', settingsForm);
  const requestedTab = searchParams.get('tab') || 'overview';
  const activeTab = ['overview', 'providers', 'heartbeat', 'settings'].includes(requestedTab) ? requestedTab : 'overview';

  const fetchAll = useCallback(async () => {
    if (!name) return;
    setLoading(true);
    setError('');
    const [projectResult, providersResult, heartbeatResult, globalsResult, agentsResult] = await Promise.allSettled([
      getProject(name),
      listProviders(name),
      getHeartbeat(name),
      listGlobalProviders(),
      listAgentTypes(),
    ]);

    if (projectResult.status === 'fulfilled') {
      const nextProject = projectResult.value;
      setProject(nextProject);
      setProviderRefs(nextProject.provider_refs || []);
      const platformAllowFrom = Object.fromEntries(
        (nextProject.platform_configs || []).map((config) => [config.type, config.allow_from || '']),
      );
      settingsForm.setFieldsValue({
        agentType: nextProject.agent_type,
        workDir: nextProject.work_dir || '',
        agentMode: nextProject.agent_mode || 'default',
        replyFooter: nextProject.reply_footer !== false,
        showContextIndicator: nextProject.show_context_indicator !== false,
        showWorkdirIndicator: nextProject.show_workdir_indicator !== false,
        injectSender: nextProject.inject_sender === true,
        language: nextProject.settings?.language || '',
        adminFrom: nextProject.settings?.admin_from || '',
        disabledCommands: nextProject.settings?.disabled_commands?.join(', ') || '',
        platformAllowFrom,
      });
    } else {
      setError(projectResult.reason instanceof Error ? projectResult.reason.message : String(projectResult.reason));
    }
    if (providersResult.status === 'fulfilled') setProviders(providersResult.value.providers || []);
    if (heartbeatResult.status === 'fulfilled') setHeartbeat(heartbeatResult.value?.enabled ? heartbeatResult.value : null);
    if (globalsResult.status === 'fulfilled') setGlobalProviders(globalsResult.value.providers || []);
    if (agentsResult.status === 'fulfilled') setAgentTypes((agentsResult.value.agents || []).sort());
    setLoading(false);
  }, [name, settingsForm]);

  useEffect(() => {
    void fetchAll();
    const handler = () => void fetchAll();
    window.addEventListener('cc:refresh', handler);
    return () => window.removeEventListener('cc:refresh', handler);
  }, [fetchAll]);

  const platformOptions = useMemo(() => [
    { key: 'feishu', label: 'Feishu / Lark', qr: true },
    { key: 'weixin', label: 'WeChat', qr: true },
    ...Object.entries(platformMeta).map(([key, meta]) => ({ key, label: meta.label, qr: false })),
  ], []);
  const permissionModes = useMemo(() => [
    { value: 'default', label: t('projects.permissionDefault', 'Default') },
    { value: 'acceptEdits', label: t('projects.permissionAcceptEdits', 'Accept edits') },
    { value: 'edit', label: t('projects.permissionAcceptEdits', 'Accept edits') },
    { value: 'plan', label: t('projects.permissionPlan', 'Plan') },
    { value: 'bypassPermissions', label: t('projects.permissionBypass', 'Bypass permissions') },
    { value: 'yolo', label: t('projects.permissionBypass', 'Bypass permissions') },
    { value: 'dontAsk', label: t('projects.permissionDontAsk', "Don't ask") },
  ], [t]);

  const unlinkedGlobalProviders = useMemo(() => {
    const agentType = project?.agent_type || '';
    return globalProviders.filter((provider) => !providerRefs.includes(provider.name)
      && (!provider.agent_types?.length || provider.agent_types.includes(agentType)));
  }, [globalProviders, project?.agent_type, providerRefs]);

  const handleSettingsSave = async (values: SettingsValues) => {
    if (!name || !project) return;
    setSaving(true);
    try {
      const response = await updateProject(name, {
        language: values.language,
        admin_from: values.adminFrom,
        disabled_commands: values.disabledCommands.split(',').map((value) => value.trim()).filter(Boolean),
        work_dir: values.workDir,
        mode: values.agentMode,
        ...(values.agentType !== project.agent_type ? { agent_type: values.agentType } : {}),
        reply_footer: values.replyFooter,
        show_context_indicator: values.showContextIndicator,
        show_workdir_indicator: values.showWorkdirIndicator,
        inject_sender: values.injectSender,
        platform_allow_from: values.platformAllowFrom,
      });
      if ((response as { restart_required?: boolean })?.restart_required) setRestartModalOpen(true);
      else {
        await fetchAll();
        void message.success(t('common.saved', 'Saved'));
      }
    } catch (reason) {
      void message.error(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!name) return;
    try {
      const response = await deleteProject(name);
      if (!response.restart_required) {
        navigate('/projects');
        return;
      }
      modal.confirm({
        title: t('setup.restartRequired', 'Restart required'),
        content: t('setup.restartAfterDelete'),
        okText: t('setup.restartNow', 'Restart now'),
        cancelText: t('setup.later', 'Later'),
        onOk: async () => {
          await restartSystem();
          await waitForService(8000);
          navigate('/projects');
        },
        onCancel: () => navigate('/projects'),
      });
    } catch (reason) {
      void message.error(reason instanceof Error ? reason.message : String(reason));
    }
  };

  if (loading && !project) return <Card><Skeleton active /></Card>;

  const overview = project ? (
    <Card
      className="cc-surface-card cc-project-overview"
      title={t('projects.resourceSummary', 'Resource summary')}
      extra={<Space wrap>
        <Link to={`/sessions/${encodeURIComponent(name!)}`}><Button icon={<RocketOutlined />}>{t('projects.manageSessions', 'Manage sessions')}</Button></Link>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setPlatformType(''); setPlatformModalOpen(true); }}>{t('setup.addPlatform', 'Add platform')}</Button>
      </Space>}
    >
      <Space orientation="vertical" size="large" style={{ width: '100%' }}>
        <Descriptions
          column={{ xs: 1, sm: 2 }}
          items={[
            { key: 'count', label: t('sessions.title'), children: project.sessions_count },
            { key: 'agent', label: t('projects.agentType', 'Agent type'), children: project.agent_type },
            { key: 'workdir', label: t('projects.workDir', 'Working directory'), children: <span className="cc-mono">{project.work_dir || '-'}</span> },
            { key: 'heartbeat', label: t('heartbeat.title'), children: <Badge status={heartbeat?.paused ? 'warning' : heartbeat ? 'processing' : 'default'} text={heartbeat ? (heartbeat.paused ? t('heartbeat.paused') : t('heartbeat.running')) : t('heartbeat.notEnabledShort', 'Not enabled')} /> },
          ]}
        />
        <div>
          <Typography.Text strong>{t('projects.platforms')}</Typography.Text>
          <Flex wrap gap={8} style={{ marginTop: 10 }}>
            {project.platforms?.map((platform) => (
              <Tag key={platform.type} color={platform.connected ? 'success' : 'error'} icon={<RocketOutlined />}>
                {platform.type} · {platform.connected ? t('projects.connected', 'Connected') : t('projects.offline', 'Offline')}
              </Tag>
            ))}
          </Flex>
        </div>
        {project.active_session_keys?.length > 0 && (
          <Flex wrap gap={6}>
            {project.active_session_keys.map((key) => <Tag key={key}>{key}</Tag>)}
          </Flex>
        )}
      </Space>
    </Card>
  ) : null;

  const providerContent = (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <Flex justify="flex-end">
        <Button type="primary" icon={<PlusOutlined />} onClick={() => {
          setProviderAddMode('global');
          setProviderModalOpen(true);
        }}>{t('providers.add')}</Button>
      </Flex>
      <Card className="cc-surface-card">
        <List
          locale={{ emptyText: <Empty description={t('providers.emptyProject', 'No providers configured')} /> }}
          dataSource={providers}
          renderItem={(provider) => {
            const global = providerRefs.includes(provider.name) && globalProviders.some((item) => item.name === provider.name);
            return (
              <List.Item
                actions={[
                  !provider.active
                    ? <Button key="activate" type="link" icon={<ThunderboltOutlined />} onClick={() => void activateProvider(name!, provider.name).then(fetchAll)}>{t('providers.activate')}</Button>
                    : <Tag key="active" color="green">{t('providers.active')}</Tag>,
                  !provider.active
                    ? <Popconfirm
                        key="remove"
                        title={t('common.delete')}
                        onConfirm={() => global
                          ? void saveProviderRefs(name!, providerRefs.filter((item) => item !== provider.name)).then(fetchAll)
                          : void removeProvider(name!, provider.name).then(fetchAll)}
                      >
                        <Button danger type="text" icon={<DeleteOutlined />} />
                      </Popconfirm>
                    : null,
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar className="cc-platform-avatar" icon={global ? <LinkOutlined /> : <RocketOutlined />} />}
                  title={<Space>{provider.name}{global && <Tag>{t('factor.global')}</Tag>}</Space>}
                  description={`${provider.model || '-'}${provider.base_url ? ` · ${provider.base_url}` : ''}`}
                />
              </List.Item>
            );
          }}
        />
      </Card>
    </Space>
  );

  const heartbeatContent = heartbeat ? (
      <Card
        className="cc-surface-card cc-heartbeat-card"
        title={<Space><Badge status={heartbeat.paused ? 'warning' : 'processing'} /><span>{heartbeat.paused ? t('heartbeat.paused') : t('heartbeat.running')}</span></Space>}
        extra={<Typography.Text type="secondary">{t('heartbeat.everyMinutes', { count: heartbeat.interval_mins, defaultValue: 'Every {{count}} min' })}</Typography.Text>}
      >
        <div className="cc-heartbeat-metrics">
          <span><Typography.Text strong>{t('heartbeat.runSummary', { count: heartbeat.run_count, defaultValue: '{{count}} runs' })}</Typography.Text><Typography.Text type="secondary">{t('heartbeat.runCount')}</Typography.Text></span>
          <span><Typography.Text strong type={heartbeat.error_count ? 'danger' : undefined}>{heartbeat.error_count}</Typography.Text><Typography.Text type="secondary">{t('heartbeat.errorCount')}</Typography.Text></span>
          <span><Typography.Text strong>{heartbeat.skipped_busy}</Typography.Text><Typography.Text type="secondary">{t('heartbeat.skippedBusy')}</Typography.Text></span>
        </div>
        <Descriptions
          column={{ xs: 1, sm: 2 }}
          items={[
            { key: 'last', label: t('heartbeat.lastRun'), children: formatTime(heartbeat.last_run) },
            { key: 'busy', label: t('heartbeat.skippedBusy'), children: heartbeat.skipped_busy },
            { key: 'error', label: t('heartbeat.lastError', 'Last error'), children: heartbeat.last_error || '-' },
          ]}
        />
        <Flex className="cc-heartbeat-actions" wrap gap={8}>
          <Popconfirm title={heartbeat.paused ? t('heartbeat.resumeConfirm', 'Resume heartbeat?') : t('heartbeat.pauseConfirm', 'Pause heartbeat?')} onConfirm={() => void (heartbeat.paused ? resumeHeartbeat(name!) : pauseHeartbeat(name!)).then(fetchAll)}>
            <Button icon={heartbeat.paused ? <PlayCircleOutlined /> : <PauseCircleOutlined />}>{heartbeat.paused ? t('heartbeat.resume') : t('heartbeat.pause')}</Button>
          </Popconfirm>
          <Popconfirm title={t('heartbeat.triggerConfirm', 'Run heartbeat now?')} onConfirm={() => void triggerHeartbeat(name!).then(fetchAll)}>
            <Button type="primary" icon={<HeartOutlined />}>{t('heartbeat.trigger')}</Button>
          </Popconfirm>
          <Button icon={<ClockCircleOutlined />} onClick={() => { setInterval(heartbeat.interval_mins); setIntervalModalOpen(true); }}>{t('heartbeat.setInterval')}</Button>
        </Flex>
      </Card>
  ) : <Card className="cc-empty-card"><Empty description={t('heartbeat.notEnabled', 'Heartbeat is not configured for this project.')} /></Card>;

  const settingsContent = project ? (
    <Form<SettingsValues> form={settingsForm} layout="vertical" onFinish={handleSettingsSave} requiredMark="optional">
      <Space orientation="vertical" size="large" style={{ width: '100%' }}>
        <Card className="cc-surface-card" title={t('projects.agentSettings', 'Agent')}>
          <div className="cc-form-narrow">
            <Form.Item name="agentType" label={t('projects.agentType', 'Agent type')}>
              <Select showSearch options={agentTypes.map((agent) => ({ label: agent, value: agent }))} />
            </Form.Item>
            {selectedAgentType && selectedAgentType !== project.agent_type && (
              <Alert type="warning" showIcon title={t('projects.agentTypeChangeHint', 'Changing agent type requires restart.')} style={{ marginBottom: 16 }} />
            )}
            <Form.Item name="workDir" label={t('projects.workDir', 'Working directory')}><Input /></Form.Item>
            <Form.Item name="agentMode" label={t('projects.agentMode', 'Permission mode')}><Select options={permissionModes} /></Form.Item>
          </div>
        </Card>

        <Card className="cc-surface-card" title={t('projects.generalSettings', 'General')}>
          <div className="cc-form-narrow">
            <SettingSwitch name="replyFooter" label={t('projects.replyFooter', 'Reply footer')} hint={t('projects.replyFooterHint', 'Master toggle for the per-turn reply footer')} />
            <SettingSwitch name="showContextIndicator" label={t('projects.showCtxIndicator', 'Footer line 1: context')} hint={t('projects.showCtxIndicatorHint', 'Show model, effort and context usage')} />
            <SettingSwitch name="showWorkdirIndicator" label={t('projects.showWorkdirIndicator', 'Footer line 2: workdir')} hint={t('projects.showWorkdirIndicatorHint', 'Show workspace directory')} />
            <SettingSwitch name="injectSender" label={t('projects.injectSender', 'Inject sender')} hint={t('projects.injectSenderHint', 'Prepend sender identity to agent messages')} />
            <Form.Item name="language" label={t('projects.language')}><Input placeholder="en, zh, ja..." /></Form.Item>
            <Form.Item name="adminFrom" label={t('projects.adminFrom')}><Input placeholder="user1,user2 or *" /></Form.Item>
            <Form.Item name="disabledCommands" label={t('projects.disabledCommands')}><Input placeholder="restart, upgrade, cron" /></Form.Item>
          </div>
        </Card>

        {(project.platform_configs || []).length > 0 && (
          <Card className="cc-surface-card" title={t('projects.platformAccess', 'Platform access control')}>
            <div className="cc-form-narrow">
              {project.platform_configs?.map((platform) => (
                <Form.Item key={platform.type} name={['platformAllowFrom', platform.type]} label={`${platform.type} — ${t('fields.allowFrom')}`}>
                  <Input placeholder="user1,user2 or *" />
                </Form.Item>
              ))}
            </div>
          </Card>
        )}

        <Flex justify="space-between" align="center" gap={12} wrap>
          <Button type="primary" htmlType="submit" loading={saving}>{t('common.save')}</Button>
          <Card size="small" style={{ borderColor: 'var(--cc-color-error-border)' }}>
            <Space>
              <Typography.Text type="danger">{t('projects.dangerZone', 'Danger zone')}</Typography.Text>
              <Popconfirm title={t('projects.deleteConfirm', { name })} onConfirm={handleDelete}>
                <Button danger icon={<DeleteOutlined />}>{t('common.delete')}</Button>
              </Popconfirm>
            </Space>
          </Card>
        </Flex>
      </Space>
    </Form>
  ) : null;

  return (
    <div>
      <PageHeader
        title={<Space><Link to="/projects"><Button aria-label={t('common.back')} type="text" icon={<ArrowLeftOutlined />} /></Link>{name}<Tag>{project?.agent_type}</Tag></Space>}
        description={project?.work_dir || t('projects.subtitle', 'Project configuration')}
      />
      {error && <Alert type="error" showIcon title={error} style={{ marginBottom: 18 }} />}

      <Tabs
        className="cc-project-tabs"
        activeKey={activeTab}
        onChange={(tab) => setSearchParams(tab === 'overview' ? {} : { tab })}
        indicator={{ size: (origin) => Math.max(32, origin - 22), align: 'end' }}
        items={[
          { key: 'overview', label: t('projects.tabs.overview'), icon: <RocketOutlined />, children: overview },
          { key: 'providers', label: t('projects.tabs.providers'), icon: <ThunderboltOutlined />, children: providerContent },
          { key: 'heartbeat', label: t('projects.tabs.heartbeat'), icon: <HeartOutlined />, children: heartbeatContent },
          { key: 'settings', label: t('projects.tabs.settings'), icon: <SettingOutlined />, children: settingsContent },
        ]}
      />

      <Modal open={providerModalOpen} footer={null} title={t('providers.add')} onCancel={() => setProviderModalOpen(false)} destroyOnHidden>
        <Segmented
          block
          value={providerAddMode}
          options={[
            { label: t('providers.linkGlobal', 'Link global'), value: 'global' },
            { label: t('providers.addCustom', 'Add custom'), value: 'custom' },
          ]}
          onChange={(value) => setProviderAddMode(value as 'global' | 'custom')}
          style={{ marginBottom: 18 }}
        />
        {providerAddMode === 'global' ? (
          <List
            locale={{ emptyText: <Empty description={t('providers.allLinked', 'All compatible global providers are linked.')} /> }}
            dataSource={unlinkedGlobalProviders}
            renderItem={(provider) => (
              <List.Item actions={[<Button key="link" type="primary" size="small" icon={<LinkOutlined />} onClick={async () => {
                await saveProviderRefs(name!, [...providerRefs, provider.name]);
                setProviderModalOpen(false);
                await fetchAll();
              }}>{t('providers.linkGlobal', 'Link')}</Button>]}
              >
                <List.Item.Meta title={provider.name} description={`${provider.model || '-'}${provider.base_url ? ` · ${provider.base_url}` : ''}`} />
              </List.Item>
            )}
          />
        ) : (
          <Form<CustomProviderValues>
            form={customProviderForm}
            layout="vertical"
            requiredMark="optional"
            onFinish={async (values) => {
              await addProvider(name!, values);
              customProviderForm.resetFields();
              setProviderModalOpen(false);
              await fetchAll();
            }}
          >
            <Form.Item name="name" label={t('providers.name')} rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="api_key" label="API Key"><Input.Password /></Form.Item>
            <Form.Item name="base_url" label={t('providers.baseUrl')}><Input placeholder="https://api.example.com" /></Form.Item>
            <Form.Item name="model" label={t('providers.model')}><Input /></Form.Item>
            <Flex justify="flex-end"><Button type="primary" htmlType="submit">{t('providers.add')}</Button></Flex>
          </Form>
        )}
      </Modal>

      <Modal
        open={intervalModalOpen}
        title={t('heartbeat.setInterval')}
        onCancel={() => setIntervalModalOpen(false)}
        onOk={async () => {
          await setHeartbeatInterval(name!, interval);
          setIntervalModalOpen(false);
          await fetchAll();
        }}
      >
        <InputNumber min={1} value={interval} suffix="min" style={{ width: '100%' }} onChange={(value) => setInterval(Number(value || 1))} />
      </Modal>

      <Modal open={platformModalOpen} footer={null} title={t('setup.addPlatform', 'Add platform')} onCancel={() => setPlatformModalOpen(false)} destroyOnHidden>
        {!platformType ? (
          <div className="cc-page-grid">
            {platformOptions.map((platform) => (
              <Button key={platform.key} size="large" style={{ height: 58 }} onClick={() => setPlatformType(platform.key)}>
                <span className="cc-platform-option">
                  <Avatar className="cc-platform-avatar">{platform.label.slice(0, 2).toUpperCase()}</Avatar>
                  <span>{platform.label}</span>
                  <Typography.Text type="secondary" style={{ marginInlineStart: 'auto', fontSize: 11 }}>{platform.qr ? 'QR' : 'Manual'}</Typography.Text>
                </span>
              </Button>
            ))}
          </div>
        ) : qrPlatforms.has(platformType) ? (
          <PlatformSetupQR
            platformType={platformType as 'feishu' | 'weixin'}
            projectName={name!}
            onCancel={() => setPlatformType('')}
            onComplete={() => {
              setPlatformModalOpen(false);
              setRestartModalOpen(true);
            }}
          />
        ) : (
          <PlatformManualForm
            platformType={platformType}
            projectName={name!}
            onCancel={() => setPlatformType('')}
            onComplete={() => {
              setPlatformModalOpen(false);
              setRestartModalOpen(true);
            }}
          />
        )}
      </Modal>

      <Modal
        open={restartModalOpen}
        title={t('setup.restartRequired', 'Restart required')}
        okText={t('setup.restartNow', 'Restart now')}
        cancelText={t('setup.later', 'Later')}
        okButtonProps={{ icon: <PoweroffOutlined /> }}
        onCancel={() => {
          setRestartModalOpen(false);
          void fetchAll();
        }}
        onOk={async () => {
          await restartSystem();
          setRestartModalOpen(false);
          await waitForService(8000);
          await fetchAll();
        }}
      >
        <Typography.Paragraph>{t('setup.restartHint', 'Restart the service for changes to take effect.')}</Typography.Paragraph>
      </Modal>
    </div>
  );
}

function SettingSwitch({ name, label, hint }: { name: keyof SettingsValues; label: string; hint: string }) {
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
