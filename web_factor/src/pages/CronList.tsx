import {
  CodeOutlined,
  DeleteOutlined,
  EditOutlined,
  EllipsisOutlined,
  EyeOutlined,
  MessageOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  Alert,
  App,
  Badge,
  Button,
  Card,
  Collapse,
  Drawer,
  Dropdown,
  Empty,
  Flex,
  Form,
  Grid,
  Input,
  InputNumber,
  Popconfirm,
  Segmented,
  Select,
  Skeleton,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  type TableProps,
} from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createCronJob, deleteCronJob, listCronJobs, triggerCronJob, updateCronJob, type CronJob } from '@/api/cron';
import { listProjects, type ProjectSummary } from '@/api/projects';
import { listSessions } from '@/api/sessions';
import { formatTime } from '@/lib/utils';
import PageHeader from '@factor/components/PageHeader';

type JobStatus = 'all' | 'enabled' | 'disabled' | 'error';
type NotificationMode = 'inherit' | 'all' | 'result' | 'none';

interface JobForm {
  project: string;
  session_key: string;
  cron_expr: string;
  prompt: string;
  exec: string;
  work_dir: string;
  description: string;
  session_mode: string;
  mode: string;
  timeout_mins?: number;
  notification: NotificationMode;
  type: 'prompt' | 'exec';
}

const emptyForm: JobForm = {
  project: '', session_key: '', cron_expr: '', prompt: '', exec: '', work_dir: '', description: '',
  session_mode: '', mode: '', timeout_mins: undefined, notification: 'inherit', type: 'prompt',
};

const presetExpressions = [
  ['*/5 * * * *', 'every5Minutes'],
  ['*/15 * * * *', 'every15Minutes'],
  ['0 * * * *', 'everyHour'],
  ['0 9 * * *', 'daily9'],
  ['0 9 * * 1-5', 'weekdays9'],
] as const;

const modeOptions = ['bypassPermissions', 'acceptEdits', 'auto', 'plan', 'dontAsk'];
const customCronValue = '__custom__';

function jobTitle(job: CronJob) {
  return job.description || job.prompt || job.exec || job.id;
}

function notificationMode(job: CronJob): NotificationMode {
  if (job.mute) return 'none';
  if (job.silent === true) return 'result';
  if (job.silent === false) return 'all';
  return 'inherit';
}

