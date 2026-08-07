import {
  BulbOutlined,
  CheckCircleOutlined,
  CheckOutlined,
  CloseCircleOutlined,
  CodeOutlined,
  CopyOutlined,
  FileOutlined,
  LoadingOutlined,
  RobotOutlined,
  SendOutlined,
  ThunderboltOutlined,
  ToolOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Alert,
  App,
  Avatar,
  Button,
  Card,
  Collapse,
  Divider,
  Drawer,
  Dropdown,
  Empty,
  Flex,
  Input,
  Select,
  Skeleton,
  Space,
  Spin,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type { MenuProps } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Markdown from 'react-markdown';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import { getSession, listSessions, type SessionDetail } from '@/api/sessions';
import { findDefaultSession, resolveChatSessionKey } from '../sessions/sessionModel';
import {
  fetchBridgeConfig,
  useBridgeSocket,
  type BridgeConfig,
  type BridgeIncoming,
  type BridgeStatus,
} from '@/hooks/useBridgeSocket';

const { Text } = Typography;
const { TextArea } = Input;
const progressPayloadPrefix = '__cc_connect_progress_card_v1__:';

interface SlashCommand {
  cmd: string;
  labelKey: string;
  group: 'session' | 'settings' | 'info' | 'advanced';
}

const slashCommands: SlashCommand[] = [
  { cmd: '/new', labelKey: 'cmd.new', group: 'session' },
  { cmd: '/list', labelKey: 'cmd.list', group: 'session' },
  { cmd: '/switch', labelKey: 'cmd.switch', group: 'session' },
  { cmd: '/current', labelKey: 'cmd.current', group: 'session' },
  { cmd: '/history', labelKey: 'cmd.history', group: 'session' },
  { cmd: '/stop', labelKey: 'cmd.stop', group: 'session' },
  { cmd: '/model', labelKey: 'cmd.model', group: 'settings' },
  { cmd: '/reasoning', labelKey: 'cmd.reasoning', group: 'settings' },
  { cmd: '/mode', labelKey: 'cmd.mode', group: 'settings' },
  { cmd: '/lang', labelKey: 'cmd.lang', group: 'settings' },
  { cmd: '/provider', labelKey: 'cmd.provider', group: 'settings' },
  { cmd: '/status', labelKey: 'cmd.status', group: 'info' },
  { cmd: '/help', labelKey: 'cmd.help', group: 'info' },
  { cmd: '/doctor', labelKey: 'cmd.doctor', group: 'info' },
  { cmd: '/version', labelKey: 'cmd.version', group: 'info' },
  { cmd: '/whoami', labelKey: 'cmd.whoami', group: 'info' },
  { cmd: '/commands', labelKey: 'cmd.commands', group: 'info' },
  { cmd: '/dir', labelKey: 'cmd.dir', group: 'advanced' },
  { cmd: '/cron', labelKey: 'cmd.cron', group: 'advanced' },
  { cmd: '/heartbeat', labelKey: 'cmd.heartbeat', group: 'advanced' },
  { cmd: '/alias', labelKey: 'cmd.alias', group: 'advanced' },
  { cmd: '/config', labelKey: 'cmd.config', group: 'advanced' },
  { cmd: '/skills', labelKey: 'cmd.skills', group: 'advanced' },
  { cmd: '/upgrade', labelKey: 'cmd.upgrade', group: 'advanced' },
  { cmd: '/delete-mode', labelKey: 'cmd.deleteMode', group: 'advanced' },
];

const streamCommands = new Set(['/new', '/stop', '/switch', '/delete-mode', '/upgrade']);
const knownCommands = new Set(slashCommands.map(({ cmd }) => cmd));

type ProgressState = 'running' | 'completed' | 'failed';
type ProgressKind = 'info' | 'thinking' | 'tool_use' | 'tool_result' | 'error';

interface ProgressItem {
  kind: ProgressKind;
  text: string;
  tool?: string;
  status?: string;
  exit_code?: number;
  success?: boolean;
}

interface ProgressPayload {
  agent?: string;
  state: ProgressState;
  items: ProgressItem[];
  truncated?: boolean;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  format?: 'text' | 'markdown' | 'card' | 'buttons' | 'image' | 'file' | 'progress';
  card?: Record<string, any>;
  buttons?: { text: string; data: string }[][];
  imageUrl?: string;
  fileName?: string;
  fileSize?: number;
  streaming?: boolean;
  previewHandle?: string;
  progress?: ProgressPayload;
  timestamp?: string;
}

interface CommandResult {
  command: string;
  content: string;
  format: 'text' | 'markdown' | 'card' | 'buttons';
  card?: Record<string, any>;
  buttons?: { text: string; data: string }[][];
}

function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="cc-markdown">
      <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
        {content}
      </Markdown>
    </div>
  );
}

