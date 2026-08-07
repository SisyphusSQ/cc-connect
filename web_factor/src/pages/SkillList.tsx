import {
  ExportOutlined,
  FolderOpenOutlined,
  ReloadOutlined,
  SearchOutlined,
  StarFilled,
  ToolOutlined,
} from '@ant-design/icons';
import {
  Alert,
  App,
  Avatar,
  Button,
  Card,
  Collapse,
  Drawer,
  Empty,
  Flex,
  Input,
  Select,
  Skeleton,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  type TableProps,
} from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  fetchSkillPresets,
  listSkills,
  type ProjectSkills,
  type SkillInfo,
  type SkillPreset,
} from '@/api/skills';
import PageHeader from '@factor/components/PageHeader';

const PAGE_SIZE = 20;
const ALL_SOURCES = 'all';

export default function SkillList() {
  const { t, i18n } = useTranslation();
  const { message } = App.useApp();
  const [projects, setProjects] = useState<ProjectSkills[]>([]);
  const [presets, setPresets] = useState<SkillPreset[]>([]);
  const [activeProject, setActiveProject] = useState('');
  const [query, setQuery] = useState('');
  const [sourceDirectory, setSourceDirectory] = useState(ALL_SOURCES);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [selectedSkill, setSelectedSkill] = useState<SkillInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [presetsLoading, setPresetsLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [presetsLoadFailed, setPresetsLoadFailed] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadFailed(false);
    try {
      const response = await listSkills();
      const next = response.projects || [];
      setProjects(next);
      setActiveProject((current) => current && next.some((project) => project.project === current)
        ? current
        : next[0]?.project || '');
    } catch {
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshPresets = useCallback(async () => {
    setPresetsLoading(true);
    setPresetsLoadFailed(false);
    try {
      const response = await fetchSkillPresets();
      setPresets(response.skills || []);
    } catch {
      setPresetsLoadFailed(true);
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

  const currentProject = useMemo(
    () => projects.find((project) => project.project === activeProject),
    [activeProject, projects],
  );

  const filteredSkills = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return (currentProject?.skills || []).filter((skill) => {
      const matchesSource = sourceDirectory === ALL_SOURCES || skill.source.startsWith(sourceDirectory);
      if (!matchesSource || !normalizedQuery) return matchesSource;
      return [skill.name, skill.display_name, skill.description, skill.source]
        .filter(Boolean)
        .some((value) => value!.toLocaleLowerCase().includes(normalizedQuery));
    });
  }, [currentProject, query, sourceDirectory]);

  const selectProject = (project: string) => {
    setActiveProject(project);
    setSourceDirectory(ALL_SOURCES);
    setPage(1);
  };

  const columns: TableProps<SkillInfo>['columns'] = [
    {
      title: t('skills.skill'),
      key: 'skill',
      render: (_, skill) => (
        <Flex align="center" gap={12} className="cc-skill-name">
          <Avatar size="small" icon={<ToolOutlined />} className="cc-platform-avatar" />
          <div>
            <Typography.Text strong>{skill.display_name || skill.name}</Typography.Text>
            {skill.display_name && skill.display_name !== skill.name && (
              <Typography.Text type="secondary" className="cc-mono">{skill.name}</Typography.Text>
            )}
          </div>
        </Flex>
      ),
    },
    {
      title: t('skills.description'),
      dataIndex: 'description',
      key: 'description',
      responsive: ['md'],
      render: (description?: string) => (
        <Typography.Paragraph type="secondary" ellipsis={{ rows: 2 }} className="cc-skill-description">
          {description || '—'}
        </Typography.Paragraph>
      ),
    },
    {
      title: t('skills.source'),
      dataIndex: 'source',
      key: 'source',
      responsive: ['lg'],
      width: '32%',
      render: (source: string) => (
        <Typography.Text type="secondary" className="cc-mono cc-skill-source" ellipsis={{ tooltip: source }}>
          {source}
        </Typography.Text>
      ),
    },
    {
      title: t('skills.action'),
      key: 'action',
      align: 'right',
      width: 92,
      render: (_, skill) => <Button type="link" onClick={() => setSelectedSkill(skill)}>{t('skills.details')}</Button>,
    },
  ];

  const localContent = loading ? <Card><Skeleton active /></Card> : loadFailed ? (
    <Alert
      showIcon
      type="error"
      title={t('skills.loadFailed')}
      action={<Button icon={<ReloadOutlined />} onClick={() => void refresh()}>{t('common.retry')}</Button>}
    />
  ) : projects.length === 0 ? (
    <Card className="cc-empty-card"><Empty description={t('skills.noSkills')} /></Card>
  ) : currentProject ? (
    <Space orientation="vertical" size="middle" className="cc-skills-content">
      <div className="cc-skills-toolbar">
        <Select
          aria-label={t('skills.projectFilter')}
          className="cc-skills-project-select"
          value={activeProject}
          onChange={selectProject}
          options={projects.map((project) => ({
            value: project.project,
            label: `${project.project} · ${project.agent_type} · ${project.skills?.length || 0}`,
          }))}
        />
        <Input
          allowClear
          aria-label={t('skills.searchPlaceholder')}
          className="cc-skills-search"
          prefix={<SearchOutlined />}
          placeholder={t('skills.searchPlaceholder')}
          role="searchbox"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
        />
        <Select
          aria-label={t('skills.sourceFilter')}
          className="cc-skills-source-select"
          value={sourceDirectory}
          onChange={(value) => {
            setSourceDirectory(value);
            setPage(1);
          }}
          options={[
            { value: ALL_SOURCES, label: t('skills.allSources') },
            ...(currentProject.dirs || []).map((directory) => ({ value: directory, label: directory })),
          ]}
        />
      </div>

      <Flex align="center" justify="space-between" gap={12} wrap>
        <Flex align="center" gap={8} wrap>
          <Typography.Title level={4} style={{ margin: 0 }}>{currentProject.project}</Typography.Title>
          <Tag color="blue">{currentProject.agent_type}</Tag>
          <Typography.Text type="secondary">
            {t('skills.filteredSkillCount', { count: filteredSkills.length, total: currentProject.skills?.length || 0 })}
          </Typography.Text>
        </Flex>
      </Flex>

      {(currentProject.dirs || []).length > 0 && (
        <Collapse
          className="cc-scan-dirs"
          size="small"
          items={[{
            key: 'directories',
            label: t('skills.scanDirCount', { count: currentProject.dirs.length }),
            children: (
              <Space orientation="vertical" size={6}>
                {currentProject.dirs.map((directory) => (
                  <Typography.Text key={directory} className="cc-mono" copyable={{ text: directory }}>
                    {directory}
                  </Typography.Text>
                ))}
              </Space>
            ),
          }]}
        />
      )}

      <Card className="cc-surface-card cc-skills-table-card" styles={{ body: { padding: 0 } }}>
        <Table<SkillInfo>
          columns={columns}
          dataSource={filteredSkills}
          rowKey={(skill) => `${skill.source}:${skill.name}`}
          size="medium"
          tableLayout="fixed"
          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('skills.noMatches')} /> }}
          pagination={{
            current: page,
            pageSize,
            pageSizeOptions: [20, 50],
            showSizeChanger: true,
            showTotal: (total) => t('skills.showTotal', { count: total }),
            style: { marginInline: 16 },
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPage);
              setPageSize(nextPageSize);
            },
          }}
        />
      </Card>
    </Space>
  ) : null;

  const recommendedContent = presetsLoading ? <Card><Skeleton active /></Card> : presetsLoadFailed ? (
    <Alert
      showIcon
      type="error"
      title={t('skills.presetsLoadFailed')}
      action={<Button icon={<ReloadOutlined />} onClick={() => void refreshPresets()}>{t('common.retry')}</Button>}
    />
  ) : presets.length === 0 ? (
    <Card className="cc-empty-card">
      <Empty description={t('skills.noPresets')}>
        <Button icon={<ReloadOutlined />} onClick={() => void refreshPresets()}>{t('common.refresh')}</Button>
      </Empty>
    </Card>
  ) : (
    <div className="cc-skill-preset-grid">
      {presets.map((skill) => (
        <Card
          key={skill.name}
          className="cc-surface-card cc-skill-preset-card"
          title={(
            <Space size={8} wrap>
              {skill.featured && <StarFilled style={{ color: 'var(--cc-color-warning)' }} />}
              <span>{skill.display_name || skill.name}</span>
              {skill.version && <Tag>{skill.version}</Tag>}
            </Space>
          )}
          extra={<PricingTag skill={skill} />}
        >
          <Typography.Paragraph type="secondary" ellipsis={{ rows: 3 }} className="cc-skill-preset-description">
            {i18n.language.startsWith('zh') && skill.description_zh ? skill.description_zh : skill.description}
          </Typography.Paragraph>
          <Flex wrap gap={6}>{skill.tags?.map((tag) => <Tag color="blue" key={tag}>{tag}</Tag>)}</Flex>
          <Space orientation="vertical" size={2} className="cc-skill-preset-meta">
            {skill.source && <Typography.Text type="secondary">{t('skills.source')}: {skill.source.name || skill.source.provider}</Typography.Text>}
            {skill.author && <Typography.Text type="secondary">{t('skills.author')}: {skill.author}</Typography.Text>}
          </Space>
          {skill.url && (
            <Button href={skill.url} target="_blank" icon={<ExportOutlined />} className="cc-skill-preset-action">
              {t('skills.viewSource')}
            </Button>
          )}
        </Card>
      ))}
    </div>
  );

  return (
    <div>
      <PageHeader title={t('skills.title')} description={t('skills.subtitle')} />
      <Tabs
        onChange={(key) => {
          if (key === 'recommended' && presets.length === 0 && !presetsLoading) void refreshPresets();
        }}
        items={[
          { key: 'local', label: t('skills.tab.local'), children: localContent },
          { key: 'recommended', label: t('skills.tab.recommended'), children: recommendedContent },
        ]}
      />
      <Drawer
        open={Boolean(selectedSkill)}
        onClose={() => setSelectedSkill(null)}
        title={t('skills.skillDetails')}
        size="large"
        extra={selectedSkill && (
          <Button
            onClick={async () => {
              await navigator.clipboard.writeText(selectedSkill.source);
              void message.success(t('common.copied'));
            }}
          >
            {t('skills.copySource')}
          </Button>
        )}
      >
        {selectedSkill && (
          <Space orientation="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Typography.Title level={4}>{selectedSkill.display_name || selectedSkill.name}</Typography.Title>
              {selectedSkill.display_name && selectedSkill.display_name !== selectedSkill.name && (
                <Typography.Text type="secondary" className="cc-mono">{selectedSkill.name}</Typography.Text>
              )}
            </div>
            <div>
              <Typography.Text type="secondary">{t('skills.description')}</Typography.Text>
              <Typography.Paragraph>{selectedSkill.description || '—'}</Typography.Paragraph>
            </div>
            <div>
              <Typography.Text type="secondary">{t('skills.source')}</Typography.Text>
              <Typography.Paragraph className="cc-mono cc-skill-detail-source">{selectedSkill.source}</Typography.Paragraph>
            </div>
          </Space>
        )}
      </Drawer>
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
