import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@factor/i18n';
import SessionWorkspace from './SessionWorkspace';

const listProjects = vi.fn();
const listSessions = vi.fn();

vi.mock('@/api/projects', () => ({
  listProjects: (...args: unknown[]) => listProjects(...args),
}));

vi.mock('@/api/sessions', () => ({
  listSessions: (...args: unknown[]) => listSessions(...args),
}));

vi.mock('../chat/ChatView', () => ({
  default: () => <div>selected conversation</div>,
}));

function LocationProbe() {
  const location = useLocation();
  return <output aria-label="location">{location.pathname}</output>;
}

function renderWorkspace(initialEntry = '/sessions') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/sessions" element={<SessionWorkspace />} />
        <Route path="/sessions/:name" element={<SessionWorkspace />} />
        <Route path="/sessions/:name/:sessionId" element={<SessionWorkspace />} />
      </Routes>
      <LocationProbe />
    </MemoryRouter>,
  );
}

describe('session workspace', () => {
  afterEach(cleanup);

  beforeEach(() => {
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
        updated_at: project === 'alpha' ? '2026-08-07T03:00:00Z' : '2026-08-07T02:00:00Z',
        history_count: 3,
        last_message: { role: 'assistant', content: `${project} latest message`, timestamp: '2026-08-07T03:00:00Z' },
      }],
      active_keys: {},
    }));
  });

  it('shows sessions from every project immediately at the top-level route', async () => {
    renderWorkspace();

    expect(await screen.findByRole('button', { name: /Release review/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Operations/ })).toBeInTheDocument();
  });

  it('opens a session through a stable project and session route', async () => {
    const user = userEvent.setup();
    renderWorkspace();

    await user.click(await screen.findByRole('button', { name: /Release review/ }));

    await waitFor(() => expect(screen.getByRole('status', { name: 'location' })).toHaveTextContent('/sessions/alpha/alpha-session'));
  });

  it('marks the routed session as the current selection', async () => {
    renderWorkspace('/sessions/alpha/alpha-session');

    expect(await screen.findByRole('button', { name: /Release review/ })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('selected conversation')).toBeInTheDocument();
  });
});
