import { App } from 'antd';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '@factor/i18n';
import ProjectDetail from './ProjectDetail';

const triggerHeartbeat = vi.fn();

vi.mock('@/api/projects', () => ({
  getProject: vi.fn().mockResolvedValue({
    name: 'alpha', agent_type: 'codex', work_dir: '/workspace/alpha', agent_mode: 'default', provider_refs: [],
    platform_configs: [{ type: 'feishu', allow_from: '*' }], platforms: [{ type: 'feishu', connected: true }],
    sessions_count: 2, active_session_keys: ['feishu:user'], heartbeat: { enabled: true, paused: false, interval_mins: 30, session_key: 'feishu:user' },
    settings: { admin_from: '', language: 'en', disabled_commands: [] },
  }),
  listAgentTypes: vi.fn().mockResolvedValue({ agents: ['codex', 'claudecode'], platforms: [] }),
  updateProject: vi.fn(), deleteProject: vi.fn(),
}));
vi.mock('@/api/providers', () => ({
  listProviders: vi.fn().mockResolvedValue({ providers: [], active_provider: '' }),
  listGlobalProviders: vi.fn().mockResolvedValue({ providers: [] }), activateProvider: vi.fn(), addProvider: vi.fn(),
  removeProvider: vi.fn(), saveProviderRefs: vi.fn(),
}));
vi.mock('@/api/heartbeat', () => ({
  getHeartbeat: vi.fn().mockResolvedValue({
    enabled: true, paused: false, interval_mins: 30, only_when_idle: true, session_key: 'feishu:user', silent: false,
    run_count: 8, error_count: 1, skipped_busy: 2, last_run: '2026-08-07T08:00:00Z', last_error: 'timeout',
  }),
  pauseHeartbeat: vi.fn(), resumeHeartbeat: vi.fn(), setHeartbeatInterval: vi.fn(),
  triggerHeartbeat: (...args: unknown[]) => triggerHeartbeat(...args),
}));
vi.mock('@/api/status', () => ({ restartSystem: vi.fn() }));

function renderDetail(path = '/projects/alpha?tab=heartbeat') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App><Routes><Route path="/projects/:name" element={<ProjectDetail />} /></Routes></App>
    </MemoryRouter>,
  );
}

describe('project detail', () => {
  afterEach(cleanup);

  beforeEach(async () => {
    await i18n.changeLanguage('en');
    triggerHeartbeat.mockReset().mockResolvedValue({});
  });

  it('restores the selected main tab from the URL', async () => {
    renderDetail();

    expect(await screen.findByRole('tab', { name: /Heartbeat/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('8 runs')).toBeInTheDocument();
  });

  it('asks for confirmation before triggering heartbeat', async () => {
    const user = userEvent.setup();
    renderDetail();

    await user.click(await screen.findByRole('button', { name: /Run now/ }));

    expect(screen.getByText('Run heartbeat now?')).toBeInTheDocument();
    expect(triggerHeartbeat).not.toHaveBeenCalled();
  });

  it('shows the original settings cards together without nested tabs', async () => {
    renderDetail('/projects/alpha?tab=settings');

    expect(await screen.findByRole('tab', { name: /Settings/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getAllByRole('tablist')).toHaveLength(1);
    expect(screen.getByText('Agent type')).toBeInTheDocument();
    expect(screen.getByText('Reply footer')).toBeInTheDocument();
    expect(screen.getByText('feishu — Allowed users')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  });

  it('keeps the active indicator compact beneath the tab label', async () => {
    renderDetail('/projects/alpha');

    const tablist = await screen.findByRole('tablist');
    const indicator = tablist.querySelector('.ant-tabs-ink-bar');
    expect(indicator).toHaveStyle({ width: '32px' });
  });
});
