import { describe, expect, it } from 'vitest';
import type { Session } from '@/api/sessions';
import { buildSessionIndex, filterSessionIndex, findDefaultSession, resolveChatSessionKey } from './sessionModel';

function session(overrides: Partial<Session>): Session {
  return {
    id: 'session-id',
    session_key: 'bridge:web-admin:alpha',
    name: 'Session',
    platform: 'web',
    agent_type: 'codex',
    active: false,
    live: false,
    created_at: '2026-08-07T01:00:00Z',
    updated_at: '2026-08-07T01:00:00Z',
    history_count: 0,
    last_message: null,
    ...overrides,
  };
}

describe('session workspace model', () => {
  it('combines project sessions into one newest-first index', () => {
    const result = buildSessionIndex([
      { project: 'alpha', sessions: [session({ id: 'older', updated_at: '2026-08-07T01:00:00Z' })] },
      { project: 'beta', sessions: [session({ id: 'newer', updated_at: '2026-08-07T03:00:00Z' })] },
    ]);

    expect(result.map(({ id, project }) => ({ id, project }))).toEqual([
      { id: 'newer', project: 'beta' },
      { id: 'older', project: 'alpha' },
    ]);
  });

  it('searches session identity and applies project platform and status filters', () => {
    const sessions = buildSessionIndex([
      { project: 'alpha', sessions: [session({ id: 'live', name: 'Release review', platform: 'feishu', live: true })] },
      { project: 'beta', sessions: [session({ id: 'idle', name: 'Backlog', platform: 'web', live: false })] },
    ]);

    expect(filterSessionIndex(sessions, {
      query: 'release',
      project: 'alpha',
      platform: 'feishu',
      status: 'live',
    }).map(({ id }) => id)).toEqual(['live']);
  });

  it('uses the selected session as the single history and send target', () => {
    const requested = session({ id: 'requested', session_key: 'feishu:user-1' });

    expect(resolveChatSessionKey('bridge:web-admin:alpha', requested)).toBe('feishu:user-1');
  });

  it('uses the explicit Web key when no stored session is selected', () => {
    expect(resolveChatSessionKey('bridge:web-admin:alpha')).toBe('bridge:web-admin:alpha');
  });

  it('loads only the session mapped to the default Web key', () => {
    const unrelatedLatest = session({ id: 'latest', session_key: 'feishu:user-1', updated_at: '2026-08-07T03:00:00Z' });
    const defaultSession = session({ id: 'default', session_key: 'bridge:web-admin:alpha', updated_at: '2026-08-07T01:00:00Z' });

    expect(findDefaultSession([unrelatedLatest, defaultSession], 'bridge:web-admin:alpha')).toBe(defaultSession);
  });
});
