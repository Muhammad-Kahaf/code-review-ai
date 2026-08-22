import { useState, useEffect, useRef } from 'react';
import type { User, ChatSession } from '../types';
import { EncryptionService } from '../services/encryptionService';
import { FirebaseService } from '../services/firebaseService';

const getEmailKey = (user: User | null) => user ? user.email.replace(/[.@]/g, '_') : 'guest_user';

const loadInitialSessions = (emailKey: string): ChatSession[] => {
  try {
    // Try loading from encrypted local cache first
    const hashedKey = EncryptionService.hashKey(`review_sessions_v2_${emailKey}`);
    const encryptedSaved = localStorage.getItem(hashedKey);
    if (encryptedSaved) {
      const decrypted = EncryptionService.decryptObject<ChatSession[]>(encryptedSaved, emailKey);
      if (Array.isArray(decrypted)) return decrypted;
    }

    // Fallback to v1 (legacy migration)
    const hashedKeyV1 = EncryptionService.hashKey(`review_sessions_${emailKey}`);
    const v1 = localStorage.getItem(hashedKeyV1);
    if (v1) {
      const decrypted = EncryptionService.decryptObject<ChatSession[]>(v1, emailKey);
      if (Array.isArray(decrypted)) return decrypted.map(s => ({ ...s, messages: s.messages || [] }));
    }
  } catch (err) {
    console.warn('Failed to load local sessions:', err);
  }

  return [];
};

export const usePersistence = (activeId: string | null | undefined) => {
  const [user, setUserInternal] = useState<User | null>(() => {
    try {
      const hashedKey = EncryptionService.hashKey('review_user');
      const encrypted = localStorage.getItem(hashedKey);
      if (encrypted) {
        return EncryptionService.decryptObject<User>(encrypted);
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [lastSyncedEmail, setLastSyncedEmail] = useState<string | null>(null);
  const emailKey = getEmailKey(user);

  // Derived loading state
  const isLoadingSessions = !!user && user.email !== lastSyncedEmail;

  const [githubToken, setGithubToken] = useState(() => {
    try {
      const hashedKey = EncryptionService.hashKey(`review_github_token_${emailKey}`);
      const encrypted = localStorage.getItem(hashedKey);
      return encrypted ? EncryptionService.decrypt(encrypted, emailKey) : '';
    } catch {
      return '';
    }
  });
  
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    return loadInitialSessions(emailKey);
  });

  const setUser = (newUser: User | null) => {
    if (!newUser) setLastSyncedEmail(null);
    setUserInternal(newUser);
  };

  const prevUserRef = useRef<User | null>(user);
  useEffect(() => {
    if (user?.email !== prevUserRef.current?.email) {
      prevUserRef.current = user;
      const newEmailKey = getEmailKey(user);
      
      const cachedSessions = loadInitialSessions(newEmailKey);
      setSessions(cachedSessions);
      
      try {
        const hashedTokenKey = EncryptionService.hashKey(`review_github_token_${newEmailKey}`);
        const encryptedToken = localStorage.getItem(hashedTokenKey);
        setGithubToken(encryptedToken ? EncryptionService.decrypt(encryptedToken, newEmailKey) : '');
      } catch {
        setGithubToken('');
      }
    }
  }, [user]);

  // Cloud Sync Effect
  useEffect(() => {
    if (!user || user.email === lastSyncedEmail) return;

    Promise.all([
      FirebaseService.getUserSessions(user.email),
      FirebaseService.getGitHubToken(user.email),
      FirebaseService.upsertUser(user)
    ]).then(([cloudSessions, cloudToken]) => {
      setSessions(prev => {
        const merged = [...prev];
        cloudSessions.forEach(cloudS => {
          const existingIdx = merged.findIndex(s => s.id === cloudS.id);
          if (existingIdx >= 0) {
            merged[existingIdx] = {
              ...merged[existingIdx],
              title: cloudS.title,
              createdAt: cloudS.createdAt,
              focusModes: cloudS.focusModes || merged[existingIdx].focusModes
            };
          } else {
            merged.push(cloudS);
          }
        });
        return merged.sort((a, b) => b.createdAt - a.createdAt);
      });

      if (cloudToken) setGithubToken(cloudToken);
      setLastSyncedEmail(user.email);
    })
    .catch((err) => {
      console.error("Firebase sync error:", err);
      setLastSyncedEmail(user.email);
    });
  }, [user, lastSyncedEmail]);

  // Save User auth to local storage
  useEffect(() => {
    try {
      const hashedKey = EncryptionService.hashKey('review_user');
      if (user) {
        localStorage.setItem(hashedKey, EncryptionService.encryptObject(user));
      } else {
        localStorage.removeItem(hashedKey);
      }
    } catch {
      // ignore
    }
  }, [user]);

  // Local Storage persistence for sessions & tokens
  useEffect(() => {
    try {
      const key = getEmailKey(user);
      const hashedTokenKey = EncryptionService.hashKey(`review_github_token_${key}`);
      const hashedSessionsKey = EncryptionService.hashKey(`review_sessions_v2_${key}`);

      if (githubToken) {
        localStorage.setItem(hashedTokenKey, EncryptionService.encrypt(githubToken, key));
      }
      localStorage.setItem(hashedSessionsKey, EncryptionService.encryptObject(sessions, key));

      if (user && githubToken) {
        FirebaseService.saveGitHubToken(user.email, githubToken).catch(console.error);
      }
    } catch (err) {
      console.warn("Failed to persist sessions locally:", err);
    }
  }, [user, githubToken, sessions]);

  // Specific Cloud Sync for active session with messages
  useEffect(() => {
    if (!user || sessions.length === 0 || !activeId) return;
    
    const current = sessions.find(s => s.id === activeId);
    if (current && current.messages && current.messages.length > 0) {
      FirebaseService.saveSession(user.email, current).catch(console.error);
    }
  }, [sessions, activeId, user]);

  return {
    user, setUser,
    githubToken, setGithubToken,
    sessions, setSessions,
    isLoadingSessions
  };
};
