import { useState, useEffect } from 'react';
import type { User, ChatSession } from '../types';
import { EncryptionService } from '../services/encryptionService';
import { FirebaseService } from '../services/firebaseService';

const getEmailKey = (user: User | null) => user?.email.replace(/[.@]/g, '_');

const loadInitialSessions = (emailKey: string | undefined): ChatSession[] => {
  if (!emailKey) return [];
  
  // Try loading from encrypted local cache first
  const hashedKey = EncryptionService.hashKey(`review_sessions_v2_${emailKey}`);
  const encryptedSaved = localStorage.getItem(hashedKey);
  if (encryptedSaved) {
    const decrypted = EncryptionService.decryptObject<ChatSession[]>(encryptedSaved, emailKey);
    if (decrypted) return decrypted;
  }

  // Fallback to v1 (legacy migration)
  const hashedKeyV1 = EncryptionService.hashKey(`review_sessions_${emailKey}`);
  const v1 = localStorage.getItem(hashedKeyV1);
  if (v1) {
    const decrypted = EncryptionService.decryptObject<ChatSession[]>(v1, emailKey);
    if (decrypted) return decrypted.map(s => ({ ...s, messages: [] }));
  }

  return [];
};

export const usePersistence = (activeId: string | null | undefined) => {
  const [user, setUserInternal] = useState<User | null>(() => {
    const hashedKey = EncryptionService.hashKey('review_user');
    const encrypted = localStorage.getItem(hashedKey);
    if (encrypted) {
      return EncryptionService.decryptObject<User>(encrypted);
    }
    return null;
  });

  const setUser = (newUser: User | null) => {
    if (!newUser) setLastSyncedEmail(null);
    setUserInternal(newUser);
  };

  const [lastSyncedEmail, setLastSyncedEmail] = useState<string | null>(null);
  const emailKey = getEmailKey(user);

  // Derived loading state
  const isLoadingSessions = !!user && user.email !== lastSyncedEmail;

  const [githubToken, setGithubToken] = useState(() => {
    if (!emailKey) return '';
    const hashedKey = EncryptionService.hashKey(`review_github_token_${emailKey}`);
    const encrypted = localStorage.getItem(hashedKey);
    return encrypted ? EncryptionService.decrypt(encrypted, emailKey) : '';
  });
  
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    if (!emailKey) return [];
    return loadInitialSessions(emailKey);
  });

  const [prevUser, setPrevUser] = useState(user);
  if (user?.email !== prevUser?.email) {
    setPrevUser(user);
    const newEmailKey = getEmailKey(user);
    
    if (!user) {
      setSessions([]);
      setGithubToken('');
    } else {
      const cachedSessions = loadInitialSessions(newEmailKey);
      setSessions(cachedSessions);
      
      const hashedTokenKey = EncryptionService.hashKey(`review_github_token_${newEmailKey}`);
      const encryptedToken = localStorage.getItem(hashedTokenKey);
      setGithubToken(encryptedToken ? EncryptionService.decrypt(encryptedToken, newEmailKey) : '');
    }
  }

  // Cloud Sync Effect - Only Metadata
  useEffect(() => {
    if (!user || user.email === lastSyncedEmail) return;

    Promise.all([
      FirebaseService.getUserSessions(user.email),
      FirebaseService.getGitHubToken(user.email),
      FirebaseService.upsertUser(user)
    ]).then(([cloudSessions, cloudToken]) => {
      // Merge cloud sessions with local sessions instead of overwriting
      setSessions(prev => {
        const merged = [...prev];
        cloudSessions.forEach(cloudS => {
          const existingIdx = merged.findIndex(s => s.id === cloudS.id);
          if (existingIdx >= 0) {
            // Update metadata but keep messages if they already exist locally
            merged[existingIdx] = {
              ...merged[existingIdx],
              title: cloudS.title,
              createdAt: cloudS.createdAt,
              focusModes: cloudS.focusModes
            };
          } else {
            // Add new session from cloud
            merged.push(cloudS);
          }
        });
        // Sort by createdAt descending
        return merged.sort((a, b) => b.createdAt - a.createdAt);
      });

      if (cloudToken) setGithubToken(cloudToken);
      setLastSyncedEmail(user.email);
    })
    .catch((err) => {
      console.error(err);
      setLastSyncedEmail(user.email);
    });
  }, [user?.email, lastSyncedEmail]);

  useEffect(() => {
    const hashedKey = EncryptionService.hashKey('review_user');
    if (user) {
      localStorage.setItem(hashedKey, EncryptionService.encryptObject(user));
    } else {
      localStorage.removeItem(hashedKey);
    }
  }, [user]);

  // Local Storage persistence for metadata
  useEffect(() => {
    if (!user || isLoadingSessions) return;
    const key = getEmailKey(user);
    
    const hashedTokenKey = EncryptionService.hashKey(`review_github_token_${key}`);
    const hashedSessionsKey = EncryptionService.hashKey(`review_sessions_v2_${key}`);

    localStorage.setItem(hashedTokenKey, EncryptionService.encrypt(githubToken, key));
    localStorage.setItem(hashedSessionsKey, EncryptionService.encryptObject(sessions, key));

    FirebaseService.saveGitHubToken(user.email, githubToken).catch(console.error);
  }, [user, githubToken, sessions, isLoadingSessions]);

  // Specific Cloud Sync for the active session (including messages)
  useEffect(() => {
    if (!user || sessions.length === 0 || isLoadingSessions || !activeId) return;
    
    const current = sessions.find(s => s.id === activeId);
    // Only save if there are messages to save
    if (current && current.messages && current.messages.length > 0) {
        FirebaseService.saveSession(user.email, current).catch(console.error);
    }
  }, [sessions, activeId, user, isLoadingSessions]);

  return {
    user, setUser,
    githubToken, setGithubToken,
    sessions, setSessions,
    isLoadingSessions
  };
};
