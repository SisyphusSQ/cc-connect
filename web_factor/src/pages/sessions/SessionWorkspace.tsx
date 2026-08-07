import {
  ArrowLeftOutlined,
  DownOutlined,
  MessageOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Avatar,
  Button,
  Dropdown,
  Empty,
  Input,
  Modal,
  Select,
  Skeleton,
  Space,
  Tag,
  Typography,
} from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { listProjects, type ProjectSummary } from '@/api/projects';
import { listSessions } from '@/api/sessions';
import type { BridgeStatus } from '@/hooks/useBridgeSocket';
import { useAppHeader } from '../../components/AppHeaderContext';
import ChatView from '../chat/ChatView';
import { buildSessionIndex, filterSessionIndex, type IndexedSession, type SessionFilters } from './sessionModel';

function sessionTitle(session: IndexedSession) {
  return session.name || session.user_name || session.chat_name || session.id.slice(0, 8);
}

function formatRelativeTime(iso: string, language: string) {
  if (!iso) return '';
  const elapsedMinutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  const formatter = new Intl.RelativeTimeFormat(language, { numeric: 'auto' });
  if (elapsedMinutes < 1) return formatter.format(0, 'minute');
  if (elapsedMinutes < 60) return formatter.format(-elapsedMinutes, 'minute');
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return formatter.format(-elapsedHours, 'hour');
  return formatter.format(-Math.floor(elapsedHours / 24), 'day');
}

const initialFilters: SessionFilters = { query: '', project: '', platform: '', status: 'all' };

