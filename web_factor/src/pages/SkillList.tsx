import { ExportOutlined, FolderOpenOutlined, ReloadOutlined, StarFilled, ToolOutlined } from '@ant-design/icons';
import { Avatar, Button, Card, Empty, Flex, List, Skeleton, Space, Tabs, Tag, Typography } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchSkillPresets, listSkills, type ProjectSkills, type SkillPreset } from '@/api/skills';
import PageHeader from '@factor/components/PageHeader';

export default function SkillList() {
  const { t, i18n } = useTranslation();
  const [projects, setProjects] = useState<ProjectSkills[]>([]);
  const [presets, setPresets] = useState<SkillPreset[]>([]);
  const [activeProject, setActiveProject] = useState('');
  const [loading, setLoading] = useState(true);
  const [presetsLoading, setPresetsLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listSkills();
      const next = response.projects || [];
      setProjects(next);
      setActiveProject((current) => current && next.some((project) => project.project === current) ? current : next[0]?.project || '');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshPresets = useCallback(async () => {
    setPresetsLoading(true);
    try {
      const response = await fetchSkillPresets();
      setPresets(response.skills || []);
    } finally {
      setPresetsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const handler = () => void refresh();
    window.addEventListener('cc:refresh', handler);
    return () => window.removeEventListener('cc:refresh', handler);
  }, [refresh]);

  const currentProject = useMemo(() => projects.find((project) => project.project === activeProject), [activeProject, projects]);

  return (
    <div>
      <PageHeader title={t('skills.title')} description={t('skills.subtitle')} />
      <Tabs
        onChange={(key) => {
          if (key === 'recommended' && presets.length === 0) void refreshPresets();
        }}
        items={[
          {
            key: 'local',
            label: t('skills.tab.local'),
            children: loading ? <Card><Skeleton active /></Card> : projects.length === 0
              ? <Card className="cc-empty-card"><Empty description={t('skills.noSkills')} /></Card>
              : (
                <Flex gap="large" align="flex-start" wrap>
                  <Card className="cc-surface-card" style={{ width: 250, flex: '0 0 250px' }} title={t('skills.projects')}>
                    <List
                      dataSource={projects}
                      renderItem={(project) => (
                        <List.Item
                          onClick={() => setActiveProject(project.project)}
                          style={{ cursor: 'pointer', background: activeProject === project.project ? 'var(--cc-color-primary-bg)' : undefined, borderRadius: 10, paddingInline: 10 }}
                        >
                          <List.Item.Meta
                            avatar={<Avatar size="small" icon={<FolderOpenOutlined />} className="cc-platform-avatar" />}
                            title={project.project}
                            description={project.agent_type}
                          />
                          <Tag>{project.skills?.length || 0}</Tag>
                        </List.Item>
                      )}
                    />
                  </Card>
                  <div style={{ flex: '1 1 520px', minWidth: 0 }}>
                    {currentProject && (
                      <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
                        <Flex align="center" gap={8} wrap>
                          <Typography.Title level={4} style={{ margin: 0 }}>{currentProject.project}</Typography.Title>
                          <Tag color="blue">{currentProject.agent_type}</Tag>
                          <Typography.Text type="secondary">{t('skills.skillCount', { count: currentProject.skills?.length || 0 })}</Typography.Text>
                        </Flex>
                        {currentProject.dirs?.length > 0 && (
                          <div className="cc-muted-block">
                            <Typography.Text type="secondary">{t('skills.scanDirs')}</Typography.Text>
                            {currentProject.dirs.map((directory) => <div key={directory} className="cc-mono">{directory}</div>)}
                          </div>
                        )}
                        {currentProject.skills?.length ? (
                          <List
                            grid={{ gutter: 12, xs: 1, md: 2 }}
                            dataSource={currentProject.skills}
                            renderItem={(skill) => (
                              <List.Item>
                                <Card className="cc-surface-card">
                                  <Card.Meta
                                    avatar={<Avatar icon={<ToolOutlined />} className="cc-platform-avatar" />}
                                    title={skill.display_name || skill.name}
                                    description={skill.description}
                                  />
                                  <Typography.Text type="secondary" className="cc-mono" ellipsis style={{ display: 'block', marginTop: 12 }}>{skill.source}</Typography.Text>
                                </Card>
                              </List.Item>
                            )}
                          />
                        ) : <Card className="cc-empty-card"><Empty description={t('skills.emptyProject')} /></Card>}
                      </Space>
                    )}
                  </div>
                </Flex>
              ),
          },
          {
            key: 'recommended',
            label: t('skills.tab.recommended'),
            children: presetsLoading ? <Card><Skeleton active /></Card> : presets.length === 0
              ? <Card className="cc-empty-card"><Empty description={t('skills.noPresets')}><Button icon={<ReloadOutlined />} onClick={() => void refreshPresets()}>{t('common.refresh')}</Button></Empty></Card>
              : (
                <div className="cc-page-grid">
                  {presets.map((skill) => (
                    <Card
                      key={skill.name}
                      className="cc-surface-card"
                      title={<Space>{skill.featured && <StarFilled style={{ color: '#e8a317' }} />}{skill.display_name || skill.name}{skill.version && <Tag>{skill.version}</Tag>}</Space>}
                      extra={<PricingTag skill={skill} />}
                      actions={skill.url ? [<Button key="download" type="link" href={skill.url} target="_blank" icon={<ExportOutlined />}>{t('skills.download')}</Button>] : undefined}
                    >
                      <Typography.Paragraph type="secondary" ellipsis={{ rows: 3 }}>
                        {i18n.language.startsWith('zh') && skill.description_zh ? skill.description_zh : skill.description}
                      </Typography.Paragraph>
                      <Flex wrap gap={6}>{skill.tags?.map((tag) => <Tag color="green" key={tag}>{tag}</Tag>)}</Flex>
                      <Space orientation="vertical" size={2} style={{ marginTop: 14 }}>
                        {skill.source && <Typography.Text type="secondary">{t('skills.source')}: {skill.source.name || skill.source.provider}</Typography.Text>}
                        {skill.author && <Typography.Text type="secondary">{t('skills.author')}: {skill.author}</Typography.Text>}
                      </Space>
                    </Card>
                  ))}
                </div>
              ),
          },
        ]}
      />
    </div>
  );
}

function PricingTag({ skill }: { skill: SkillPreset }) {
  const { t } = useTranslation();
  if (!skill.pricing) return null;
  if (skill.pricing.type === 'free') return <Tag color="green">{t('skills.free')}</Tag>;
  if (skill.pricing.type === 'freemium') return <Tag color="blue">{t('skills.freemium')}</Tag>;
  const symbol = skill.pricing.currency === 'CNY' ? '¥' : skill.pricing.currency === 'EUR' ? '€' : '$';
  return <Tag color="gold">{symbol}{skill.pricing.price || 0}</Tag>;
}
