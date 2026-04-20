import { useState, useEffect } from 'react';
import type { User, ChatSession, LegacyReviewItem } from '../types';

const getEmailKey = (user: User | null) => user?.email.replace(/[.@]/g, '_');

const loadInitialSessions = (emailKey: string | undefined): ChatSession[] => {
  if (!emailKey) return [];
  
  const saved = localStorage.getItem(`review_sessions_${emailKey}`);
  if (saved) return JSON.parse(saved);

  // Fallback to legacy
  const legacy = localStorage.getItem('review_sessions');
  if (legacy) return JSON.parse(legacy);

  const history = localStorage.getItem('review_history');
  if (history) {
    const parsed = JSON.parse(history);
    if (parsed.length > 0) {
      return [{
        id: 'legacy-session',
        title: 'Legacy Review History',
        messages: parsed.flatMap((r: LegacyReviewItem) => [
          { role: 'user', content: 'Review Code', code: r.code, timestamp: r.timestamp },
          { role: 'assistant', content: r.content, timestamp: r.timestamp }
        ]),
        focusModes: ['Security', 'Performance', 'Clean Code', 'Logic'],
        createdAt: Date.now()
      }];
    }
  }
  return [];
};

export const usePersistence = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('review_user');
    return saved ? JSON.parse(saved) : null;
  });

  const emailKey = getEmailKey(user);

  const [githubToken, setGithubToken] = useState(() => 
    emailKey ? localStorage.getItem(`review_github_token_${emailKey}`) || '' : ''
  );
  
  const [sessions, setSessions] = useState<ChatSession[]>(() => 
    loadInitialSessions(emailKey)
  );

  const [activeId, setActiveId] = useState<string | null>(() => 
    emailKey ? localStorage.getItem(`active_session_id_${emailKey}`) : null
  );

  // Sync state during render if user changed (Prevents Cascading Renders)
  const [prevUser, setPrevUser] = useState(user);
  if (user?.email !== prevUser?.email) {
    setPrevUser(user);
    const newEmailKey = getEmailKey(user);
    if (!user) {
      setSessions([]);
      setGithubToken('');
      setActiveId(null);
    } else {
      const newSessions = loadInitialSessions(newEmailKey);
      setSessions(newSessions);
      setGithubToken(localStorage.getItem(`review_github_token_${newEmailKey}`) || '');
      setActiveId(localStorage.getItem(`active_session_id_${newEmailKey}`));
    }
  }

  // Persistent Effects (Saving)
  useEffect(() => {
    localStorage.setItem('review_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const key = getEmailKey(user);
    localStorage.setItem(`review_github_token_${key}`, githubToken);
    localStorage.setItem(`review_sessions_${key}`, JSON.stringify(sessions));
    if (activeId) localStorage.setItem(`active_session_id_${key}`, activeId);
  }, [user, githubToken, sessions, activeId]);

  return {
    user, setUser,
    githubToken, setGithubToken,
    sessions, setSessions,
    activeId, setActiveId
  };
};
