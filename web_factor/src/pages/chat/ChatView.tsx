import {
  ArrowLeftOutlined,
  CheckOutlined,
  CodeOutlined,
  CopyOutlined,
  FileOutlined,
  MessageOutlined,
  PlusOutlined,
  RobotOutlined,
  SendOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Alert,
  App,
  Avatar,
  Button,
  Card,
  Divider,
  Drawer,
  Dropdown,
  Empty,
  Flex,
  Input,
  List,
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
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import { getSession, listSessions, type Session, type SessionDetail } from '@/api/sessions';
import {
  fetchBridgeConfig,
  useBridgeSocket,
  type BridgeConfig,
  type BridgeIncoming,
  type BridgeStatus,
} from '@/hooks/useBridgeSocket';

const { Text, Title } = Typography;
const { TextArea } = Input;

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

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  format?: 'text' | 'markdown' | 'card' | 'buttons' | 'image' | 'file';
  card?: Record<string, any>;
  buttons?: { text: string; data: string }[][];
  imageUrl?: string;
  fileName?: string;
  fileSize?: number;
  streaming?: boolean;
  timestamp?: string;
}

interface CommandResult {
  command: string;
  content: string;
  format: 'text' | 'markdown' | 'card' | 'buttons';
  card?: Record<string, any>;
  buttons?: { text: string; data: string }[][];
}

