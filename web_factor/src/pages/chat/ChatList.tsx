import { FolderOpenOutlined, MessageOutlined, RightOutlined } from '@ant-design/icons';
import { Alert, Avatar, Card, Empty, Flex, Skeleton, Space, Tag, Typography } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { listProjects, type ProjectSummary } from '@/api/projects';
import PageHeader from '@factor/components/PageHeader';

export default function ChatList() {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await listProjects();
      setProjects(response.projects || []);
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

  return (
    <div>
      <PageHeader title={t('chat.title')} description={t('chat.selectProject', 'Choose a project to open its live agent conversation.')} />
      {error && <Alert type="error" showIcon title={error} style={{ marginBottom: 18 }} />}
      {loading && projects.length === 0 ? (
        <Card><Skeleton active /></Card>
      ) : projects.length === 0 ? (
        <Card className="cc-empty-card"><Empty description={t('projects.noProjects')} /></Card>
      ) : (
        <div className="cc-page-grid">
          {projects.map((project) => (
            <Link key={project.name} to={`/chat/${project.name}`} className="cc-card-link">
              <Card hoverable className="cc-surface-card">
                <Flex align="center" gap={14}>
                  <Avatar size={44} icon={<MessageOutlined />} className="cc-platform-avatar" />
                  <Space orientation="vertical" size={2} style={{ minWidth: 0, flex: 1 }}>
                    <Typography.Text strong ellipsis>{project.name}</Typography.Text>
                    <Typography.Text type="secondary"><FolderOpenOutlined /> {project.agent_type}</Typography.Text>
                  </Space>
                  <RightOutlined />
                </Flex>
                <Flex wrap gap={6} style={{ marginTop: 18 }}>
                  {project.platforms?.map((platform) => <Tag key={platform}>{platform}</Tag>)}
                </Flex>
                <Typography.Text type="secondary">{t('factor.sessionCount', { count: project.sessions_count })}</Typography.Text>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
