import { App } from 'antd';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '@factor/i18n';
import SystemConfig from './SystemConfig';

const getGlobalSettings = vi.fn();
const updateGlobalSettings = vi.fn();
const raw = vi.fn();

vi.mock('@/api/client', () => ({ default: { raw: (...args: unknown[]) => raw(...args) } }));
vi.mock('@/api/settings', () => ({
  getGlobalSettings: (...args: unknown[]) => getGlobalSettings(...args),
  updateGlobalSettings: (...args: unknown[]) => updateGlobalSettings(...args),
}));
vi.mock('@/api/status', () => ({ reloadConfig: vi.fn(), restartSystem: vi.fn() }));

const settings = {
  language: 'en', attachment_send: '', log_level: 'info', idle_timeout_mins: 0,
  thinking_messages: true, thinking_max_len: 1000, tool_messages: true, tool_max_len: 1000,
  stream_preview_enabled: true, stream_preview_interval_ms: 500,
  rate_limit_max_messages: 10, rate_limit_window_secs: 60,
};

describe('system settings', () => {
  afterEach(cleanup);

  beforeEach(async () => {
    await i18n.changeLanguage('en');
    getGlobalSettings.mockReset().mockResolvedValue(settings);
    updateGlobalSettings.mockReset().mockResolvedValue(settings);
    raw.mockReset().mockResolvedValue('language = "en"');
  });

  it('shows every original settings card without a secondary tab navigation', async () => {
    render(<App><SystemConfig /></App>);

    expect(await screen.findByText('General')).toBeInTheDocument();
    expect(screen.getByText('Display')).toBeInTheDocument();
    expect(screen.getByText('Stream preview')).toBeInTheDocument();
    expect(screen.getByText('Rate limit')).toBeInTheDocument();
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
  });

  it('expands raw configuration inline', async () => {
    const user = userEvent.setup();
    render(<App><SystemConfig /></App>);

    const rawTitle = await screen.findByText('Raw Config');
    const rawCard = rawTitle.closest('.ant-card');
    expect(rawCard).not.toHaveTextContent('language = "en"');
    await user.click(rawCard!.querySelector('button')!);

    expect(rawCard).toHaveTextContent('language = "en"');
  });
});