export default function SessionWorkspace() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { name: projectName = '', sessionId = '' } = useParams<{ name: string; sessionId: string }>();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [sessions, setSessions] = useState<IndexedSession[]>([]);
  const [filters, setFilters] = useState<SessionFilters>(initialFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [failedProjects, setFailedProjects] = useState<string[]>([]);
  const [newSessionOpen, setNewSessionOpen] = useState(false);
  const [newSessionProject, setNewSessionProject] = useState('');
  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus>('disconnected');
  const [newSessionRequest, setNewSessionRequest] = useState(0);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await listProjects();
      const nextProjects = response.projects || [];
      setProjects(nextProjects);
      const results = await Promise.allSettled(
        nextProjects.map(async (project) => ({
          project: project.name,
          sessions: (await listSessions(project.name)).sessions || [],
        })),
      );
      const loaded = results.flatMap((result) => result.status === 'fulfilled' ? [result.value] : []);
      setFailedProjects(results.flatMap((result, index) => result.status === 'rejected' ? [nextProjects[index].name] : []));
      setSessions(buildSessionIndex(loaded));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
      setProjects([]);
      setSessions([]);
      setFailedProjects([]);
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

  const visibleSessions = useMemo(() => filterSessionIndex(sessions, filters), [filters, sessions]);
  const platforms = useMemo(() => [...new Set(sessions.map(({ platform }) => platform).filter(Boolean))].sort(), [sessions]);
  const hasSelection = Boolean(projectName);
  const selectedSession = useMemo(
    () => sessions.find((session) => session.project === projectName && session.id === sessionId),
    [projectName, sessionId, sessions],
  );

  const header = useMemo(() => ({
    id: 'sessions',
    immersive: true,
    leading: hasSelection ? (
      <Button
        type="text"
        className="cc-session-header-back"
        icon={<ArrowLeftOutlined />}
        aria-label={t('common.back', 'Back')}
        onClick={() => navigate('/sessions')}
      />
    ) : undefined,
    title: t('sessions.title'),
    subtitle: t('sessions.workspaceCount', { count: sessions.length, defaultValue: '{{count}} sessions' }),
    details: hasSelection ? (
      <Space size={8} className="cc-session-header-details">
        <Typography.Text strong ellipsis>{projectName}</Typography.Text>
        <Typography.Text type="secondary">/</Typography.Text>
        <Typography.Text ellipsis>
          {selectedSession ? sessionTitle(selectedSession) : t('chat.defaultSession')}
        </Typography.Text>
        {(selectedSession?.platform || 'web') && <Tag color="blue">{selectedSession?.platform || 'web'}</Tag>}
        <Tag color={bridgeStatus === 'connected' ? 'success' : bridgeStatus === 'connecting' || bridgeStatus === 'registering' ? 'processing' : 'default'}>
          {bridgeStatus === 'connected'
            ? t('sessions.bridgeConnected')
            : bridgeStatus === 'connecting' || bridgeStatus === 'registering'
              ? t('sessions.bridgeConnecting')
              : t('sessions.bridgeDisconnected')}
        </Tag>
      </Space>
    ) : undefined,
    actions: hasSelection ? (
      <Space.Compact>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          disabled={bridgeStatus !== 'connected'}
          onClick={() => setNewSessionRequest((current) => current + 1)}
        >
          {t('sessions.newSession')}
        </Button>
        <Dropdown
          menu={{
            items: [{ key: 'other-project', label: t('sessions.startOtherProject') }],
            onClick: () => setNewSessionOpen(true),
          }}
        >
          <Button type="primary" icon={<DownOutlined />} aria-label={t('sessions.startOtherProject')} />
        </Dropdown>
      </Space.Compact>
    ) : (
      <Button type="primary" icon={<PlusOutlined />} onClick={() => setNewSessionOpen(true)}>
        {t('sessions.startWebSession')}
      </Button>
    ),
  }), [bridgeStatus, hasSelection, navigate, projectName, selectedSession, sessions.length, t]);
  useAppHeader(header);

  const openSession = (session: IndexedSession) => {
    navigate(`/sessions/${encodeURIComponent(session.project)}/${encodeURIComponent(session.id)}`);
  };

  const startSession = () => {
    if (!newSessionProject) return;
    setNewSessionOpen(false);
    navigate(`/sessions/${encodeURIComponent(newSessionProject)}`);
  };

  const sidebar = (
    <aside className="cc-session-sidebar" aria-label={t('sessions.workspaceList', 'Session list')}>
      <div className="cc-session-filters">
        <Input
          allowClear
          prefix={<SearchOutlined />}
          value={filters.query}
          placeholder={t('sessions.searchPlaceholder', 'Search sessions')}
          aria-label={t('sessions.searchPlaceholder', 'Search sessions')}
          onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
        />
        <div className="cc-session-filter-row">
          <Select
            className="cc-session-project-filter"
            allowClear
            value={filters.project || undefined}
            placeholder={t('sessions.allProjects')}
            aria-label={t('sessions.projectFilter', 'Filter by project')}
            options={projects.map(({ name }) => ({ label: name, value: name }))}
            onChange={(project = '') => setFilters((current) => ({ ...current, project }))}
          />
          <Select
            allowClear
            value={filters.platform || undefined}
            placeholder={t('sessions.allPlatforms', 'All platforms')}
            aria-label={t('sessions.platformFilter', 'Filter by platform')}
            options={platforms.map((platform) => ({ label: platform, value: platform }))}
            onChange={(platform = '') => setFilters((current) => ({ ...current, platform }))}
          />
          <Select
            value={filters.status}
            aria-label={t('sessions.statusFilter', 'Filter by status')}
            options={[
              { label: t('sessions.allStatuses', 'All statuses'), value: 'all' },
              { label: t('sessions.running', 'Running'), value: 'live' },
              { label: t('sessions.offline'), value: 'idle' },
            ]}
            onChange={(status) => setFilters((current) => ({ ...current, status }))}
          />
        </div>
      </div>

      <div className="cc-session-list" aria-live="polite">
        {error && <Alert type="error" showIcon title={error} />}
        {failedProjects.length > 0 && (
          <Alert
            type="warning"
            showIcon
            title={t('sessions.partialLoad', { projects: failedProjects.join(', '), defaultValue: 'Some projects could not be loaded: {{projects}}' })}
          />
        )}
        {loading && sessions.length === 0 ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : visibleSessions.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('sessions.noSessions')} />
        ) : visibleSessions.map((session) => {
          const selected = session.project === projectName && session.id === sessionId;
          return (
            <button
              key={`${session.project}-${session.id}`}
              type="button"
              className={`cc-session-item${selected ? ' cc-session-item-selected' : ''}`}
              aria-current={selected ? 'page' : undefined}
              onClick={() => openSession(session)}
            >
              <Avatar size={36} icon={<MessageOutlined />} className="cc-session-item-avatar" />
              <span className="cc-session-item-body">
                <span className="cc-session-item-heading">
                  <Typography.Text strong ellipsis>{sessionTitle(session)}</Typography.Text>
                  <Typography.Text type="secondary" className="cc-session-time">
                    {formatRelativeTime(session.updated_at || session.created_at, i18n.language)}
                  </Typography.Text>
                </span>
                <Typography.Text type="secondary" ellipsis className="cc-session-preview">
                  {session.last_message?.content || t('sessions.noMessages')}
                </Typography.Text>
                <Space size={4} wrap>
                  <Tag>{session.project}</Tag>
                  {session.platform && <Tag color="blue">{session.platform}</Tag>}
                  {session.live && <Tag color="success">{t('sessions.running', 'Running')}</Tag>}
                </Space>
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );

  return (
    <div className={`cc-session-workspace${hasSelection ? ' cc-session-workspace-has-selection' : ''}`}>
      {sidebar}
      <main className="cc-session-detail">
        {hasSelection ? (
          <ChatView
            newSessionRequest={newSessionRequest}
            onBridgeStatusChange={setBridgeStatus}
          />
        ) : (
          <div className="cc-session-detail-empty">
            <Empty
              image={<MessageOutlined className="cc-chat-empty-icon" />}
              description={
                <Space orientation="vertical" size={2}>
                  <Typography.Text>{t('sessions.selectHint', 'Select a session to continue')}</Typography.Text>
                  <Typography.Text type="secondary">{t('sessions.selectHintDetail', 'Sessions from every project are available on the left.')}</Typography.Text>
                </Space>
              }
            >
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setNewSessionOpen(true)}>
                {t('sessions.startWebSession')}
              </Button>
            </Empty>
          </div>
        )}
      </main>

      <Modal
        title={t('sessions.startWebSession')}
        open={newSessionOpen}
        okText={t('sessions.continue', 'Continue')}
        okButtonProps={{ disabled: !newSessionProject }}
        onOk={startSession}
        onCancel={() => setNewSessionOpen(false)}
        destroyOnHidden
      >
        <Space orientation="vertical" size={10} style={{ width: '100%' }}>
          <Typography.Text>{t('sessions.chooseProjectHint', 'Choose the project for the new Web session.')}</Typography.Text>
          <Select
            autoFocus
            showSearch
            value={newSessionProject || undefined}
            placeholder={t('sessions.chooseProject', 'Choose a project')}
            aria-label={t('sessions.chooseProject', 'Choose a project')}
            options={projects.map(({ name }) => ({ label: name, value: name }))}
            onChange={setNewSessionProject}
            style={{ width: '100%' }}
          />
        </Space>
      </Modal>
    </div>
  );
}
