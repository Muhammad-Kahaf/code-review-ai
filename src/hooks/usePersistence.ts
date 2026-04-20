import { useState, useEffect } from 'react';
import type { User, ChatSession, LegacyReviewItem } from '../types';

export const usePersistence = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('review_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [githubToken, setGithubToken] = useState(() => {
    return localStorage.getItem('review_github_token') || '';
  });

  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('review_sessions');
    if (saved) return JSON.parse(saved);

    const legacy = localStorage.getItem('review_history');
    if (legacy) {
      const parsedLegacy = JSON.parse(legacy);
      if (parsedLegacy.length > 0) {
        return [{
          id: 'legacy-session',
          title: 'Legacy Review History',
          messages: parsedLegacy.flatMap((r: LegacyReviewItem) => [
            { role: 'user', content: 'Review Code', code: r.code, timestamp: r.timestamp },
            { role: 'assistant', content: r.content, timestamp: r.timestamp }
          ]),
          focusModes: ['Security', 'Performance', 'Clean Code', 'Logic'],
          createdAt: Date.now()
        }];
      }
    }
    return [];
  });

  const [activeId, setActiveId] = useState<string | null>(() => {
    const saved = localStorage.getItem('active_session_id');
    return saved || null;
  });

  useEffect(() => {
    localStorage.setItem('review_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('review_github_token', githubToken);
  }, [githubToken]);

  useEffect(() => {
    localStorage.setItem('review_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    if (activeId) localStorage.setItem('active_session_id', activeId);
  }, [activeId]);

  return {
    user, setUser,
    githubToken, setGithubToken,
    sessions, setSessions,
    activeId, setActiveId
  };
};
