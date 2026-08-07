import { App } from 'antd';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '@factor/i18n';
import CronList from './CronList';

const listCronJobs = vi.fn();
const createCronJob = vi.fn();
const updateCronJob = vi.fn();
const deleteCronJob = vi.fn();
const triggerCronJob = vi.fn();
const listProjects = vi.fn();
const listSessions = vi.fn();

vi.mock('@/api/cron', () => ({
  listCronJobs: (...args: unknown[]) => listCronJobs(...args),
  createCronJob: (...args: unknown[]) => createCronJob(...args),
  updateCronJob: (...args: unknown[]) => updateCronJob(...args),
  deleteCronJob: (...args: unknown[]) => deleteCronJob(...args),
  triggerCronJob: (...args: unknown[]) => triggerCronJob(...args),
}));

vi.mock('@/api/projects', () => ({
  listProjects: (...args: unknown[]) => listProjects(...args),
}));

vi.mock('@/api/sessions', () => ({
  listSessions: (...args: unknown[]) => listSessions(...args),
}));

const jobs = [
  {
    id: 'cron-enabled', project: 'alpha', session_key: 'feishu:chat:user', cron_expr: '0 9 * * *',
    prompt: 'Prepare the daily report', exec: '', work_dir: '', description: 'Daily report', enabled: true,
    silent: undefined, mute: false, session_mode: '', mode: '', timeout_mins: undefined,
    created_at: '2026-08-07T00:00:00Z', last_run: '', last_error: '',
  },
  {
    id: 'cron-disabled', project: 'beta', session_key: 'web:chat:user', cron_expr: '0 18 * * *',
    prompt: '', exec: 'pnpm build', work_dir: '/workspace/beta', description: 'Nightly build', enabled: false,
    silent: true, mute: false, session_mode: 'new_per_run', mode: 'plan', timeout_mins: 60,
    created_at: '2026-08-07T00:00:00Z', last_run: '', last_error: '',
  },
];

function renderCronList() {
  return render(<App><CronList /></App>);
}

describe('cron page', () => {
  afterEach(cleanup);

  beforeEach(async () => {
    await i18n.changeLanguage('en');
    for (const mock of [listCronJobs, createCronJob, updateCronJob, deleteCronJob, triggerCronJob, listProjects, listSessions]) {
      mock.mockReset();
    }
    listCronJobs.mockResolvedValue({ jobs });
    listProjects.mockResolvedValue({ projects: [{ name: 'alpha' }, { name: 'beta' }] });
    listSessions.mockResolvedValue({ sessions: [] });
    triggerCronJob.mockResolvedValue({ id: 'cron-enabled', status: 'pending' });
  });

  it('filters scheduled jobs in a management table', async () => {
    const user = userEvent.setup();
    renderCronList();

    expect(await screen.findByRole('columnheader', { name: 'Task' })).toBeInTheDocument();
    expect(screen.getByText('Daily report')).toBeInTheDocument();
    expect(screen.getByText('Nightly build')).toBeInTheDocument();

    await user.type(screen.getByRole('searchbox', { name: 'Search scheduled jobs' }), 'nightly');

    expect(screen.queryByText('Daily report')).not.toBeInTheDocument();
    expect(screen.getByText('Nightly build')).toBeInTheDocument();
  });

  it('asks for confirmation before running a job immediately', async () => {
    const user = userEvent.setup();
    renderCronList();

    await user.click(await screen.findByRole('button', { name: 'Run now Daily report' }));

    expect(screen.getByText('Run this job now?')).toBeInTheDocument();
    expect(triggerCronJob).not.toHaveBeenCalled();
  });

  it('shows an icon for every overflow-menu action', async () => {
    const user = userEvent.setup();
    renderCronList();

    await user.click(await screen.findByRole('button', { name: 'More actions Daily report' }));

    const menu = await screen.findByRole('menu');
    for (const item of within(menu).getAllByRole('menuitem')) {
      expect(item.querySelector('[role="img"]')).not.toBeNull();
    }
  });
});
