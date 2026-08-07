import { App } from 'antd';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '@factor/i18n';
import Dashboard from './Dashboard';

const getStatus = vi.fn();
const listProjects = vi.fn();
const listSessions = vi.fn();

vi.mock('@/api/status', () => ({ getStatus: (...args: unknown[]) => getStatus(...args) }));
vi.mock('@/api/projects', () => ({ listProjects: (...args: unknown[]) => listProjects(...args) }));
vi.mock('@/api/sessions', () => ({ listSessions: (...args: unknown[]) => listSessions(...args) }));

function renderDashboard() {
  return render(<MemoryRouter><App><Dashboard /></App></MemoryRouter>);
}

describe('dashboard', () => {
  afterEach(cleanup);

  beforeEach(async () => {
    await i18n.changeLanguage('en');
    getStatus.mockReset().mockResolvedValue({
      version: '1.2.3', uptime_seconds: 3661, connected_platforms: ['feishu'], projects_count: 2, bridge_adapters: [],
    });
    listProjects.mockReset().mockResolvedValue({
      projects: [
        { name: 'alpha', agent_type: 'codex', platforms: ['feishu'], sessions_count: 1, heartbeat_enabled: true },
        { name: 'beta', agent_type: 'claudecode', platforms: [], sessions_count: 0, heartbeat_enabled: false },
      ],
    });
    listSessions.mockReset().mockImplementation((project: string) => project === 'alpha'
      ? Promise.resolve({ sessions: [{
          id: 's1', session_key: 'web:user', name: 'Release review', platform: 'web', agent_type: 'codex', active: true,
          live: true, created_at: '2026-08-07T08:00:00Z', updated_at: '2026-08-07T09:00:00Z', history_count: 2,
          last_message: { role: 'assistant', content: 'Ready to ship', timestamp: '2026-08-07T09:00:00Z' },
        }], active_keys: {} })
      : Promise.reject(new Error('unavailable')));
  });

  it('shows recent sessions as the primary workspace and links projects to project details', async () => {
    renderDashboard();

    expect(await screen.findByRole('table', { name: 'Recent sessions' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /alpha/i })).toHaveAttribute('href', '/projects/alpha');
    expect(screen.getByRole('link', { name: /Release review/i })).toHaveAttribute('href', '/sessions/alpha/s1');
  });

  it('surfaces projects whose sessions could not be loaded', async () => {
    renderDashboard();

    expect(await screen.findByText('Some projects could not be loaded: beta')).toBeInTheDocument();
  });
});
