import { App } from 'antd';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '@factor/i18n';
import ProjectList from './ProjectList';

const listProjects = vi.fn();
const listAgentTypes = vi.fn();

vi.mock('@/api/projects', () => ({
  listProjects: (...args: unknown[]) => listProjects(...args),
  listAgentTypes: (...args: unknown[]) => listAgentTypes(...args),
}));

describe('project creation', () => {
  afterEach(cleanup);

  beforeEach(async () => {
    await i18n.changeLanguage('en');
    listProjects.mockReset().mockResolvedValue({ projects: [] });
    listAgentTypes.mockReset().mockResolvedValue({ agents: ['codex'], platforms: [] });
  });

  it('opens a guided drawer with visible progress and a stable footer', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><App><ProjectList /></App></MemoryRouter>);

    await user.click(await screen.findByRole('button', { name: /Add project/ }));

    const drawer = screen.getByRole('dialog', { name: 'Add project' });
    expect(drawer).toHaveTextContent('Project info');
    expect(drawer).toHaveTextContent('Platform');
    expect(drawer).toHaveTextContent('Setup');
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
  });
});