export default function CronList() {
  const { t } = useTranslation();
  const { message, modal } = App.useApp();
  const screens = Grid.useBreakpoint();
  const compactTable = !screens.md;
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [sessionKeys, setSessionKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CronJob | null>(null);
  const [detail, setDetail] = useState<CronJob | null>(null);
  const [form, setForm] = useState<JobForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [triggering, setTriggering] = useState('');
  const [mutating, setMutating] = useState('');
  const [query, setQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState<string>();
  const [statusFilter, setStatusFilter] = useState<JobStatus>('all');

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [jobResponse, projectResponse] = await Promise.all([listCronJobs(), listProjects()]);
      setJobs(jobResponse.jobs || []);
      setProjects(projectResponse.projects || []);
    } catch (reason) {
      setLoadError(reason instanceof Error ? reason.message : String(reason));
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
    if (!formOpen || !form.project) {
      setSessionKeys([]);
      return;
    }
    let cancelled = false;
    void listSessions(form.project).then((response) => {
      if (!cancelled) setSessionKeys([...new Set((response.sessions || []).map((session) => session.session_key).filter(Boolean))]);
    }).catch(() => {
      if (!cancelled) setSessionKeys([]);
    });
    return () => { cancelled = true; };
  }, [form.project, formOpen]);

  const presetValues = useMemo<Set<string>>(() => new Set(presetExpressions.map(([expression]) => expression)), []);
  const scheduleOptions = useMemo(() => [
    ...presetExpressions.map(([value, key]) => ({ value, label: `${t(`cron.${key}`)} · ${value}` })),
    { value: customCronValue, label: t('cron.customExpression') },
  ], [t]);

  const counts = useMemo(() => ({
    enabled: jobs.filter((job) => job.enabled).length,
    error: jobs.filter((job) => Boolean(job.last_error)).length,
  }), [jobs]);

  const visibleJobs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return jobs.filter((job) => {
      const matchesQuery = !normalizedQuery || [job.description, job.prompt, job.exec, job.project, job.session_key, job.cron_expr]
        .some((value) => value?.toLowerCase().includes(normalizedQuery));
      const matchesProject = !projectFilter || job.project === projectFilter;
      const matchesStatus = statusFilter === 'all'
        || (statusFilter === 'enabled' && job.enabled)
        || (statusFilter === 'disabled' && !job.enabled)
        || (statusFilter === 'error' && Boolean(job.last_error));
      return matchesQuery && matchesProject && matchesStatus;
    });
  }, [jobs, projectFilter, query, statusFilter]);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm, project: projects.length === 1 ? projects[0].name : '' });
    setFormOpen(true);
  };

  const openEdit = (job: CronJob) => {
    setEditing(job);
    setDetail(null);
    setForm({
      project: job.project,
      session_key: job.session_key,
      cron_expr: job.cron_expr,
      prompt: job.prompt,
      exec: job.exec,
      work_dir: job.work_dir,
      description: job.description,
      session_mode: job.session_mode || '',
      mode: job.mode || '',
      timeout_mins: job.timeout_mins,
      notification: notificationMode(job),
      type: job.exec ? 'exec' : 'prompt',
    });
    setFormOpen(true);
  };

  const saveDisabled = !form.project || !form.session_key || !form.cron_expr
    || !(form.type === 'prompt' ? form.prompt.trim() : form.exec.trim());

  const save = async () => {
    if (saveDisabled) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        project: form.project,
        session_key: form.session_key,
        cron_expr: form.cron_expr,
        prompt: form.type === 'prompt' ? form.prompt : '',
        exec: form.type === 'exec' ? form.exec : '',
        work_dir: form.type === 'exec' ? form.work_dir : '',
        description: form.description,
        session_mode: form.session_mode,
        mode: form.mode,
        timeout_mins: form.timeout_mins ?? null,
        mute: form.notification === 'none',
        silent: form.notification === 'inherit' ? null : form.notification === 'result',
      };
      if (!editing) {
        if (body.timeout_mins === null) delete body.timeout_mins;
        if (body.silent === null) delete body.silent;
        delete body.mute;
        await createCronJob(body);
      } else {
        await updateCronJob(editing.id, body);
      }
      setFormOpen(false);
      await refresh();
      void message.success(t('common.saved'));
    } catch (reason) {
      void message.error(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setSaving(false);
    }
  };

  const runNow = async (job: CronJob) => {
    setTriggering(job.id);
    try {
      await triggerCronJob(job.id);
      void message.success(t('cron.triggerPending'));
      await refresh();
    } catch (reason) {
      void message.error(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setTriggering('');
    }
  };

  const toggle = async (job: CronJob) => {
    setMutating(job.id);
    try {
      await updateCronJob(job.id, { enabled: !job.enabled });
      await refresh();
    } catch (reason) {
      void message.error(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setMutating('');
    }
  };

  const remove = async (job: CronJob) => {
    setMutating(job.id);
    try {
      await deleteCronJob(job.id);
      await refresh();
      void message.success(t('cron.deleted'));
    } catch (reason) {
      void message.error(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setMutating('');
    }
  };

  const scheduleLabel = (expression: string) => {
    const preset = presetExpressions.find(([value]) => value === expression);
    return preset ? t(`cron.${preset[1]}`) : t('cron.customSchedule');
  };

  const handleMoreAction = (key: string, job: CronJob) => {
    if (key === 'edit') {
      openEdit(job);
      return;
    }
    if (key === 'delete') {
      modal.confirm({
        title: t('common.confirmDelete'),
        okText: t('common.delete'),
        okButtonProps: { danger: true },
        onOk: () => remove(job),
      });
      return;
    }
    setDetail(job);
  };

  const columns: TableProps<CronJob>['columns'] = [
    {
      title: t('cron.task'), key: 'task', width: compactTable ? 170 : 340,
      render: (_, job) => (
        <Space align="start" className="cc-cron-task">
          <span className="cc-cron-task-icon">{job.prompt ? <MessageOutlined /> : <CodeOutlined />}</span>
          <div>
            <Button type="link" className="cc-cron-title" onClick={() => setDetail(job)}>{jobTitle(job)}</Button>
            {!compactTable && <Typography.Paragraph type="secondary" ellipsis={{ rows: 1 }} className={job.exec ? 'cc-mono' : ''}>{job.prompt || job.exec}</Typography.Paragraph>}
          </div>
        </Space>
      ),
    },
    {
      title: t('cron.schedule'), key: 'schedule', width: 190, responsive: ['md'],
      render: (_, job) => <div><Typography.Text>{scheduleLabel(job.cron_expr)}</Typography.Text><br /><Typography.Text type="secondary" className="cc-mono">{job.cron_expr}</Typography.Text></div>,
    },
    {
      title: t('cron.scope'), key: 'scope', width: 220, responsive: ['lg'],
      render: (_, job) => <div><Typography.Text>{job.project}</Typography.Text><br /><Typography.Text type="secondary" ellipsis className="cc-mono">{job.session_key}</Typography.Text></div>,
    },
    {
      title: t('cron.status'), key: 'status', width: compactTable ? 88 : 170,
      render: (_, job) => <Space orientation="vertical" size={2}>
        {compactTable
          ? <Typography.Text>{job.last_error ? t('cron.error') : job.enabled ? t('factor.enable') : t('factor.disable')}</Typography.Text>
          : <Badge status={job.last_error ? 'error' : job.enabled ? 'success' : 'default'} text={job.last_error ? t('cron.error') : job.enabled ? t('cron.enabled') : t('cron.disabled')} />}
        {!compactTable && <Typography.Text type="secondary" className="cc-cron-last-run">{job.last_run ? formatTime(job.last_run) : t('cron.neverRun')}</Typography.Text>}
      </Space>,
    },
    {
      title: t('common.actions'), key: 'actions', width: compactTable ? 140 : 250, fixed: compactTable ? undefined : 'right',
      render: (_, job) => <Space size={compactTable ? 0 : 4}>
        <Popconfirm title={t('cron.runConfirm')} okText={t('cron.trigger')} onConfirm={() => runNow(job)}>
          <Button type="text" icon={<PlayCircleOutlined />} loading={triggering === job.id} aria-label={`${t('cron.trigger')} ${jobTitle(job)}`}>{!compactTable && t('cron.trigger')}</Button>
        </Popconfirm>
        <Switch size="small" checked={job.enabled} loading={mutating === job.id} aria-label={`${job.enabled ? t('factor.disable') : t('factor.enable')} ${jobTitle(job)}`} onChange={() => void toggle(job)} />
        <Dropdown menu={{ items: [
          { key: 'details', label: t('cron.details'), icon: <EyeOutlined /> },
          { key: 'edit', label: t('common.edit'), icon: <EditOutlined /> },
          ...(compactTable ? [{ key: 'delete', label: t('common.delete'), icon: <DeleteOutlined />, danger: true }] : []),
        ], onClick: ({ key }) => handleMoreAction(key, job) }}>
          <Button type="text" icon={<EllipsisOutlined />} aria-label={`${t('cron.moreActions')} ${jobTitle(job)}`} />
        </Dropdown>
        {!compactTable && <Popconfirm title={t('common.confirmDelete')} onConfirm={() => remove(job)}>
          <Button danger type="text" icon={<DeleteOutlined />} loading={mutating === job.id} aria-label={`${t('common.delete')} ${jobTitle(job)}`} />
        </Popconfirm>}
      </Space>,
    },
  ];

  return (
    <div className="cc-cron-content">
      <PageHeader title={t('cron.title')} description={t('cron.subtitle')} extra={<Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>{t('cron.add')}</Button>} />

      <Card className="cc-cron-toolbar-card" size="small">
        <div className="cc-cron-toolbar">
          <Input allowClear prefix={<SearchOutlined />} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('cron.searchPlaceholder')} aria-label={t('cron.searchPlaceholder')} role="searchbox" />
          <Select allowClear value={projectFilter} onChange={setProjectFilter} placeholder={t('cron.projectFilter')} options={projects.map((project) => ({ label: project.name, value: project.name }))} />
          <Select value={statusFilter} onChange={setStatusFilter} options={(['all', 'enabled', 'disabled', 'error'] as JobStatus[]).map((status) => ({ value: status, label: t(`cron.status_${status}`) }))} />
          <Space wrap className="cc-cron-counts"><Typography.Text type="secondary">{t('cron.totalCount', { count: jobs.length })}</Typography.Text><Badge status="success" text={t('cron.enabledCount', { count: counts.enabled })} />{counts.error > 0 && <Badge status="error" text={t('cron.errorCount', { count: counts.error })} />}</Space>
        </div>
      </Card>

      {loadError && <Alert className="cc-cron-load-error" type="error" title={t('cron.loadFailed')} description={loadError} action={<Button onClick={() => void refresh()}>{t('common.refresh')}</Button>} />}
      {loading && jobs.length === 0 ? <Card><Skeleton active /></Card> : (
        <Card className="cc-cron-table-card" styles={{ body: { padding: 0 } }}>
          <Table<CronJob>
            rowKey="id" columns={columns} dataSource={visibleJobs} loading={loading && jobs.length > 0}
            scroll={{ x: compactTable ? 398 : 1120 }} pagination={{ pageSize: 20, showSizeChanger: !compactTable, showTotal: (total) => t('cron.showTotal', { count: total }) }}
            locale={{ emptyText: <Empty description={jobs.length ? t('cron.noMatches') : t('cron.noJobs')} /> }}
          />
        </Card>
      )}

      <Drawer open={Boolean(detail)} size={560} title={detail ? jobTitle(detail) : ''} onClose={() => setDetail(null)} extra={detail && <Button icon={<EditOutlined />} onClick={() => openEdit(detail)}>{t('common.edit')}</Button>}>
        {detail && <Space orientation="vertical" size={20} style={{ width: '100%' }}>
          <Flex gap={8} wrap><Tag icon={detail.prompt ? <MessageOutlined /> : <CodeOutlined />}>{detail.prompt ? t('cron.prompt') : t('cron.exec')}</Tag><Badge status={detail.last_error ? 'error' : detail.enabled ? 'success' : 'default'} text={detail.last_error ? t('cron.error') : detail.enabled ? t('cron.enabled') : t('cron.disabled')} /></Flex>
          <section><Typography.Title level={5}>{t('cron.taskContent')}</Typography.Title><Typography.Paragraph className={detail.exec ? 'cc-mono cc-cron-code' : 'cc-cron-code'} copyable>{detail.prompt || detail.exec}</Typography.Paragraph></section>
          <section className="cc-cron-detail-grid">
            <div><Typography.Text type="secondary">{t('cron.schedule')}</Typography.Text><strong>{scheduleLabel(detail.cron_expr)}</strong><code>{detail.cron_expr}</code></div>
            <div><Typography.Text type="secondary">{t('cron.project')}</Typography.Text><strong>{detail.project}</strong></div>
            <div className="cc-cron-detail-wide"><Typography.Text type="secondary">{t('cron.sessionKey')}</Typography.Text><code>{detail.session_key}</code></div>
            <div><Typography.Text type="secondary">{t('cron.lastRun')}</Typography.Text><strong>{detail.last_run ? formatTime(detail.last_run) : t('cron.neverRun')}</strong></div>
            <div><Typography.Text type="secondary">{t('cron.notification')}</Typography.Text><strong>{t(`cron.notification_${notificationMode(detail)}`)}</strong></div>
          </section>
          {detail.last_error && <Alert type="error" title={t('cron.lastError')} description={detail.last_error} />}
        </Space>}
      </Drawer>

      <Drawer
        open={formOpen} size={680} title={editing ? t('cron.editJob') : t('cron.add')}
        onClose={() => setFormOpen(false)} destroyOnHidden
        extra={<Space><Button onClick={() => setFormOpen(false)}>{t('common.cancel')}</Button><Button type="primary" loading={saving} disabled={saveDisabled} onClick={() => void save()}>{t('common.save')}</Button></Space>}
      >
        <Form layout="vertical" requiredMark>
          <Typography.Title level={5}>{t('cron.basicInfo')}</Typography.Title>
          <Form.Item label={t('cron.project')} required><Select value={form.project || undefined} options={projects.map((project) => ({ label: project.name, value: project.name }))} onChange={(project) => setForm({ ...form, project, session_key: '' })} /></Form.Item>
          <Form.Item label={t('cron.sessionKey')} required tooltip={t('cron.sessionRequiredHint')}><Select showSearch value={form.session_key || undefined} placeholder={t('cron.selectSessionKeyRequired')} options={sessionKeys.map((key) => ({ label: key, value: key }))} onChange={(session_key) => setForm({ ...form, session_key })} /></Form.Item>
          <Form.Item label={t('cron.description')}><Input value={form.description} placeholder={t('cron.descPlaceholder')} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Form.Item>

          <Typography.Title level={5}>{t('cron.schedule')}</Typography.Title>
          <Form.Item label={t('cron.schedule')} required>
            <Select value={presetValues.has(form.cron_expr) ? form.cron_expr : form.cron_expr ? customCronValue : undefined} options={scheduleOptions} onChange={(value) => setForm({ ...form, cron_expr: value === customCronValue ? '' : value })} />
            {!presetValues.has(form.cron_expr) && <Input className="cc-mono" style={{ marginTop: 8 }} placeholder="0 9 * * 1-5" value={form.cron_expr} onChange={(event) => setForm({ ...form, cron_expr: event.target.value })} />}
          </Form.Item>

          <Typography.Title level={5}>{t('cron.taskContent')}</Typography.Title>
          <Form.Item label={t('cron.taskType')}><Segmented block value={form.type} options={[{ label: t('cron.prompt'), value: 'prompt', icon: <MessageOutlined /> }, { label: t('cron.exec'), value: 'exec', icon: <CodeOutlined /> }]} onChange={(type) => setForm({ ...form, type: type as JobForm['type'] })} /></Form.Item>
          {form.type === 'prompt' ? <Form.Item label={t('cron.prompt')} required><Input.TextArea rows={6} value={form.prompt} placeholder={t('cron.promptPlaceholder')} onChange={(event) => setForm({ ...form, prompt: event.target.value })} /></Form.Item> : <><Form.Item label={t('cron.exec')} required><Input.TextArea rows={4} className="cc-mono" value={form.exec} placeholder="pnpm run report" onChange={(event) => setForm({ ...form, exec: event.target.value })} /></Form.Item><Form.Item label={t('cron.workDir')}><Input className="cc-mono" value={form.work_dir} onChange={(event) => setForm({ ...form, work_dir: event.target.value })} /></Form.Item></>}

          <Collapse ghost items={[{ key: 'advanced', label: t('cron.advanced'), children: <>
            <Form.Item label={t('cron.sessionMode')}><Select value={form.session_mode} options={[{ value: '', label: t('cron.reuseSession') }, { value: 'new_per_run', label: t('cron.newSessionPerRun') }]} onChange={(session_mode) => setForm({ ...form, session_mode })} /></Form.Item>
            <Form.Item label={t('cron.mode')}><Select value={form.mode} options={[{ value: '', label: t('cron.modeDefault') }, ...modeOptions.map((mode) => ({ label: mode, value: mode }))]} onChange={(mode) => setForm({ ...form, mode })} /></Form.Item>
            <Form.Item label={t('cron.timeout')} tooltip={t('cron.timeoutHint')}><Space.Compact><InputNumber min={0} precision={0} value={form.timeout_mins} placeholder="30" onChange={(value) => setForm({ ...form, timeout_mins: value ?? undefined })} /><Button disabled>{t('cron.minutes')}</Button></Space.Compact></Form.Item>
            <Form.Item label={t('cron.notification')}><Select value={form.notification} options={(['inherit', 'all', 'result', 'none'] as NotificationMode[]).map((value) => ({ value, label: t(`cron.notification_${value}`), disabled: !editing && value === 'none' }))} onChange={(notification) => setForm({ ...form, notification })} /></Form.Item>
          </> }]} />
        </Form>
      </Drawer>
    </div>
  );
}
