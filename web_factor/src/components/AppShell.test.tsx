import { App } from 'antd';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '@factor/i18n';
import AppShell from './AppShell';
import SessionWorkspace from '../pages/sessions/SessionWorkspace';

const listProjects = vi.fn();
const listSessions = vi.fn();

vi.mock('@/api/status', () => ({ getStatus: vi.fn().mockResolvedValue({ version: 'test' }) }));
vi.mock('@/store/auth', () => ({ useAuthStore: (selector: (state: { logout: () => void }) => unknown) => selector({ logout: vi.fn() }) }));
vi.mock('@/store/theme', () => ({ useThemeStore: () => ({ theme: 'light', setTheme: vi.fn() }) }));
vi.mock('@/api/projects', () => ({ listProjects: (...args: unknown[]) => listProjects(...args) }));
vi.mock('@/api/sessions', () => ({ listSessions: (...args: unknown[]) => listSessions(...args) }));
vi.mock('../pages/chat/ChatView', () => ({ default: () => <div>selected conversation</div> }));

describe('app shell session header', () => {
  afterEach(cleanup);

  beforeEach(async () => {
    await i18n.changeLanguage('zh');
    listProjects.mockReset().mockResolvedValue({
      projects: [
        { name: 'alpha', agent_type: 'codex', platforms: ['web'], sessions_count: 1, heartbeat_enabled: false },
        { name: 'beta', agent_type: 'claudecode', platforms: ['feishu'], sessions_count: 1, heartbeat_enabled: false },
      ],
    });
    listSessions.mockReset().mockImplementation(async (project: string) => ({
      sessions: [{
        id: `${project}-session`,
        session_key: `${project}:key`,
        name: project === 'alpha' ? 'Release review' : 'Operations',
        platform: project === 'alpha' ? 'web' : 'feishu',
        agent_type: project === 'alpha' ? 'codex' : 'claudecode',
        active: project === 'alpha',
        live: project === 'alpha',
        created_at: '2026-08-07T01:00:00Z',
        updated_at: '2026-08-07T03:00:00Z',
        history_count: 3,
        last_message: { role: 'assistant', content: 'latest', timestamp: '2026-08-07T03:00:00Z' },
      }],
      active_keys: {},
    }));
  });

  it('moves session context and actions into the global header and fills the content area', async () => {
    render(
      <App>
        <MemoryRouter initialEntries={['/sessions']}>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/sessions" element={<SessionWorkspace />} />
              <Route path="/sessions/:name/:sessionId" element={<SessionWorkspace />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </App>,
    );

    const header = document.querySelector('.cc-header');
    expect(header).not.toBeNull();
    expect(await within(header as HTMLElement).findByText('2 个会话')).toBeInTheDocument();
    expect(within(header as HTMLElement).getByRole('button', { name: /开始 Web 会话/ })).toBeInTheDocument();

    await waitFor(() => expect(document.querySelector('.cc-content')).toHaveClass('cc-content-immersive'));
    expect(document.querySelector('.cc-footer')).not.toBeInTheDocument();
    expect(document.querySelector('.cc-session-sidebar-header')).not.toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: '会话列表' })).toBeInTheDocument();
  });

  it('shows selected session metadata and contextual actions in the global header', async () => {
    render(
      <App>
        <MemoryRouter initialEntries={['/sessions/alpha/alpha-session']}>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/sessions/:name/:sessionId" element={<SessionWorkspace />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </App>,
    );

    const header = document.querySelector('.cc-header');
    expect(header).not.toBeNull();
    expect(await within(header as HTMLElement).findByText('alpha')).toBeInTheDocument();
    expect(await within(header as HTMLElement).findByText('Release review')).toBeInTheDocument();
    expect(within(header as HTMLElement).getByText('web')).toBeInTheDocument();
    expect(within(header as HTMLElement).getByText('未连接')).toBeInTheDocument();
    expect(within(header as HTMLElement).getByRole('button', { name: /新建会话/ })).toBeDisabled();
    expect(within(header as HTMLElement).getByRole('button', { name: '在其他项目开始会话' })).toBeEnabled();
  });
});
