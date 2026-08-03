import {
  CheckOutlined,
  CloudDownloadOutlined,
  DeleteOutlined,
  EditOutlined,
  ExportOutlined,
  PlusOutlined,
  ReloadOutlined,
  StarFilled,
} from '@ant-design/icons';
import {
  Alert,
  App,
  Avatar,
  Button,
  Card,
  Checkbox,
  Empty,
  Flex,
  Form,
  Input,
  List,
  Modal,
  Popconfirm,
  Segmented,
  Select,
  Skeleton,
  Space,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  addGlobalProvider,
  fetchProviderPresets,
  importCCSwitchProviders,
  listCCSwitchProviders,
  listGlobalProviders,
  removeGlobalProvider,
  updateGlobalProvider,
  type CCSwitchProvider,
  type GlobalProvider,
  type ProviderModel,
  type ProviderPreset,
} from '@/api/providers';
import PageHeader from '@factor/components/PageHeader';

const supportedAgents = ['claudecode', 'codex', 'gemini', 'opencode', 'cursor', 'kimi', 'qoder', 'acp'];

interface AgentConfigEntry {
  base_url: string;
  model: string;
  models: ProviderModel[];
  wire_api?: string;
}

function buildAgentConfigs(provider: GlobalProvider): Record<string, AgentConfigEntry> {
  return Object.fromEntries((provider.agent_types || []).map((agent) => [agent, {
    base_url: provider.endpoints?.[agent] || provider.base_url || '',
    model: provider.agent_models?.[agent] || provider.model || '',
    models: provider.agent_model_lists?.[agent] || provider.models || [],
    wire_api: agent === 'codex' ? provider.codex?.wire_api : undefined,
  }]));
}

function mergeAgentConfigs(provider: GlobalProvider, configs: Record<string, AgentConfigEntry>): GlobalProvider {
  const agents = Object.keys(configs);
  if (agents.length < 2) return provider;
  const base = configs[agents[0]];
  const endpoints: Record<string, string> = {};
  const agentModels: Record<string, string> = {};
  const agentModelLists: Record<string, ProviderModel[]> = {};
  let codex: GlobalProvider['codex'];

  agents.forEach((agent, index) => {
    const config = configs[agent];
    if (index > 0) {
      if (config.base_url && config.base_url !== base.base_url) endpoints[agent] = config.base_url;
      if (config.model && config.model !== base.model) agentModels[agent] = config.model;
      if (config.models.length && JSON.stringify(config.models) !== JSON.stringify(base.models)) agentModelLists[agent] = config.models;
    }
    if (agent === 'codex' && config.wire_api) codex = { wire_api: config.wire_api };
  });

  return {
    ...provider,
    base_url: base.base_url,
    model: base.model,
    models: base.models.length ? base.models : undefined,
    endpoints: Object.keys(endpoints).length ? endpoints : undefined,
    agent_models: Object.keys(agentModels).length ? agentModels : undefined,
    agent_model_lists: Object.keys(agentModelLists).length ? agentModelLists : undefined,
    codex,
  };
}

