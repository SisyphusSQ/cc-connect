import {
  ClockCircleOutlined,
  CodeOutlined,
  DeleteOutlined,
  EditOutlined,
  MessageOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Alert, App, Button, Card, Empty, Flex, Form, Input, Modal, Popconfirm, Segmented, Select, Skeleton, Space, Switch, Tag, Typography } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createCronJob, deleteCronJob, listCronJobs, triggerCronJob, updateCronJob, type CronJob } from '@/api/cron';
import { listProjects, type ProjectSummary } from '@/api/projects';
import { listSessions } from '@/api/sessions';
import { formatTime } from '@/lib/utils';
import PageHeader from '@factor/components/PageHeader';

interface JobForm {
  project: string;
  session_key: string;
  cron_expr: string;
  prompt: string;
  exec: string;
  description: string;
  silent: boolean;
  enabled: boolean;
  mode: string;
  type: 'prompt' | 'exec';
}

const emptyForm: JobForm = {
  project: '',
  session_key: '',
  cron_expr: '',
  prompt: '',
  exec: '',
  description: '',
  silent: false,
  enabled: true,
  mode: '',
  type: 'prompt',
};

const presets = [
  ['* * * * *', 'Every minute', '每分钟'],
  ['*/5 * * * *', 'Every 5 min', '每 5 分钟'],
  ['*/15 * * * *', 'Every 15 min', '每 15 分钟'],
  ['*/30 * * * *', 'Every 30 min', '每 30 分钟'],
  ['0 * * * *', 'Every hour', '每小时'],
  ['0 */2 * * *', 'Every 2 hours', '每 2 小时'],
  ['0 */6 * * *', 'Every 6 hours', '每 6 小时'],
  ['0 6 * * *', 'Daily 6:00', '每天 6:00'],
  ['0 9 * * *', 'Daily 9:00', '每天 9:00'],
  ['0 18 * * *', 'Daily 18:00', '每天 18:00'],
  ['0 9 * * 1-5', 'Weekdays 9:00', '工作日 9:00'],
  ['0 9 * * 1', 'Weekly Mon 9:00', '每周一 9:00'],
  ['0 0 1 * *', 'Monthly 1st', '每月 1 号'],
] as const;

const modeOptions = ['bypassPermissions', 'acceptEdits', 'auto', 'plan', 'dontAsk'];
const customCronValue = '__custom__';

