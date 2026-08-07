import { App } from 'antd';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '@factor/i18n';
import SkillList from './SkillList';

const listSkills = vi.fn();
const fetchSkillPresets = vi.fn();

vi.mock('@/api/skills', () => ({
  listSkills: (...args: unknown[]) => listSkills(...args),
  fetchSkillPresets: (...args: unknown[]) => fetchSkillPresets(...args),
}));

function renderSkillList() {
  return render(
    <App>
      <SkillList />
    </App>,
  );
}

describe('skills page', () => {
  afterEach(cleanup);

  beforeEach(async () => {
    await i18n.changeLanguage('en');
    listSkills.mockReset();
    fetchSkillPresets.mockReset().mockResolvedValue({ version: 1, updated_at: '2026-08-07T00:00:00Z', skills: [] });
  });

  it('filters local skills by user-visible content', async () => {
    const user = userEvent.setup();
    listSkills.mockResolvedValue({
      projects: [{
        project: 'alpha',
        agent_type: 'codex',
        dirs: ['/workspace/alpha/.agents/skills'],
        skills: [
          { name: 'deploy-check', display_name: 'Deploy Check', description: 'Check release readiness', source: '/workspace/alpha/.agents/skills/deploy-check/SKILL.md' },
          { name: 'incident-review', display_name: 'Incident Review', description: 'Summarize production incidents', source: '/workspace/alpha/.agents/skills/incident-review/SKILL.md' },
        ],
      }],
    });

    renderSkillList();

    expect(await screen.findByText('Deploy Check')).toBeInTheDocument();
    expect(screen.getByText('Incident Review')).toBeInTheDocument();
    await user.type(screen.getByRole('searchbox', { name: 'Search skills' }), 'incident');

    expect(screen.queryByText('Deploy Check')).not.toBeInTheDocument();
    expect(screen.getByText('Incident Review')).toBeInTheDocument();
  });

  it('paginates large local skill inventories instead of rendering every skill', async () => {
    listSkills.mockResolvedValue({
      projects: [{
        project: 'alpha',
        agent_type: 'codex',
        dirs: ['/workspace/alpha/.agents/skills'],
        skills: Array.from({ length: 25 }, (_, index) => ({
          name: `skill-${String(index).padStart(2, '0')}`,
          display_name: `Skill ${String(index).padStart(2, '0')}`,
          description: `Skill ${index} description`,
          source: `/workspace/alpha/.agents/skills/skill-${String(index).padStart(2, '0')}/SKILL.md`,
        })),
      }],
    });

    renderSkillList();

    expect(await screen.findByText('Skill 00')).toBeInTheDocument();
    expect(screen.getByText('Skill 19')).toBeInTheDocument();
    expect(screen.queryByText('Skill 20')).not.toBeInTheDocument();
  });

  it('shows more local skills when the user changes the page size', async () => {
    const user = userEvent.setup();
    listSkills.mockResolvedValue({
      projects: [{
        project: 'alpha',
        agent_type: 'codex',
        dirs: ['/workspace/alpha/.agents/skills'],
        skills: Array.from({ length: 25 }, (_, index) => ({
          name: `skill-${String(index).padStart(2, '0')}`,
          display_name: `Skill ${String(index).padStart(2, '0')}`,
          description: `Skill ${index} description`,
          source: `/workspace/alpha/.agents/skills/skill-${String(index).padStart(2, '0')}/SKILL.md`,
        })),
      }],
    });

    renderSkillList();

    expect(await screen.findByText('Skill 19')).toBeInTheDocument();
    await user.click(screen.getByRole('combobox', { name: 'Page Size' }));
    await user.click(await screen.findByRole('option', { name: '50 / page' }));

    expect(screen.getByText('Skill 24')).toBeInTheDocument();
  });

  it('keeps pagination controls inset from the card edges', async () => {
    listSkills.mockResolvedValue({
      projects: [{
        project: 'alpha',
        agent_type: 'codex',
        dirs: ['/workspace/alpha/.agents/skills'],
        skills: Array.from({ length: 25 }, (_, index) => ({
          name: `skill-${String(index).padStart(2, '0')}`,
          display_name: `Skill ${String(index).padStart(2, '0')}`,
          description: `Skill ${index} description`,
          source: `/workspace/alpha/.agents/skills/skill-${String(index).padStart(2, '0')}/SKILL.md`,
        })),
      }],
    });

    const { container } = renderSkillList();

    expect(await screen.findByText('Skill 19')).toBeInTheDocument();
    expect(container.querySelector('.cc-skills-table-card .ant-pagination')).toHaveStyle({ marginInline: '16px' });
  });
});