export default function ProviderList() {
  const { t, i18n } = useTranslation();
  const { message } = App.useApp();
  const [providers, setProviders] = useState<GlobalProvider[]>([]);
  const [presets, setPresets] = useState<ProviderPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [presetsLoading, setPresetsLoading] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<GlobalProvider | null>(null);
  const [ccSwitchOpen, setCCSwitchOpen] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listGlobalProviders();
      setProviders(response.providers || []);
    } catch (reason) {
      void message.error(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setLoading(false);
    }
  }, [message]);

  const refreshPresets = useCallback(async () => {
    setPresetsLoading(true);
    try {
      const response = await fetchProviderPresets();
      setPresets(response.providers || []);
    } catch (reason) {
      void message.error(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setPresetsLoading(false);
    }
  }, [message]);

  useEffect(() => {
    void refresh();
    const handler = () => void refresh();
    window.addEventListener('cc:refresh', handler);
    return () => window.removeEventListener('cc:refresh', handler);
  }, [refresh]);

  const openFromPreset = (preset: ProviderPreset) => {
    const agents = Object.keys(preset.agents || {});
    const firstAgent = agents[0] || 'claudecode';
    const firstConfig = preset.agents?.[firstAgent];
    const endpoints: Record<string, string> = {};
    const agentModels: Record<string, string> = {};
    const agentModelLists: Record<string, ProviderModel[]> = {};
    let codex: GlobalProvider['codex'];

    Object.entries(preset.agents || {}).forEach(([agent, config]) => {
      if (agent !== firstAgent && config.base_url) endpoints[agent] = config.base_url;
      if (agent !== firstAgent && config.model) agentModels[agent] = config.model;
      if (agent !== firstAgent && config.models?.length) agentModelLists[agent] = config.models.map((model) => ({ model }));
      if (agent === 'codex' && config.codex_config?.wire_api) codex = config.codex_config;
    });

    setEditing({
      name: preset.name,
      api_key: '',
      base_url: firstConfig?.base_url || '',
      model: firstConfig?.model || '',
      models: firstConfig?.models?.map((model) => ({ model })),
      thinking: preset.thinking || '',
      agent_types: agents,
      endpoints,
      agent_models: agentModels,
      agent_model_lists: agentModelLists,
      codex,
    });
    setEditorOpen(true);
  };

  const existingNames = useMemo(() => new Set(providers.map((provider) => provider.name)), [providers]);

  return (
    <div>
      <PageHeader
        title={t('globalProviders.title')}
        description={t('globalProviders.subtitle')}
        extra={(
          <Space wrap>
            <Button icon={<CloudDownloadOutlined />} onClick={() => setCCSwitchOpen(true)}>{t('globalProviders.importCCSwitch')}</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => {
              setEditing(null);
              setEditorOpen(true);
            }}>{t('globalProviders.add')}</Button>
          </Space>
        )}
      />

      <Tabs
        onChange={(key) => {
          if (key === 'presets' && presets.length === 0) void refreshPresets();
        }}
        items={[
          {
            key: 'providers',
            label: t('globalProviders.tab.providers'),
            children: loading ? <Card><Skeleton active /></Card> : providers.length === 0
              ? <Card className="cc-empty-card"><Empty description={t('globalProviders.empty')} /></Card>
              : (
                <div className="cc-page-grid">
                  {providers.map((provider) => (
                    <Card
                      key={provider.name}
                      className="cc-surface-card"
                      title={<Space><Avatar className="cc-platform-avatar">AI</Avatar>{provider.name}</Space>}
                      extra={(
                        <Space>
                          <Button type="text" icon={<EditOutlined />} onClick={() => {
                            setEditing(provider);
                            setEditorOpen(true);
                          }} />
                          <Popconfirm title={t('globalProviders.deleteHint', { name: provider.name })} onConfirm={async () => {
                            await removeGlobalProvider(provider.name);
                            await refresh();
                          }}>
                            <Button type="text" danger icon={<DeleteOutlined />} />
                          </Popconfirm>
                        </Space>
                      )}
                    >
                      <Space orientation="vertical" size={10} style={{ width: '100%' }}>
                        {provider.base_url && <Typography.Text type="secondary" ellipsis>{provider.base_url}</Typography.Text>}
                        <Flex wrap gap={6}>
                          {provider.model && <Tag color="green">{provider.model}</Tag>}
                          {provider.models?.slice(0, 4).map((model) => <Tag key={model.model}>{model.alias || model.model}</Tag>)}
                          {(provider.models?.length || 0) > 4 && <Tag>+{provider.models!.length - 4}</Tag>}
                        </Flex>
                        <Flex wrap gap={6}>{provider.agent_types?.map((agent) => <Tag key={agent} color="blue">{agent}</Tag>)}</Flex>
                        {provider.thinking && <Typography.Text type="warning">thinking: {provider.thinking}</Typography.Text>}
                      </Space>
                    </Card>
                  ))}
                </div>
              ),
          },
          {
            key: 'presets',
            label: t('globalProviders.tab.presets'),
            children: presetsLoading ? <Card><Skeleton active /></Card> : presets.length === 0
              ? <Card className="cc-empty-card"><Empty description={t('globalProviders.noPresets')}><Button icon={<ReloadOutlined />} onClick={() => void refreshPresets()}>{t('common.refresh')}</Button></Empty></Card>
              : (
                <div className="cc-page-grid">
                  {[...presets].sort((left, right) => left.tier - right.tier).map((preset) => {
                    const added = existingNames.has(preset.name);
                    const description = i18n.language.startsWith('zh') && preset.description_zh ? preset.description_zh : preset.description;
                    const firstConfig = preset.agents?.[Object.keys(preset.agents || {})[0]];
                    return (
                      <Card
                        key={preset.name}
                        className="cc-surface-card"
                        title={<Space>{preset.featured && <StarFilled style={{ color: '#e8a317' }} />}{preset.display_name || preset.name}</Space>}
                        extra={preset.invite_url && <Button type="link" href={preset.invite_url} target="_blank" icon={<ExportOutlined />}>{t('globalProviders.register')}</Button>}
                        actions={[
                          <Button key="add" type={added ? 'text' : 'primary'} disabled={added} onClick={() => openFromPreset(preset)}>
                            {added ? t('globalProviders.added') : t('globalProviders.addPreset')}
                          </Button>,
                        ]}
                      >
                        <Typography.Paragraph type="secondary" ellipsis={{ rows: 2 }}>{description}</Typography.Paragraph>
                        <Flex wrap gap={6}>{Object.keys(preset.agents || {}).map((agent) => <Tag color="blue" key={agent}>{agent}</Tag>)}</Flex>
                        <Flex wrap gap={6} style={{ marginTop: 10 }}>{preset.features?.map((feature) => <Tag key={feature}>{feature}</Tag>)}</Flex>
                        <Flex wrap gap={6} style={{ marginTop: 10 }}>{firstConfig?.models?.slice(0, 5).map((model) => <Tag key={model}>{model}</Tag>)}</Flex>
                      </Card>
                    );
                  })}
                </div>
              ),
          },
        ]}
      />

      {editorOpen && (
        <ProviderEditor
          provider={editing}
          isExisting={Boolean(editing?.name && existingNames.has(editing.name))}
          onClose={() => setEditorOpen(false)}
          onSave={async (provider) => {
            if (editing?.name && existingNames.has(editing.name)) await updateGlobalProvider(editing.name, provider);
            else await addGlobalProvider(provider);
            setEditorOpen(false);
            await refresh();
          }}
        />
      )}

      {ccSwitchOpen && (
        <CCSwitchImportModal
          existingNames={existingNames}
          onClose={() => setCCSwitchOpen(false)}
          onImported={refresh}
        />
      )}
    </div>
  );
}