function timeAgo(iso: string) {
  if (!iso) return '';
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return '<1m';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
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

function BridgeBadge({ status }: { status: BridgeStatus }) {
  const { t } = useTranslation();
  if (status === 'connected') return <Tag color="success">{t('sessions.bridgeConnected')}</Tag>;
  if (status === 'connecting' || status === 'registering') return <Tag icon={<Spin size="small" />} color="processing">{t('sessions.bridgeConnecting')}</Tag>;
  return <Tag>{t('sessions.bridgeDisconnected')}</Tag>;
}

export default function ChatView() {
  const { t } = useTranslation();
  const { message: toast } = App.useApp();
  const { name: projectName } = useParams<{ name: string }>();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<SessionDetail | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState('');
  const [bridgeConfig, setBridgeConfig] = useState<BridgeConfig | null>(null);
  const [userPickedSession, setUserPickedSession] = useState(false);
  const [sessionsOpen, setSessionsOpen] = useState(false);
  const [commandResult, setCommandResult] = useState<CommandResult | null>(null);
  const messagesEnd = useRef<HTMLDivElement>(null);
  const sessionKeyRef = useRef('');
  const previewCounter = useRef(0);
  const pendingCommand = useRef<string | null>(null);
  const commandPanel = useRef<string | null>(null);
  const previewAck = useRef<(refId: string, handle: string) => void>(() => undefined);

  const defaultSessionKey = projectName ? `bridge:web-admin:${projectName}` : '';
  const sessionKey = userPickedSession && currentSession?.session_key ? currentSession.session_key : defaultSessionKey;
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
    try {
      const [{ sessions: projectSessions }, config] = await Promise.all([
        listSessions(projectName),
        fetchBridgeConfig(),
      ]);
      const sorted = [...(projectSessions || [])].sort((left, right) =>
        (right.updated_at || right.created_at || '').localeCompare(left.updated_at || left.created_at || ''),
      );
      setSessions(sorted);
      setBridgeConfig(config);
      if (sorted[0]) hydrateHistory(await getSession(projectName, sorted[0].id, 200));
      else {
        setCurrentSession(null);
        setMessages([]);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setLoading(false);
    }
  }, [hydrateHistory, projectName]);

  useEffect(() => { void refresh(); }, [refresh]);

  const switchToSession = useCallback(async (session: Session) => {
    if (!projectName) return;
    setSessionsOpen(false);
    setLoading(true);
    setUserPickedSession(true);
    try {
      hydrateHistory(await getSession(projectName, session.id, 200));
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setLoading(false);
    }
  }, [hydrateHistory, projectName, toast]);

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
        const index = previous.findIndex(({ streaming, role }) => streaming && role === 'assistant');
        if (index < 0) return [...previous, { id: `reply-${Date.now()}`, role: 'assistant', content: incoming.content, format: incoming.format === 'markdown' ? 'markdown' : 'text' }];
        const next = [...previous];
        next[index] = { ...next[index], content: incoming.content, format: incoming.format === 'markdown' ? 'markdown' : 'text', streaming: false };
        return next;
      });
      setTyping(false);
    } else if (incoming.type === 'reply_stream') {
      setMessages((previous) => {
        const index = previous.findIndex(({ streaming }) => streaming);
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
      setMessages((previous) => [...previous, { id: `preview-${handle}`, role: 'assistant', content: incoming.content, format: 'markdown', streaming: true }]);
    } else if (incoming.type === 'update_message') {
      setMessages((previous) => previous.map((entry) => entry.streaming ? { ...entry, content: incoming.content } : entry));
    } else if (incoming.type === 'delete_message') {
      setMessages((previous) => previous.filter(({ streaming }) => !streaming));
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
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
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
    setUserPickedSession(false);
    setMessages((previous) => [...previous, { id: `user-${Date.now()}`, role: 'user', content: '/new' }]);
    sendMessage('/new');
    setSessionsOpen(false);
  }, [bridgeStatus, sendMessage]);

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

  if (loading && sessions.length === 0 && !currentSession) return <Card><Skeleton active /></Card>;

  return (
    <div className="cc-chat-shell">
      <Flex align="center" justify="space-between" gap={12} className="cc-chat-header">
        <Flex align="center" gap={12}>
          <Tooltip title={t('common.back', 'Back')}><Link to="/chat"><Button type="text" icon={<ArrowLeftOutlined />} /></Link></Tooltip>
          <Avatar shape="square" size={42} icon={<MessageOutlined />} className="cc-platform-avatar" />
          <div>
            <Flex align="center" wrap gap={8}>
              <Title level={4} style={{ margin: 0 }}>{projectName}</Title>
              <BridgeBadge status={bridgeStatus} />
            </Flex>
            <Button type="link" size="small" onClick={() => setSessionsOpen(true)} style={{ padding: 0 }}>
              {userPickedSession && currentSession ? currentSession.name || currentSession.id.slice(0, 8) : t('chat.defaultSession')}
            </Button>
          </div>
        </Flex>
        <Button icon={<PlusOutlined />} onClick={newSession} disabled={bridgeStatus !== 'connected'}>{t('cmd.new')}</Button>
      </Flex>

      {error && <Alert type="error" showIcon closable title={error} style={{ marginTop: 12 }} />}

      <div className="cc-message-list">
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
              <div className={`cc-message cc-message-${entry.role}${entry.streaming ? ' cc-message-streaming' : ''}`}>
                <MessageContent message={entry} onAction={handleAction} />
                {!user && !entry.streaming && entry.content && (
                  <Tooltip title={t('common.copy', 'Copy')}>
                    <Button
                      className="cc-message-copy"
                      size="small"
                      type="text"
                      icon={<CopyOutlined />}
                      onClick={() => void navigator.clipboard.writeText(entry.content).then(() => toast.success(t('common.copied', 'Copied')))}
                    />
                  </Tooltip>
                )}
                {entry.streaming && <span className="cc-stream-cursor" />}
              </div>
              {user && <Avatar size={32} icon={<UserOutlined />} />}
            </Flex>
          );
        })}
        {typing && !messages.some(({ streaming }) => streaming) && (
          <Flex gap={10} align="center"><Avatar size={32} icon={<RobotOutlined />} className="cc-message-avatar" /><Card size="small"><Spin size="small" /> <Text type="secondary">{t('factor.typing')}</Text></Card></Flex>
        )}
        <div ref={messagesEnd} />
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
        title={t('chat.sessions')}
        open={sessionsOpen}
        onClose={() => setSessionsOpen(false)}
        extra={<Button type="primary" size="small" icon={<PlusOutlined />} onClick={newSession}>{t('cmd.new')}</Button>}
      >
        {sessions.length === 0 ? <Empty description={t('sessions.noSessions')} /> : (
          <List
            dataSource={sessions}
            renderItem={(session) => (
              <List.Item className={session.id === currentSession?.id ? 'cc-session-active' : ''} onClick={() => void switchToSession(session)}>
                <List.Item.Meta
                  avatar={<Avatar icon={<MessageOutlined />} />}
                  title={<Flex align="center" gap={6}><Text strong>{session.name || session.user_name || session.id.slice(0, 8)}</Text>{session.live && <Tag color="success">{t('factor.live')}</Tag>}</Flex>}
                  description={<Space orientation="vertical" size={0}><Text type="secondary" ellipsis>{session.last_message?.content || t('common.noData')}</Text><Text type="secondary">{session.platform} · {t('factor.messageCount', { count: session.history_count })} · {timeAgo(session.updated_at || session.created_at)}</Text></Space>}
                />
              </List.Item>
            )}
          />
        )}
      </Drawer>

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
