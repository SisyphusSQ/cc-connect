import { App } from 'antd';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '@factor/i18n';
import '@factor/styles.css';
import ChatView from './ChatView';

const getSession = vi.fn();
const listSessions = vi.fn();
const fetchBridgeConfig = vi.fn();
const sendPreviewAck = vi.fn();
let bridgeOnMessage: ((message: Record<string, unknown>) => void) | undefined;

vi.mock('@/api/sessions', () => ({
  getSession: (...args: unknown[]) => getSession(...args),
  listSessions: (...args: unknown[]) => listSessions(...args),
}));

vi.mock('@/hooks/useBridgeSocket', () => ({
  fetchBridgeConfig: (...args: unknown[]) => fetchBridgeConfig(...args),
  useBridgeSocket: (options: { onMessage: (message: Record<string, unknown>) => void }) => {
    bridgeOnMessage = options.onMessage;
    return {
    status: 'connected',
    sendMessage: vi.fn(),
    sendCardAction: vi.fn(),
    sendPreviewAck,
  };
  },
}));

const sessionKey = 'bridge:feishu:qiyi-feishu-work-codex:s7';

function renderChat() {
  return render(
    <App>
      <MemoryRouter initialEntries={['/sessions/qiyi-feishu-work-codex/s7']}>
        <Routes>
          <Route path="/sessions/:name/:sessionId" element={<ChatView />} />
        </Routes>
      </MemoryRouter>
    </App>,
  );
}

describe('chat view', () => {
  const scrollIntoView = vi.fn();
  const scrollTo = vi.fn();
  const originalScrollIntoView = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollIntoView');
  const originalScrollTo = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollTo');

  afterEach(() => {
    cleanup();
    if (originalScrollIntoView) Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', originalScrollIntoView);
    else delete (HTMLElement.prototype as Partial<HTMLElement>).scrollIntoView;
    if (originalScrollTo) Object.defineProperty(HTMLElement.prototype, 'scrollTo', originalScrollTo);
    else delete (HTMLElement.prototype as Partial<HTMLElement>).scrollTo;
  });

  beforeEach(async () => {
    await i18n.changeLanguage('zh');
    scrollIntoView.mockReset();
    scrollTo.mockReset();
    sendPreviewAck.mockReset();
    bridgeOnMessage = undefined;
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    });
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
      configurable: true,
      value: scrollTo,
    });
    fetchBridgeConfig.mockReset().mockResolvedValue({ port: 17321, path: '/bridge', token: 'test-token' });
    listSessions.mockReset().mockResolvedValue({ sessions: [], active_keys: {} });
    getSession.mockReset().mockResolvedValue({
      id: 's7',
      session_key: sessionKey,
      name: 'default',
      platform: 'feishu',
      agent_type: 'codex',
      active: true,
      live: false,
      created_at: '2026-08-07T01:00:00Z',
      updated_at: '2026-08-07T02:00:00Z',
      history_count: 2,
      last_message: {
        role: 'assistant',
        content: 'latest response',
        timestamp: '2026-08-07T02:00:00Z',
      },
      agent_session_id: 'agent-s7',
      history: [
        { role: 'assistant', content: 'latest response', timestamp: '2026-08-07T02:00:00Z' },
        { role: 'user', content: '短问题', timestamp: '2026-08-07T02:01:00Z' },
      ],
    });
  });

  it('keeps automatic history scrolling inside the message list', async () => {
    renderChat();

    expect(await screen.findByText('latest response')).toBeInTheDocument();

    await waitFor(() => expect(scrollTo).toHaveBeenCalled());
    expect(scrollTo.mock.contexts.at(-1)).toBe(document.querySelector('.cc-message-list'));
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('keeps the assistant copy action in its own flow row', async () => {
    renderChat();

    expect(await screen.findByText('短问题')).toBeInTheDocument();

    const copyButton = screen.getByRole('button', { name: '复制' });
    const actionRow = copyButton.closest('.cc-message-actions');
    const assistantBubble = screen.getByText('latest response').closest('.cc-message');

    expect(actionRow).toBeInTheDocument();
    expect(assistantBubble?.nextElementSibling).toBe(actionRow);
    expect(copyButton.closest('.cc-message')).toBeNull();
  });

  it('lets a short user message shrink to its content width', async () => {
    renderChat();

    const userBubble = (await screen.findByText('短问题')).closest('.cc-message');
    const userFrame = userBubble?.parentElement;

    expect(userBubble).toBeInTheDocument();
    expect(userFrame).toHaveClass('cc-message-frame-user');
    expect(getComputedStyle(userBubble as Element).width).toBe('fit-content');
    expect(getComputedStyle(userFrame as Element).maxWidth).toBe('72%');
  });

  it('renders structured agent progress as an expandable work process', async () => {
    renderChat();
    expect(await screen.findByText('latest response')).toBeInTheDocument();

    const payload = '__cc_connect_progress_card_v1__:' + JSON.stringify({
      version: 2,
      agent: 'Codex',
      state: 'running',
      items: [
        { kind: 'thinking', text: '正在确认接口契约' },
        { kind: 'tool_use', tool: 'shell', text: 'rg dumpDBIODetail' },
        { kind: 'tool_result', tool: 'shell', text: '找到 3 处实现', status: 'completed', success: true },
      ],
      truncated: false,
    });

    act(() => bridgeOnMessage?.({ type: 'preview_start', ref_id: 'progress-1', session_key: sessionKey, reply_ctx: sessionKey, content: payload }));

    expect(await screen.findByText('工作过程')).toBeInTheDocument();
    expect(screen.getByText('正在确认接口契约')).toBeInTheDocument();
    expect(screen.getByText('rg dumpDBIODetail')).toBeInTheDocument();
    expect(screen.queryByText(/__cc_connect_progress_card_v1__/)).not.toBeInTheDocument();
  });

  it('updates only the preview identified by the bridge handle', async () => {
    renderChat();
    expect(await screen.findByText('latest response')).toBeInTheDocument();

    act(() => {
      bridgeOnMessage?.({ type: 'preview_start', ref_id: 'preview-1', session_key: sessionKey, reply_ctx: sessionKey, content: 'first preview' });
      bridgeOnMessage?.({ type: 'preview_start', ref_id: 'preview-2', session_key: sessionKey, reply_ctx: sessionKey, content: 'second preview' });
    });

    const firstHandle = sendPreviewAck.mock.calls[0]?.[1] as string;
    act(() => bridgeOnMessage?.({ type: 'update_message', session_key: sessionKey, preview_handle: firstHandle, content: 'first updated' }));

    expect(await screen.findByText('first updated')).toBeInTheDocument();
    expect(screen.getByText('second preview')).toBeInTheDocument();
  });
});
