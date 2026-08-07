import {
  ArrowRightOutlined,
  ClockCircleOutlined,
  CodeOutlined,
  FolderOpenOutlined,
  MessageOutlined,
  ProjectOutlined,
} from '@ant-design/icons';
import { Alert, Avatar, Badge, Button, Card, Empty, Skeleton, Space, Table, Tag, Typography } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getStatus, type SystemStatus } from '@/api/status';
import { listProjects, type ProjectSummary } from '@/api/projects';
import { listSessions, type Session } from '@/api/sessions';
import { formatTime, formatUptime } from '@/lib/utils';
import PageHeader from '@factor/components/PageHeader';

const MAX_ITEMS = 4;

export default function Dashboard() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [recentSessions, setRecentSessions] = useState<(Session & { project: string })[]>([]);
  const [sessionLoadFailures, setSessionLoadFailures] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    setSessionLoadFailures([]);
    try {
      const [nextStatus, projectResponse] = await Promise.all([getStatus(), listProjects()]);
      const nextProjects = projectResponse.projects || [];
      setStatus(nextStatus);
      setProjects(nextProjects);

      const responses = await Promise.allSettled(
        nextProjects.map((project) => listSessions(project.name)
          .then((response) => ({ project: project.name, sessions: response.sessions || [] }))),
      );
      const sessions = responses.flatMap((response) => response.status === 'fulfilled'
        ? response.value.sessions.map((session) => ({ ...session, project: response.value.project }))
        : []);
      setSessionLoadFailures(responses.flatMap((response, index) => response.status === 'rejected' ? [nextProjects[index].name] : []));
      sessions.sort((left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime());
      setRecentSessions(sessions.slice(0, MAX_ITEMS));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
    const handler = () => void fetchData();
    window.addEventListener('cc:refresh', handler);
    return () => window.removeEventListener('cc:refresh', handler);
  }, [fetchData]);

  return (
    <div>
      <PageHeader
        title={t('nav.dashboard')}
        description={t('dashboard.subtitle', 'System health, projects and recent conversations at a glance.')}
      />

      {error && <Alert type="error" showIcon title={error} style={{ marginBottom: 18 }} />}
      {sessionLoadFailures.length > 0 && (
        <Alert
          className="cc-dashboard-load-warning"
          type="warning"
          showIcon
          title={t('sessions.partialLoad', { projects: sessionLoadFailures.join(', ') })}
        />
      )}

      <Card className="cc-dashboard-status-strip">
        {[
          { title: t('dashboard.version'), value: status?.version || '-', icon: <CodeOutlined /> },
          { title: t('dashboard.uptime'), value: status ? formatUptime(status.uptime_seconds) : '-', icon: <ClockCircleOutlined /> },
          { title: t('dashboard.platforms'), value: status?.connected_platforms?.length ?? 0, icon: <ProjectOutlined /> },
          { title: t('dashboard.projects'), value: status?.projects_count ?? 0, icon: <FolderOpenOutlined /> },
        ].map((item, index) => (
          <div className="cc-dashboard-status-item" key={String(item.title)}>
            <span className="cc-dashboard-status-icon">{item.icon}</span>
            <span>
              <Typography.Text type="secondary">{item.title}</Typography.Text>
              <Typography.Text strong>{loading && !status ? '—' : item.value}</Typography.Text>
            </span>
            {index === 0 && <Badge status={status ? 'success' : 'default'} />}
          </div>
        ))}
      </Card>

      <div className="cc-dashboard-workspace">
        <Card
          className="cc-surface-card cc-dashboard-sessions"
          title={<Space><MessageOutlined />{t('dashboard.recentSessions')}</Space>}
          extra={<Link to="/sessions"><Button type="link" icon={<ArrowRightOutlined />} iconPlacement="end">{t('common.viewAll')}</Button></Link>}
        >
          {recentSessions.length === 0 ? <Empty description={t('sessions.noSessions')} /> : (
            <Table
              aria-label={t('dashboard.recentSessions')}
              rowKey={(session) => `${session.project}-${session.id}`}
              dataSource={recentSessions}
              pagination={false}
              size="middle"
              columns={[
                { title: t('sessions.title'), key: 'session', render: (_, session) => (
                  <Link to={`/sessions/${encodeURIComponent(session.project)}/${encodeURIComponent(session.id)}`}>
                    <Space><Avatar size="small" icon={<MessageOutlined />} className="cc-platform-avatar" /><Typography.Text strong>{session.name || session.id}</Typography.Text></Space>
                  </Link>
                ) },
                { title: t('projects.title'), dataIndex: 'project', key: 'project', responsive: ['sm'], render: (project: string) => <Tag>{project}</Tag> },
                { title: t('heartbeat.status'), key: 'status', render: (_, session) => <Badge status={session.active ? 'processing' : 'default'} text={session.active ? t('factor.active') : t('factor.idle')} /> },
                { title: t('heartbeat.lastRun'), dataIndex: 'updated_at', key: 'updated', responsive: ['md'], render: (value: string) => formatTime(value) },
              ]}
            />
          )}
        </Card>

        <Card
          className="cc-surface-card cc-dashboard-projects"
          title={<Space><FolderOpenOutlined />{t('nav.projects')}</Space>}
          extra={<Link to="/projects"><Button type="link" icon={<ArrowRightOutlined />} iconPlacement="end">{t('common.viewAll')}</Button></Link>}
        >
          {loading && projects.length === 0 ? <Skeleton active /> : projects.length === 0 ? <Empty description={t('projects.noProjects')} /> : (
            <Space orientation="vertical" size={0} style={{ width: '100%' }}>
              {projects.slice(0, MAX_ITEMS).map((project) => (
                <Link className="cc-dashboard-project-row" key={project.name} to={`/projects/${encodeURIComponent(project.name)}`}>
                  <span><Typography.Text strong>{project.name}</Typography.Text><Typography.Text type="secondary">{project.agent_type}</Typography.Text></span>
                  <span><Tag variant="filled">{t('factor.sessionCount', { count: project.sessions_count })}</Tag><ArrowRightOutlined /></span>
                </Link>
              ))}
            </Space>
          )}
        </Card>
      </div>
    </div>
  );
}