export default function CronList() {
  const { t, i18n } = useTranslation();
  const { message } = App.useApp();
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [sessionKeys, setSessionKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CronJob | null>(null);
  const [form, setForm] = useState<JobForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [triggering, setTriggering] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [jobResponse, projectResponse] = await Promise.all([listCronJobs(), listProjects()]);
      setJobs(jobResponse.jobs || []);
      setProjects(projectResponse.projects || []);
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

  useEffect(() => {
    if (!form.project) {
      setSessionKeys([]);
      return;
    }
    let cancelled = false;
    void listSessions(form.project).then((response) => {
      if (!cancelled) setSessionKeys([...new Set((response.sessions || []).map((session) => session.session_key).filter(Boolean))]);
    }).catch(() => {
      if (!cancelled) setSessionKeys([]);
    });
    return () => {
      cancelled = true;
    };
  }, [form.project]);

  const presetValues = useMemo<Set<string>>(() => new Set(presets.map(([expression]) => expression)), []);
  const chinese = i18n.language.startsWith('zh');
  const scheduleOptions: { value: string; label: string }[] = presets.map(([value, label, labelZh]) => ({ value, label: `${chinese ? labelZh : label} · ${value}` }));
  scheduleOptions.push({ value: customCronValue, label: chinese ? '自定义表达式' : 'Custom expression' });

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setModalOpen(true);
  };

  const openEdit = (job: CronJob) => {
    setEditing(job);
    setForm({
      project: job.project,
      session_key: job.session_key,
      cron_expr: job.cron_expr,
      prompt: job.prompt,
      exec: job.exec,
      description: job.description,
      silent: Boolean(job.silent),
      enabled: job.enabled,
      mode: job.mode || '',
      type: job.exec ? 'exec' : 'prompt',
    });
    setModalOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const body = {
        project: form.project,
        session_key: form.session_key,
        cron_expr: form.cron_expr,
        prompt: form.type === 'prompt' ? form.prompt : '',
        exec: form.type === 'exec' ? form.exec : '',
        description: form.description,
        silent: form.silent,
        enabled: form.enabled,
        mode: form.mode,
      };
      if (editing) await updateCronJob(editing.id, body);
      else await createCronJob(body);
      setModalOpen(false);
      await refresh();
      void message.success(t('common.saved', 'Saved'));
    } catch (reason) {
      void message.error(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={t('cron.title')}
        description={t('cron.subtitle', 'Schedule prompts and local commands for project sessions.')}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>{t('cron.add')}</Button>}
      />

      {loading && jobs.length === 0 ? <Card><Skeleton active /></Card> : jobs.length === 0 ? (
        <Card className="cc-empty-card"><Empty description={t('cron.noJobs')} /></Card>
      ) : (
        <div className="cc-page-grid">
          {jobs.map((job) => {
            const preset = presets.find(([expression]) => expression === job.cron_expr);
            return (
              <Card
                key={job.id}
                className="cc-surface-card"
                style={{ opacity: job.enabled ? 1 : 0.62 }}
                title={<Space>{job.prompt ? <MessageOutlined /> : <CodeOutlined />}{job.description || job.id}</Space>}
                extra={<Tag color={job.enabled ? 'green' : 'default'}>{job.enabled ? t('cron.enabled') : 'disabled'}</Tag>}
                actions={[
                  <Button key="run" type="text" icon={<PlayCircleOutlined />} loading={triggering === job.id} onClick={async () => {
                    setTriggering(job.id);
                    try {
                      await triggerCronJob(job.id);
                      void message.success(t('cron.triggerPending'));
                      await refresh();
                    } finally {
                      setTriggering('');
                    }
                  }}>{t('cron.trigger')}</Button>,
                  <Button key="toggle" type="text" icon={job.enabled ? <PauseCircleOutlined /> : <PlayCircleOutlined />} onClick={() => void updateCronJob(job.id, { enabled: !job.enabled }).then(refresh)}>{job.enabled ? t('factor.disable') : t('factor.enable')}</Button>,
                  <Button key="edit" type="text" icon={<EditOutlined />} onClick={() => openEdit(job)}>{t('common.edit', 'Edit')}</Button>,
                  <Popconfirm key="delete" title={t('common.confirmDelete')} onConfirm={() => void deleteCronJob(job.id).then(refresh)}><Button danger type="text" icon={<DeleteOutlined />}>{t('common.delete')}</Button></Popconfirm>,
                ]}
              >
                <Space orientation="vertical" size={10} style={{ width: '100%' }}>
                  <Flex wrap gap={6}>
                    <Tag icon={<ClockCircleOutlined />} color="green">{preset ? (chinese ? preset[2] : preset[1]) : job.cron_expr}</Tag>
                    {job.silent && <Tag>{t('cron.silent')}</Tag>}
                    <Tag>{job.mode || t('cron.modeDefault')}</Tag>
                  </Flex>
                  <Typography.Text type="secondary">{t('cron.project')}: {job.project}</Typography.Text>
                  {job.prompt && <Typography.Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0 }}>{job.prompt}</Typography.Paragraph>}
                  {job.exec && <Typography.Text className="cc-mono" ellipsis>{job.exec}</Typography.Text>}
                  {job.last_run && <Typography.Text type="secondary">{t('cron.lastRun')}: {formatTime(job.last_run)}</Typography.Text>}
                  {job.last_error && <Alert type="error" title={job.last_error} />}
                </Space>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        width={640}
        title={editing ? t('cron.editJob') : t('cron.add')}
        okText={t('common.save')}
        confirmLoading={saving}
        okButtonProps={{ disabled: !form.project || !form.cron_expr || !(form.type === 'prompt' ? form.prompt : form.exec) }}
        onOk={save}
        onCancel={() => setModalOpen(false)}
        destroyOnHidden
      >
        <Form layout="vertical" requiredMark="optional">
          <Form.Item label={t('cron.project')} required>
            <Select value={form.project || undefined} options={projects.map((project) => ({ label: project.name, value: project.name }))} onChange={(project) => setForm({ ...form, project, session_key: '' })} />
          </Form.Item>
          <Form.Item label={t('cron.schedule')} required>
            <Select
              value={presetValues.has(form.cron_expr) ? form.cron_expr : form.cron_expr ? customCronValue : undefined}
              options={scheduleOptions}
              onChange={(value) => setForm({ ...form, cron_expr: value === customCronValue ? '' : value })}
            />
            {!presetValues.has(form.cron_expr) && (
              <Input className="cc-mono" style={{ marginTop: 8 }} placeholder="0 9 * * 1-5" value={form.cron_expr} onChange={(event) => setForm({ ...form, cron_expr: event.target.value })} />
            )}
          </Form.Item>
          <Form.Item label={t('cron.description')}><Input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Form.Item>
          <Form.Item label={t('cron.taskType')}>
            <Segmented
              block
              value={form.type}
              options={[
                { label: t('cron.prompt'), value: 'prompt', icon: <MessageOutlined /> },
                { label: t('cron.exec'), value: 'exec', icon: <CodeOutlined /> },
              ]}
              onChange={(type) => setForm({ ...form, type: type as JobForm['type'] })}
            />
          </Form.Item>
          {form.type === 'prompt' ? (
            <Form.Item label={t('cron.prompt')} required><Input.TextArea rows={4} value={form.prompt} onChange={(event) => setForm({ ...form, prompt: event.target.value })} /></Form.Item>
          ) : (
            <Form.Item label={t('cron.exec')} required><Input className="cc-mono" value={form.exec} onChange={(event) => setForm({ ...form, exec: event.target.value })} placeholder="npm run report" /></Form.Item>
          )}
          <Form.Item label={t('cron.sessionKey')}>
            <Select allowClear showSearch value={form.session_key || undefined} options={sessionKeys.map((key) => ({ label: key, value: key }))} onChange={(session_key) => setForm({ ...form, session_key: session_key || '' })} />
          </Form.Item>
          <Form.Item label={t('cron.mode')}>
            <Select allowClear value={form.mode || undefined} options={modeOptions.map((mode) => ({ label: mode, value: mode }))} onChange={(mode) => setForm({ ...form, mode: mode || '' })} />
          </Form.Item>
          <Flex gap={24} wrap>
            <Space><Switch checked={form.enabled} onChange={(enabled) => setForm({ ...form, enabled })} />{t('cron.enabled')}</Space>
            <Space><Switch checked={form.silent} onChange={(silent) => setForm({ ...form, silent })} />{t('cron.silent')}</Space>
          </Flex>
        </Form>
      </Modal>
    </div>
  );
}