function redactProgressText(value: string) {
  return value
    .replace(/((?:api[_-]?key|token|password|secret)\s*[:=]\s*)([^\s,;]+)/gi, '$1[REDACTED]')
    .slice(0, 2_000);
}

function parseProgressPayload(content: string): ProgressPayload | null {
  if (!content.startsWith(progressPayloadPrefix)) return null;
  try {
    const value = JSON.parse(content.slice(progressPayloadPrefix.length)) as Partial<ProgressPayload> & { entries?: unknown };
    const items: ProgressItem[] = [];
    if (Array.isArray(value.items)) {
      for (const candidate of value.items) {
        if (!candidate || typeof candidate !== 'object') continue;
        const item = candidate as Partial<ProgressItem>;
        if (typeof item.text !== 'string' || !item.text.trim()) continue;
        const allowedKinds: ProgressKind[] = ['info', 'thinking', 'tool_use', 'tool_result', 'error'];
        items.push({
          kind: allowedKinds.includes(item.kind as ProgressKind) ? item.kind as ProgressKind : 'info',
          text: redactProgressText(item.text.trim()),
          tool: typeof item.tool === 'string' ? item.tool.trim() : undefined,
          status: typeof item.status === 'string' ? item.status.trim() : undefined,
          exit_code: typeof item.exit_code === 'number' ? item.exit_code : undefined,
          success: typeof item.success === 'boolean' ? item.success : undefined,
        });
      }
    }
    if (items.length === 0 && Array.isArray(value.entries)) {
      for (const entry of value.entries) {
        if (typeof entry === 'string' && entry.trim()) {
          items.push({ kind: 'info', text: redactProgressText(entry.trim()) });
        }
      }
    }
    if (items.length === 0) return null;
    const state: ProgressState = value.state === 'completed' || value.state === 'failed' ? value.state : 'running';
    return {
      agent: typeof value.agent === 'string' ? value.agent.trim() : undefined,
      state,
      items,
      truncated: Boolean(value.truncated),
    };
  } catch {
    return null;
  }
}

