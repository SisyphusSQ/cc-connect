import {
  ApiOutlined,
  FolderOpenOutlined,
  HeartOutlined,
  MobileOutlined,
  PlusOutlined,
  RightOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Alert, Avatar, Button, Card, Empty, Flex, Form, Input, Modal, Select, Skeleton, Space, Tag, Typography } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { listAgentTypes, listProjects, type ProjectSummary } from '@/api/projects';
import { platformMeta } from '@/lib/platformMeta';
import PageHeader from '@factor/components/PageHeader';
import PlatformManualForm from '@factor/pages/projects/PlatformManualForm';
import PlatformSetupQR from '@factor/pages/projects/PlatformSetupQR';

type WizardStep = 'project' | 'platform' | 'qr' | 'form';

interface ProjectDraft {
  name: string;
  workDir: string;
  agentType: string;
}

const fallbackAgents = ['claudecode', 'codex', 'gemini', 'antigravity', 'cursor', 'devin', 'copilot', 'acp', 'acp:openclaw', 'opencode', 'qoder'];
const qrPlatforms = new Set(['feishu', 'lark', 'weixin']);

export default function ProjectList() {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [agents, setAgents] = useState(fallbackAgents);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState<WizardStep>('project');
  const [draft, setDraft] = useState<ProjectDraft>({ name: '', workDir: '', agentType: 'claudecode' });
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [form] = Form.useForm<ProjectDraft>();

  const platformOptions = useMemo(() => [
    { key: 'feishu', label: 'Feishu / Lark', qr: true },
    { key: 'weixin', label: 'WeChat', qr: true },
    ...Object.entries(platformMeta).map(([key, meta]) => ({ key, label: meta.label, qr: false })),
  ], []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [projectResponse, typeResponse] = await Promise.all([listProjects(), listAgentTypes().catch(() => null)]);
      setProjects(projectResponse.projects || []);
      if (typeResponse?.agents?.length) setAgents(typeResponse.agents);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const handler = () => void refresh();
    window.addEventListener('cc:refresh', handler);
    return () => window.removeEventListener('cc:refresh', handler);
  }, [refresh]);

  const openWizard = () => {
    const initial = { name: '', workDir: '', agentType: agents[0] || 'claudecode' };
    setDraft(initial);
    form.setFieldsValue(initial);
    setSelectedPlatform('');
    setStep('project');
    setWizardOpen(true);
  };

  const closeWizard = () => setWizardOpen(false);
  const complete = () => {
    closeWizard();
    void refresh();
  };

  return (
    <div>
      <PageHeader
        title={t('projects.title')}
        description={t('projects.subtitle', 'Manage agent workspaces, messaging platforms and project-level behavior.')}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={openWizard}>{t('setup.addProject', 'Add project')}</Button>}
      />
      {error && <Alert type="error" showIcon title={error} style={{ marginBottom: 18 }} />}

      {loading && projects.length === 0 ? (
        <Card><Skeleton active /></Card>
      ) : projects.length === 0 ? (
        <Card className="cc-empty-card"><Empty description={t('projects.noProjects')} /></Card>
      ) : (
        <div className="cc-page-grid">
          {projects.map((project) => (
            <Link key={project.name} to={`/projects/${project.name}`} className="cc-card-link">
              <Card hoverable className="cc-surface-card">
                <Flex align="flex-start" gap={14}>
                  <Avatar size={44} className="cc-platform-avatar" icon={<FolderOpenOutlined />} />
                  <Space orientation="vertical" size={3} style={{ minWidth: 0, flex: 1 }}>
                    <Typography.Text strong ellipsis>{project.name}</Typography.Text>
                    <Tag color="green">{project.agent_type}</Tag>
                  </Space>
                  <RightOutlined />
                </Flex>
                <Flex wrap gap={6} style={{ marginTop: 18 }}>
                  {project.platforms?.slice(0, 4).map((platform) => <Tag key={platform}>{platform}</Tag>)}
                  {(project.platforms?.length || 0) > 4 && <Tag>+{project.platforms.length - 4}</Tag>}
                </Flex>
                <Flex justify="space-between" style={{ marginTop: 16 }}>
                  <Typography.Text type="secondary">{t('factor.sessionCount', { count: project.sessions_count })}</Typography.Text>
                  {project.heartbeat_enabled && <Typography.Text type="success"><HeartOutlined /> {t('heartbeat.title')}</Typography.Text>}
                </Flex>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Modal
        open={wizardOpen}
        title={t('setup.addProject', 'Add project')}
        footer={null}
        width={640}
        destroyOnHidden
        onCancel={closeWizard}
      >
        {step === 'project' && (
          <Form<ProjectDraft>
            form={form}
            layout="vertical"
            initialValues={draft}
            requiredMark="optional"
            onFinish={(values) => {
              const normalized = { ...values, name: values.name.replace(/[^a-zA-Z0-9_-]/g, '') };
              setDraft(normalized);
              setStep('platform');
            }}
          >
            <Form.Item name="name" label={t('setup.projectName', 'Project name')} rules={[{ required: true }, { pattern: /^[a-zA-Z0-9_-]+$/ }]}>
              <Input placeholder="my-project" autoFocus />
            </Form.Item>
            <Form.Item name="workDir" label={t('setup.workDir', 'Working directory')} rules={[{ required: true }]}>
              <Input placeholder="/path/to/project" />
            </Form.Item>
            <Form.Item name="agentType" label={t('setup.agentType', 'Agent type')} rules={[{ required: true }]}>
              <Select showSearch options={agents.map((agent) => ({ label: agent, value: agent }))} />
            </Form.Item>
            <Flex justify="flex-end" gap={8}>
              <Button onClick={closeWizard}>{t('common.cancel')}</Button>
              <Button type="primary" htmlType="submit">{t('setup.next', 'Next')}</Button>
            </Flex>
          </Form>
        )}

        {step === 'platform' && (
          <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
            <Typography.Text type="secondary">{t('setup.choosePlatform', 'Choose a platform to connect:')}</Typography.Text>
            <div className="cc-page-grid">
              {platformOptions.map((platform) => (
                <Button
                  key={platform.key}
                  size="large"
                  icon={platform.qr ? <MobileOutlined /> : <SettingOutlined />}
                  style={{ height: 58, justifyContent: 'flex-start' }}
                  onClick={() => {
                    setSelectedPlatform(platform.key);
                    setStep(platform.qr ? 'qr' : 'form');
                  }}
                >
                  <span className="cc-platform-option">
                    <span>{platform.label}</span>
                    <Typography.Text type="secondary" style={{ marginInlineStart: 'auto', fontSize: 11 }}>
                      {platform.qr ? t('setup.scanToConnect', 'QR') : t('setup.manualSetup', 'Manual')}
                    </Typography.Text>
                  </span>
                </Button>
              ))}
            </div>
            <Button icon={<ApiOutlined />} onClick={() => setStep('project')}>{t('common.back')}</Button>
          </Space>
        )}

        {step === 'qr' && qrPlatforms.has(selectedPlatform) && (
          <PlatformSetupQR
            platformType={selectedPlatform as 'feishu' | 'weixin'}
            projectName={draft.name}
            workDir={draft.workDir}
            agentType={draft.agentType}
            onComplete={complete}
            onCancel={() => setStep('platform')}
          />
        )}

        {step === 'form' && (
          <PlatformManualForm
            platformType={selectedPlatform}
            projectName={draft.name}
            workDir={draft.workDir}
            agentType={draft.agentType}
            onComplete={complete}
            onCancel={() => setStep('platform')}
          />
        )}
      </Modal>
    </div>
  );
}