function ProviderEditor({
  provider,
  isExisting,
  onClose,
  onSave,
}: {
  provider: GlobalProvider | null;
  isExisting: boolean;
  onClose: () => void;
  onSave: (provider: GlobalProvider) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState<GlobalProvider>(provider || { name: '', agent_types: [] });
  const [agentConfigs, setAgentConfigs] = useState<Record<string, AgentConfigEntry>>(() => provider ? buildAgentConfigs(provider) : {});
  const [saving, setSaving] = useState(false);
  const agents = form.agent_types || [];
  const multiAgent = agents.length >= 2;

  const setAgents = (nextAgents: string[]) => {
    setForm((current) => ({ ...current, agent_types: nextAgents }));
    setAgentConfigs((current) => {
      const next = { ...current };
      nextAgents.forEach((agent) => {
        if (!next[agent]) next[agent] = {
          base_url: form.base_url || '',
          model: form.model || '',
          models: [...(form.models || [])],
          wire_api: agent === 'codex' ? form.codex?.wire_api : undefined,
        };
      });
      Object.keys(next).forEach((agent) => {
        if (!nextAgents.includes(agent)) delete next[agent];
      });
      return next;
    });
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await onSave(multiAgent ? mergeAgentConfigs(form, agentConfigs) : form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      title={isExisting ? t('globalProviders.edit') : t('globalProviders.add')}
      width={720}
      onCancel={onClose}
      onOk={handleSave}
      confirmLoading={saving}
      okButtonProps={{ disabled: !form.name.trim() }}
      destroyOnHidden
    >
      <Form layout="vertical" requiredMark="optional">
        <Form.Item label={t('globalProviders.form.name')} required>
          <Input value={form.name} disabled={isExisting} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </Form.Item>
        <Form.Item label="API Key">
          <Input.Password value={form.api_key || ''} onChange={(event) => setForm({ ...form, api_key: event.target.value })} />
        </Form.Item>
        <Form.Item label={t('globalProviders.form.agentTypes')} extra={t('globalProviders.form.agentTypesHint')}>
          <Checkbox.Group options={supportedAgents} value={agents} onChange={(values) => setAgents(values as string[])} />
        </Form.Item>

        {!multiAgent ? (
          <>
            <Form.Item label={t('globalProviders.form.baseUrl')}><Input value={form.base_url || ''} onChange={(event) => setForm({ ...form, base_url: event.target.value })} /></Form.Item>
            <Form.Item label={t('globalProviders.form.model')} extra={t('globalProviders.form.modelHint')}><Input value={form.model || ''} onChange={(event) => setForm({ ...form, model: event.target.value })} /></Form.Item>
            <Form.Item label={t('globalProviders.form.models')} extra={t('globalProviders.form.modelsHint')}>
              <Select
                mode="tags"
                value={(form.models || []).map((model) => model.model)}
                onChange={(models) => setForm({ ...form, models: models.map((model) => ({ model })) })}
                placeholder="model-name"
              />
            </Form.Item>
            {agents.includes('codex') && (
              <Form.Item label={t('globalProviders.form.codexWireApi')}>
                <Select
                  allowClear
                  value={form.codex?.wire_api}
                  options={[{ value: 'responses' }, { value: 'chat' }]}
                  onChange={(wire_api) => setForm({ ...form, codex: wire_api ? { wire_api } : undefined })}
                />
              </Form.Item>
            )}
          </>
        ) : (
          <Card size="small" title={t('globalProviders.form.perAgentHint')}>
            <Tabs
              items={agents.map((agent) => ({
                key: agent,
                label: agent,
                children: (
                  <AgentConfigEditor
                    agent={agent}
                    value={agentConfigs[agent] || { base_url: '', model: '', models: [] }}
                    onChange={(value) => setAgentConfigs((current) => ({ ...current, [agent]: value }))}
                  />
                ),
              }))}
            />
          </Card>
        )}

        <Form.Item label="Thinking">
          <Select
            allowClear
            value={form.thinking || undefined}
            options={[{ value: 'enabled' }, { value: 'disabled' }]}
            onChange={(thinking) => setForm({ ...form, thinking })}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

function AgentConfigEditor({ agent, value, onChange }: { agent: string; value: AgentConfigEntry; onChange: (value: AgentConfigEntry) => void }) {
  const { t } = useTranslation();
  return (
    <Form layout="vertical" requiredMark="optional">
      <Form.Item label={t('globalProviders.form.baseUrl')}><Input value={value.base_url} onChange={(event) => onChange({ ...value, base_url: event.target.value })} /></Form.Item>
      <Form.Item label={t('globalProviders.form.model')}><Input value={value.model} onChange={(event) => onChange({ ...value, model: event.target.value })} /></Form.Item>
      <Form.Item label={t('globalProviders.form.models')}>
        <Select mode="tags" value={value.models.map((model) => model.model)} onChange={(models) => onChange({ ...value, models: models.map((model) => ({ model })) })} />
      </Form.Item>
      {agent === 'codex' && (
        <Form.Item label={t('globalProviders.form.codexWireApi')}>
          <Select allowClear value={value.wire_api} options={[{ value: 'responses' }, { value: 'chat' }]} onChange={(wire_api) => onChange({ ...value, wire_api })} />
        </Form.Item>
      )}
    </Form>
  );
}

function CCSwitchImportModal({
  existingNames,
  onClose,
  onImported,
}: {
  existingNames: Set<string>;
  onClose: () => void;
  onImported: () => void;
}) {
  const { t } = useTranslation();
  const [providers, setProviders] = useState<CCSwitchProvider[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: string[]; skipped: string[] } | null>(null);

  useEffect(() => {
    void listCCSwitchProviders().then((response) => {
      if (!response.available) {
        setError(response.error || t('globalProviders.ccSwitch.notFound'));
        return;
      }
      const nextProviders = response.providers || [];
      setProviders(nextProviders);
      setSelected(nextProviders.filter((provider) => !existingNames.has(provider.name)).map((provider) => provider.name));
    }).catch(() => setError(t('globalProviders.ccSwitch.notFound'))).finally(() => setLoading(false));
  }, [existingNames, t]);

  return (
    <Modal open title={t('globalProviders.ccSwitch.title')} footer={null} onCancel={onClose} destroyOnHidden>
      {loading ? <Skeleton active /> : error ? <Alert type="warning" showIcon title={error} /> : result ? (
        <Space orientation="vertical" style={{ width: '100%' }}>
          <Alert type="success" showIcon title={t('globalProviders.ccSwitch.result', { imported: result.imported.length, skipped: result.skipped.length })} />
          <Flex justify="flex-end"><Button onClick={onClose}>{t('common.close')}</Button></Flex>
        </Space>
      ) : (
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          <Typography.Text type="secondary">{t('globalProviders.ccSwitch.hint', { count: providers.length })}</Typography.Text>
          <Checkbox.Group value={selected} onChange={(values) => setSelected(values as string[])} style={{ width: '100%' }}>
            <List
              dataSource={providers}
              renderItem={(provider) => {
                const exists = existingNames.has(provider.name);
                return (
                  <List.Item>
                    <Checkbox value={provider.name} disabled={exists}>
                      <Space>
                        <Typography.Text strong>{provider.name}</Typography.Text>
                        <Tag>{provider.app_type}</Tag>
                        {provider.is_current && <Tag color="green">{t('globalProviders.ccSwitch.active')}</Tag>}
                        {exists && <Tag color="orange">{t('globalProviders.ccSwitch.exists')}</Tag>}
                      </Space>
                      <div><Typography.Text type="secondary">{provider.model}{provider.base_url ? ` · ${provider.base_url}` : ''}</Typography.Text></div>
                    </Checkbox>
                  </List.Item>
                );
              }}
            />
          </Checkbox.Group>
          <Flex justify="flex-end" gap={8}>
            <Button onClick={onClose}>{t('common.cancel')}</Button>
            <Button type="primary" loading={importing} disabled={!selected.length} icon={<CheckOutlined />} onClick={async () => {
              setImporting(true);
              try {
                const response = await importCCSwitchProviders(selected);
                setResult(response);
                onImported();
              } finally {
                setImporting(false);
              }
            }}>{t('globalProviders.ccSwitch.import', { count: selected.length })}</Button>
          </Flex>
        </Space>
      )}
    </Modal>
  );
}
