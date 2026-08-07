import type { Session } from '@/api/sessions';

export interface IndexedSession extends Session {
  project: string;
}

export interface SessionFilters {
  query: string;
  project: string;
  platform: string;
  status: 'all' | 'live' | 'idle';
}

export function buildSessionIndex(groups: { project: string; sessions: Session[] }[]): IndexedSession[] {
  return groups
    .flatMap(({ project, sessions }) => sessions.map((session) => ({ ...session, project })))
    .sort((left, right) => {
      const leftTime = left.updated_at || left.created_at || '';
      const rightTime = right.updated_at || right.created_at || '';
      return rightTime.localeCompare(leftTime);
    });
}

export function filterSessionIndex(sessions: IndexedSession[], filters: SessionFilters): IndexedSession[] {
  const query = filters.query.trim().toLocaleLowerCase();
  return sessions.filter((session) => {
    if (filters.project && session.project !== filters.project) return false;
    if (filters.platform && session.platform !== filters.platform) return false;
    if (filters.status === 'live' && !session.live) return false;
    if (filters.status === 'idle' && session.live) return false;
    if (!query) return true;

    return [
      session.name,
      session.user_name,
      session.chat_name,
      session.id,
      session.project,
      session.platform,
      session.last_message?.content,
    ].some((value) => value?.toLocaleLowerCase().includes(query));
  });
}

export function resolveChatSessionKey(
  defaultSessionKey: string,
  selectedSession?: Pick<Session, 'session_key'> | null,
): string {
  return selectedSession?.session_key || defaultSessionKey;
}

export function findDefaultSession(sessions: Session[], defaultSessionKey: string): Session | undefined {
  return sessions.find(({ session_key: sessionKey }) => sessionKey === defaultSessionKey);
}
