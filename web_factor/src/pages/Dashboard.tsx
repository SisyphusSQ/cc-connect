import {
  ArrowRightOutlined,
  ClockCircleOutlined,
  CodeOutlined,
  FolderOpenOutlined,
  MessageOutlined,
  ProjectOutlined,
} from '@ant-design/icons';
import { Alert, Avatar, Button, Card, Empty, Flex, Skeleton, Space, Statistic, Tag, Typography } from 'antd';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
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

      <div className="cc-page-grid">
        {[
          { title: t('dashboard.version'), value: status?.version || '-', icon: <CodeOutlined /> },
          { title: t('dashboard.uptime'), value: status ? formatUptime(status.uptime_seconds) : '-', icon: <ClockCircleOutlined /> },
          { title: t('dashboard.platforms'), value: status?.connected_platforms?.length ?? 0, icon: <ProjectOutlined /> },
          { title: t('dashboard.projects'), value: status?.projects_count ?? 0, icon: <FolderOpenOutlined /> },
        ].map((item) => (
          <Card key={String(item.title)} className="cc-stat-card" loading={loading && !status}>
            <Statistic title={item.title} value={item.value} prefix={item.icon} />
          </Card>
        ))}
      </div>

      <section className="cc-section">
        <div className="cc-section-heading">
          <Typography.Title level={4}>{t('nav.projects')}</Typography.Title>
          <Link to="/projects"><Button type="link" icon={<ArrowRightOutlined />} iconPlacement="end">{t('common.viewAll')}</Button></Link>
        </div>
        {loading && projects.length === 0 ? (
          <Card><Skeleton active /></Card>
        ) : projects.length === 0 ? (
          <Card className="cc-empty-card"><Empty description={t('projects.noProjects')} /></Card>
        ) : (
          <div className="cc-page-grid">
            {projects.slice(0, MAX_ITEMS).map((project) => (
              <Link className="cc-card-link" key={project.name} to={`/chat/${project.name}`}>
                <Card className="cc-surface-card" hoverable>
                  <Card.Meta
                    avatar={<Avatar className="cc-platform-avatar" icon={<FolderOpenOutlined />} />}
                    title={project.name}
                    description={project.agent_type}
                  />
                  <Flex wrap gap={6} style={{ marginTop: 18 }}>
                    {project.platforms?.slice(0, 3).map((platform) => <Tag key={platform}>{platform}</Tag>)}
                    {(project.platforms?.length || 0) > 3 && <Tag>+{project.platforms.length - 3}</Tag>}
                  </Flex>
                  <Typography.Text type="secondary">{t('factor.sessionCount', { count: project.sessions_count })}</Typography.Text>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="cc-section">
        <div className="cc-section-heading">
          <Typography.Title level={4}>{t('dashboard.recentSessions')}</Typography.Title>
          <Link to="/chat"><Button type="link" icon={<ArrowRightOutlined />} iconPlacement="end">{t('common.viewAll')}</Button></Link>
        </div>
        {recentSessions.length === 0 ? (
          <Card className="cc-empty-card"><Empty description={t('sessions.noSessions')} /></Card>
        ) : (
          <div className="cc-page-grid">
            {recentSessions.map((session) => (
              <Link className="cc-card-link" key={`${session.project}-${session.id}`} to={`/chat/${session.project}`}>
                <Card className="cc-surface-card" hoverable>
                  <Space orientation="vertical" size={10} style={{ width: '100%' }}>
                    <Flex align="center" gap={10}>
                      <Avatar size="small" icon={<MessageOutlined />} className="cc-platform-avatar" />
                      <Typography.Text strong ellipsis>{session.name || session.id}</Typography.Text>
                      <span style={{ marginInlineStart: 'auto' }}>
                        <Tag color={session.active ? 'green' : 'default'}>{session.active ? t('factor.active') : t('factor.idle')}</Tag>
                      </span>
                    </Flex>
                    <Tag>{session.project}</Tag>
                    {session.last_message && <Typography.Text type="secondary" ellipsis>{session.last_message.content.slice(0, 80)}</Typography.Text>}
                    <Typography.Text type="secondary"><ClockCircleOutlined /> {formatTime(session.updated_at)}</Typography.Text>
                  </Space>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
