import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '@factor/i18n';
import PlatformManualForm from './PlatformManualForm';

const addPlatformToProject = vi.fn();

vi.mock('@/api/projects', () => ({
  addPlatformToProject: (...args: unknown[]) => addPlatformToProject(...args),
}));

describe('platform setup form', () => {
  afterEach(cleanup);

  beforeEach(async () => {
    await i18n.changeLanguage('en');
    addPlatformToProject.mockReset().mockResolvedValue({ message: 'ok', restart_required: true });
  });

  it('validates Cloud Web transport semantics before saving', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();

    render(
      <PlatformManualForm
        platformType="cloud_web"
        projectName="alpha"
        workDir="/workspace/alpha"
        agentType="codex"
        onComplete={onComplete}
        onCancel={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText('Access Token'), 'secret');
    await user.click(screen.getByRole('button', { name: /Add platform/ }));

    expect(await screen.findByText(/WebSocket transport requires API base URL or WebSocket URL/)).toBeInTheDocument();
    expect(addPlatformToProject).not.toHaveBeenCalled();

    const textboxes = screen.getAllByRole('textbox');
    await user.type(textboxes[textboxes.length - 1], 'https://gateway.example.com');
    await user.click(screen.getByRole('button', { name: /Add platform/ }));

    expect(addPlatformToProject).toHaveBeenCalledWith('alpha', {
      type: 'cloud_web',
      options: {
        transport: 'websocket',
        token: 'secret',
        base_url: 'https://gateway.example.com',
      },
      work_dir: '/workspace/alpha',
      agent_type: 'codex',
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('renders upstream select fields and conditional options in Factor controls', async () => {
    const user = userEvent.setup();

    render(
      <PlatformManualForm
        platformType="tuitui"
        projectName="alpha"
        onComplete={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Advanced options/ }));

    expect(screen.getByText('Group policy')).toBeInTheDocument();
    expect(screen.getByText('Require explicit mention')).toBeInTheDocument();
    expect(screen.getByRole('spinbutton')).toHaveValue('50');
  });
});