function ProgressContent({ progress }: { progress: ProgressPayload }) {
  const { t } = useTranslation();
  const [activeKeys, setActiveKeys] = useState<string[]>(progress.state === 'running' ? ['process'] : []);
  const previousState = useRef(progress.state);

  useEffect(() => {
    if (progress.state === 'running') setActiveKeys(['process']);
    else if (previousState.current === 'running') setActiveKeys([]);
    previousState.current = progress.state;
  }, [progress.state]);

  const status = progress.state === 'running'
    ? { icon: <LoadingOutlined spin />, color: 'processing', label: t('sessions.processRunning') }
    : progress.state === 'failed'
      ? { icon: <CloseCircleOutlined />, color: 'error', label: t('sessions.processFailed') }
      : { icon: <CheckCircleOutlined />, color: 'success', label: t('sessions.processCompleted') };

  return (
    <Collapse
      className="cc-progress-collapse"
      ghost
      size="small"
      activeKey={activeKeys}
      onChange={(keys) => setActiveKeys(Array.isArray(keys) ? keys.map(String) : [String(keys)])}
      items={[{
        key: 'process',
        label: (
          <Flex align="center" justify="space-between" gap={12} className="cc-progress-summary">
            <Space size={8}>
              <Text strong>{t('sessions.workProcess')}</Text>
              {progress.agent && <Tag>{progress.agent}</Tag>}
            </Space>
            <Tag icon={status.icon} color={status.color} aria-live="polite">{status.label}</Tag>
          </Flex>
        ),
        children: (
          <div className="cc-progress-timeline">
            {progress.truncated && <Alert type="info" showIcon title={t('sessions.processTruncated')} />}
            {progress.items.map((item, index) => {
              const thinking = item.kind === 'thinking';
              const failed = item.kind === 'error' || item.success === false;
              const label = thinking
                ? t('sessions.thinkingSummary')
                : item.kind === 'tool_use'
                  ? t('sessions.toolCall')
                  : item.kind === 'tool_result'
                    ? t('sessions.toolResult')
                    : t('sessions.processUpdate');
              return (
                <div key={`${item.kind}-${index}`} className={`cc-progress-item cc-progress-item-${item.kind}`}>
                  <span className={`cc-progress-icon${failed ? ' cc-progress-icon-failed' : ''}`}>
                    {thinking ? <BulbOutlined /> : failed ? <CloseCircleOutlined /> : <ToolOutlined />}
                  </span>
                  <div className="cc-progress-item-body">
                    <Space size={6} wrap>
                      <Text strong>{label}</Text>
                      {item.tool && <Tag>{item.tool}</Tag>}
                      {item.status && <Tag color={failed ? 'error' : 'default'}>{item.status}</Tag>}
                      {typeof item.exit_code === 'number' && <Text type="secondary">exit {item.exit_code}</Text>}
                    </Space>
                    <div className="cc-progress-text">{item.text}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ),
      }]}
    />
  );
}

function CardContent({ card, onAction }: { card?: Record<string, any>; onAction: (value: string) => void }) {
  if (!card) return null;
  return (
    <Space orientation="vertical" size={12} style={{ width: '100%' }}>
      {card.header?.title && <Text strong>{card.header.title}</Text>}
      {card.elements?.map((element: any, index: number) => {
        if (element.type === 'markdown') return <MarkdownContent key={index} content={element.content || ''} />;
        if (element.type === 'divider') return <Divider key={index} style={{ margin: 0 }} />;
        if (element.type === 'note') return <Text key={index} type="secondary">{element.text}</Text>;
        if (element.type === 'actions') {
          return (
            <Flex key={index} wrap gap={8}>
              {element.buttons?.map((button: any, buttonIndex: number) => (
                <Button
                  key={buttonIndex}
                  type={button.btn_type === 'primary' ? 'primary' : 'default'}
                  danger={button.btn_type === 'danger'}
                  onClick={() => onAction(button.value)}
                >
                  {button.text}
                </Button>
              ))}
            </Flex>
          );
        }
        if (element.type === 'list_item') {
          return (
            <Button key={index} type="text" block className="cc-card-list-item" onClick={() => onAction(element.btn_value)}>
              <Text ellipsis style={{ flex: 1, textAlign: 'left' }}>{element.text}</Text>
              <Tag color={element.btn_type === 'primary' ? 'success' : 'default'}>{element.btn_text}</Tag>
            </Button>
          );
        }
        if (element.type === 'select') {
          return (
            <Select
              key={index}
              defaultValue={element.init_value}
              options={element.options?.map((option: any) => ({ label: option.text, value: option.value }))}
              onChange={onAction}
              style={{ width: '100%' }}
            />
          );
        }
        return null;
      })}
    </Space>
  );
}

function MessageContent({ message, onAction }: { message: ChatMessage; onAction: (value: string) => void }) {
  const { t } = useTranslation();
  if (message.format === 'progress' && message.progress) return <ProgressContent progress={message.progress} />;
  if (message.format === 'card') return <CardContent card={message.card} onAction={onAction} />;
  if (message.format === 'buttons' && message.buttons) {
    return (
      <Space orientation="vertical" size={12} style={{ width: '100%' }}>
        <MarkdownContent content={message.content} />
        {message.buttons.map((row, index) => (
          <Flex key={index} wrap gap={8}>
            {row.map((button) => <Button key={button.data} type="primary" onClick={() => onAction(button.data)}>{button.text}</Button>)}
          </Flex>
        ))}
      </Space>
    );
  }
  if (message.format === 'image' && message.imageUrl) return <img className="cc-message-image" src={message.imageUrl} alt="" />;
  if (message.format === 'file' && message.fileName) {
    return <Flex align="center" gap={10}><FileOutlined /><Text>{message.fileName}</Text>{message.fileSize && <Text type="secondary">{(message.fileSize / 1024).toFixed(1)} KB</Text>}</Flex>;
  }
  if (!message.content) return <Text type="secondary">{t('factor.unsupportedMessage')}</Text>;
  if (message.role === 'user' || message.format === 'text') return <div className="cc-message-plain">{message.content}</div>;
  return <MarkdownContent content={message.content} />;
}

interface ChatViewProps {
  newSessionRequest?: number;
  onBridgeStatusChange?: (status: BridgeStatus) => void;
}

export default function ChatView({ newSessionRequest = 0, onBridgeStatusChange }: ChatViewProps) {
  const { t } = useTranslation();
  const { message: toast } = App.useApp();
  const { name: projectName, sessionId } = useParams<{ name: string; sessionId: string }>();
  const [currentSession, setCurrentSession] = useState<SessionDetail | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState('');
  const [bridgeConfig, setBridgeConfig] = useState<BridgeConfig | null>(null);
  const [commandResult, setCommandResult] = useState<CommandResult | null>(null);
  const messageList = useRef<HTMLDivElement>(null);
  const sessionKeyRef = useRef('');
  const previewCounter = useRef(0);
  const pendingCommand = useRef<string | null>(null);
  const commandPanel = useRef<string | null>(null);
  const previewAck = useRef<(refId: string, handle: string) => void>(() => undefined);

  const defaultSessionKey = projectName ? `bridge:web-admin:${projectName}` : '';
  const sessionKey = resolveChatSessionKey(defaultSessionKey, currentSession);
  sessionKeyRef.current = sessionKey;
  commandPanel.current = commandResult?.command || null;

  const hydrateHistory = useCallback((detail: SessionDetail) => {
    setCurrentSession(detail);
    setMessages((detail.history || []).map((entry, index) => ({
      id: `history-${index}`,
      role: entry.role === 'user' ? 'user' : 'assistant',
      content: entry.content,
      format: 'markdown',
      timestamp: entry.timestamp,
    })));
  }, []);

  const refresh = useCallback(async () => {
    if (!projectName) return;
    setLoading(true);
    setError('');
    setCurrentSession(null);
    setMessages([]);
    try {
      const detailRequest = sessionId
        ? getSession(projectName, sessionId, 200)
        : listSessions(projectName).then(({ sessions }) => {
          const defaultSession = findDefaultSession(sessions || [], defaultSessionKey);
          return defaultSession ? getSession(projectName, defaultSession.id, 200) : null;
        });
      const [config, detail] = await Promise.all([
        fetchBridgeConfig(),
        detailRequest,
      ]);
      setBridgeConfig(config);
      if (detail) hydrateHistory(detail);
      else {
        setCurrentSession(null);
        setMessages([]);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setLoading(false);
    }
  }, [defaultSessionKey, hydrateHistory, projectName, sessionId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const handleBridgeMessage = useCallback((incoming: BridgeIncoming) => {
    const incomingSession = (incoming as any).session_key;
    if (incomingSession && sessionKeyRef.current && incomingSession !== sessionKeyRef.current) return;

    const pending = pendingCommand.current;
    if (pending && ['reply', 'card', 'buttons'].includes(incoming.type)) {
      pendingCommand.current = null;
      if (incoming.type === 'card') setCommandResult({ command: pending, content: '', format: 'card', card: incoming.card });
      else if (incoming.type === 'buttons') setCommandResult({ command: pending, content: incoming.content, format: 'buttons', buttons: incoming.buttons });
      else setCommandResult({ command: pending, content: (incoming as any).content, format: 'markdown' });
      setTyping(false);
      return;
    }

    if (incoming.type === 'reply') {
      setMessages((previous) => {
        const index = previous.findIndex(({ streaming, role, format }) => streaming && role === 'assistant' && format !== 'progress');
        if (index < 0) return [...previous, { id: `reply-${Date.now()}`, role: 'assistant', content: incoming.content, format: incoming.format === 'markdown' ? 'markdown' : 'text' }];
        const next = [...previous];
        next[index] = { ...next[index], content: incoming.content, format: incoming.format === 'markdown' ? 'markdown' : 'text', streaming: false };
        return next;
      });
      setTyping(false);
    } else if (incoming.type === 'reply_stream') {
      setMessages((previous) => {
        const index = previous.findIndex(({ streaming, format }) => streaming && format !== 'progress');
        if (index < 0) return [...previous, { id: `stream-${Date.now()}`, role: 'assistant', content: incoming.full_text, format: 'markdown', streaming: !incoming.done }];
        const next = [...previous];
        next[index] = { ...next[index], content: incoming.full_text, streaming: !incoming.done };
        return next;
      });
      if (incoming.done) setTyping(false);
    } else if (incoming.type === 'card') {
      setMessages((previous) => [...previous, { id: `card-${Date.now()}`, role: 'assistant', content: '', format: 'card', card: incoming.card }]);
      setTyping(false);
    } else if (incoming.type === 'buttons') {
      setMessages((previous) => [...previous, { id: `buttons-${Date.now()}`, role: 'assistant', content: incoming.content, format: 'buttons', buttons: incoming.buttons }]);
      setTyping(false);
    } else if (incoming.type === 'typing_start') setTyping(true);
    else if (incoming.type === 'typing_stop') setTyping(false);
    else if (incoming.type === 'preview_start') {
      const handle = `web-factor-preview-${++previewCounter.current}`;
      previewAck.current(incoming.ref_id, handle);
      const progress = parseProgressPayload(incoming.content);
      setMessages((previous) => [...previous, {
        id: `preview-${handle}`,
        role: 'assistant',
        content: progress ? '' : incoming.content,
        format: progress ? 'progress' : 'markdown',
        progress: progress || undefined,
        previewHandle: handle,
        streaming: progress ? progress.state === 'running' : true,
      }]);
    } else if (incoming.type === 'update_message') {
      const progress = parseProgressPayload(incoming.content);
      setMessages((previous) => previous.map((entry) => entry.previewHandle === incoming.preview_handle ? {
        ...entry,
        content: progress ? '' : incoming.content,
        format: progress ? 'progress' : 'markdown',
        progress: progress || undefined,
        streaming: progress ? progress.state === 'running' : entry.streaming,
      } : entry));
    } else if (incoming.type === 'delete_message') {
      setMessages((previous) => previous.filter(({ previewHandle }) => previewHandle !== incoming.preview_handle));
    } else if (incoming.type === 'image') {
      setMessages((previous) => [...previous, { id: `image-${Date.now()}`, role: 'assistant', content: '', format: 'image', imageUrl: (incoming as any).url }]);
    } else if (incoming.type === 'file') {
      setMessages((previous) => [...previous, { id: `file-${Date.now()}`, role: 'assistant', content: '', format: 'file', fileName: (incoming as any).name, fileSize: (incoming as any).size }]);
    } else if (incoming.type === 'error') {
      toast.error(incoming.message);
      setTyping(false);
    }
  }, [toast]);

  const {
    status: bridgeStatus,
    sendMessage,
    sendCardAction,
    sendPreviewAck,
  } = useBridgeSocket({
    bridgeCfg: bridgeConfig,
    sessionKey,
    projectName: projectName || '',
    onMessage: handleBridgeMessage,
  });
  previewAck.current = sendPreviewAck;

  useEffect(() => {
    onBridgeStatusChange?.(bridgeStatus);
  }, [bridgeStatus, onBridgeStatusChange]);

  useEffect(() => {
    const container = messageList.current;
    container?.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);

  const send = useCallback((content: string) => {
    const normalized = content.trim();
    if (!normalized || bridgeStatus !== 'connected') return;
    const command = normalized.split(' ')[0];
    if (knownCommands.has(command) && !streamCommands.has(command)) pendingCommand.current = command;
    else setMessages((previous) => [...previous, { id: `user-${Date.now()}`, role: 'user', content: normalized }]);
    sendMessage(normalized);
    setInput('');
    setSending(true);
    window.setTimeout(() => setSending(false), 300);
  }, [bridgeStatus, sendMessage]);

  const handleAction = useCallback((value: string) => {
    if (bridgeStatus !== 'connected') return;
    if (commandPanel.current) pendingCommand.current = commandPanel.current;
    sendCardAction(value);
  }, [bridgeStatus, sendCardAction]);

  const newSession = useCallback(() => {
    if (bridgeStatus !== 'connected') return;
    setMessages((previous) => [...previous, { id: `user-${Date.now()}`, role: 'user', content: '/new' }]);
    sendMessage('/new');
  }, [bridgeStatus, sendMessage]);

  const handledNewSessionRequest = useRef(0);
  useEffect(() => {
    if (newSessionRequest > 0 && newSessionRequest !== handledNewSessionRequest.current) {
      handledNewSessionRequest.current = newSessionRequest;
      newSession();
    }
  }, [newSession, newSessionRequest]);

  const commandItems = useMemo<MenuProps['items']>(() => {
    const groups: { key: SlashCommand['group']; labelKey: string }[] = [
      { key: 'session', labelKey: 'cmd.groupSession' },
      { key: 'settings', labelKey: 'cmd.groupSettings' },
      { key: 'info', labelKey: 'cmd.groupInfo' },
      { key: 'advanced', labelKey: 'cmd.groupAdvanced' },
    ];
    return groups.map((group) => ({
      type: 'group' as const,
      label: t(group.labelKey),
      children: slashCommands.filter(({ group: key }) => key === group.key).map((command) => ({
        key: command.cmd,
        label: <Flex gap={12}><Text code>{command.cmd}</Text><Text>{t(command.labelKey)}</Text></Flex>,
      })),
    }));
  }, [t]);

  const commandMenu: MenuProps = {
    items: commandItems,
    onClick: ({ key }) => send(key),
  };

  if (loading && !currentSession) return <Card><Skeleton active /></Card>;

  return (
    <div className="cc-chat-shell">
      {error && <Alert type="error" showIcon closable title={error} style={{ marginTop: 12 }} />}

      <div ref={messageList} className="cc-message-list">
        {messages.length === 0 && !loading && (
          <Empty
            image={<RobotOutlined className="cc-chat-empty-icon" />}
            description={<Space orientation="vertical" size={2}><Text>{t('chat.emptyHint')}</Text><Text type="secondary">{t('chat.slashHint')}</Text></Space>}
          />
        )}
        {messages.map((entry) => {
          const user = entry.role === 'user';
          return (
            <Flex key={entry.id} gap={10} align="flex-start" justify={user ? 'flex-end' : 'flex-start'}>
              {!user && <Avatar size={32} icon={entry.role === 'system' ? <ThunderboltOutlined /> : <RobotOutlined />} className="cc-message-avatar" />}
              <div className={`cc-message-frame cc-message-frame-${entry.role}${entry.format === 'progress' ? ' cc-message-frame-progress' : ''}`}>
                <div className={`cc-message cc-message-${entry.role}${entry.format === 'progress' ? ' cc-message-progress' : ''}${entry.streaming ? ' cc-message-streaming' : ''}`}>
                  <MessageContent message={entry} onAction={handleAction} />
                  {entry.streaming && entry.format !== 'progress' && <span className="cc-stream-cursor" />}
                </div>
                {!user && !entry.streaming && entry.content && (
                  <div className="cc-message-actions">
                    <Tooltip title={t('common.copy', 'Copy')}>
                      <Button
                        className="cc-message-copy"
                        size="small"
                        type="text"
                        icon={<CopyOutlined />}
                        aria-label={t('common.copy', 'Copy')}
                        onClick={() => void navigator.clipboard.writeText(entry.content).then(() => toast.success(t('common.copied', 'Copied')))}
                      />
                    </Tooltip>
                  </div>
                )}
              </div>
              {user && <Avatar size={32} icon={<UserOutlined />} />}
            </Flex>
          );
        })}
        {typing && !messages.some(({ streaming }) => streaming) && (
          <Flex gap={10} align="center"><Avatar size={32} icon={<RobotOutlined />} className="cc-message-avatar" /><Card size="small"><Spin size="small" /> <Text type="secondary">{t('factor.typing')}</Text></Card></Flex>
        )}
      </div>

      <div className="cc-chat-composer">
        {!bridgeConfig ? (
          <Alert type="warning" showIcon title={t('sessions.bridgeNotAvailable')} />
        ) : bridgeStatus === 'error' || bridgeStatus === 'disconnected' ? (
          <Alert type="warning" showIcon title={t('sessions.bridgeDisconnected')} />
        ) : bridgeStatus !== 'connected' ? (
          <Alert type="info" showIcon title={t('sessions.bridgeConnecting')} />
        ) : (
          <Flex align="flex-end" gap={8}>
            <Dropdown menu={commandMenu} trigger={['click']} placement="topLeft" classNames={{ root: 'cc-command-menu' }}>
              <Tooltip title={t('chat.commands')}><Button size="large" icon={<CodeOutlined />} /></Tooltip>
            </Dropdown>
            <TextArea
              value={input}
              autoSize={{ minRows: 1, maxRows: 5 }}
              placeholder={t('chat.inputPlaceholder')}
              disabled={sending}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  send(input);
                }
              }}
            />
            <Button type="primary" size="large" icon={<SendOutlined />} loading={sending} disabled={!input.trim()} onClick={() => send(input)} />
          </Flex>
        )}
      </div>

      <Drawer
        title={<Space><CheckOutlined /><Text code>{commandResult?.command}</Text></Space>}
        open={Boolean(commandResult)}
        onClose={() => setCommandResult(null)}
        size={440}
      >
        {commandResult?.format === 'card' ? <CardContent card={commandResult.card} onAction={handleAction} /> : commandResult?.format === 'buttons' ? (
          <MessageContent message={{ id: 'command', role: 'assistant', content: commandResult.content, format: 'buttons', buttons: commandResult.buttons }} onAction={handleAction} />
        ) : <MarkdownContent content={commandResult?.content || ''} />}
      </Drawer>
    </div>
  );
}
