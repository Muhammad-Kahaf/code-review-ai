import { useState, useEffect } from 'react';
import type { User, ChatSession } from '../types';
import { EncryptionService } from '../services/encryptionService';
import { FirebaseService } from '../services/firebaseService';

const getUserKey = (user: User | null) => user?.email ? user.email.replace(/[.@]/g, '_') : user?.uid;

const loadInitialSessions = (userKey: string | undefined): ChatSession[] => {
  if (!userKey) return [];
  
  // Try loading from encrypted local cache first
  const hashedKey = EncryptionService.hashKey(`review_sessions_v2_${userKey}`);
  const encryptedSaved = localStorage.getItem(hashedKey);
  if (encryptedSaved) {
    const decrypted = EncryptionService.decryptObject<ChatSession[]>(encryptedSaved, userKey);
    if (decrypted) return decrypted;
  }

  // Fallback to v1 (legacy migration)
  const hashedKeyV1 = EncryptionService.hashKey(`review_sessions_${userKey}`);
  const v1 = localStorage.getItem(hashedKeyV1);
  if (v1) {
    const decrypted = EncryptionService.decryptObject<ChatSession[]>(v1, userKey);
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
  const userKey = getUserKey(user);

  // Derived loading state
  const isLoadingSessions = !!user && (user.email || user.uid) !== lastSyncedEmail;

  const [githubToken, setGithubToken] = useState(() => {
    if (!userKey) return '';
    const hashedKey = EncryptionService.hashKey(`review_github_token_${userKey}`);
    const encrypted = localStorage.getItem(hashedKey);
    return encrypted ? EncryptionService.decrypt(encrypted, userKey) : '';
  });
  
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    if (!userKey) return [];
    return loadInitialSessions(userKey);
  });

  const [prevUser, setPrevUser] = useState(user);
  if (user?.uid !== prevUser?.uid) {
    setPrevUser(user);
    const newUserKey = getUserKey(user);
    
    if (!user) {
      setSessions([]);
      setGithubToken('');
    } else {
      const cachedSessions = loadInitialSessions(newUserKey);
      setSessions(cachedSessions);
      
      const hashedTokenKey = EncryptionService.hashKey(`review_github_token_${newUserKey}`);
      const encryptedToken = localStorage.getItem(hashedTokenKey);
      setGithubToken(encryptedToken ? EncryptionService.decrypt(encryptedToken, newUserKey!) : '');
    }
  }

  // Cloud Sync Effect - Only Metadata
  useEffect(() => {
    const currentId = user?.email || user?.uid;
    if (!user || currentId === lastSyncedEmail) return;

    Promise.all([
      FirebaseService.getUserSessions(currentId!),
      FirebaseService.getGitHubToken(currentId!),
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
      setLastSyncedEmail(currentId!);
    })
    .catch((err) => {
      console.error(err);
      setLastSyncedEmail(currentId!);
    });
  }, [user?.uid, lastSyncedEmail]);

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
    if (!user || isLoadingSessions || !userKey) return;
    
    const hashedTokenKey = EncryptionService.hashKey(`review_github_token_${userKey}`);
    const hashedSessionsKey = EncryptionService.hashKey(`review_sessions_v2_${userKey}`);

    localStorage.setItem(hashedTokenKey, EncryptionService.encrypt(githubToken, userKey));
    localStorage.setItem(hashedSessionsKey, EncryptionService.encryptObject(sessions, userKey));

    const currentId = user.email || user.uid;
    FirebaseService.saveGitHubToken(currentId, githubToken).catch(console.error);
  }, [user, githubToken, sessions, isLoadingSessions, userKey]);

  // Specific Cloud Sync for the active session (including messages)
  useEffect(() => {
    if (!user || sessions.length === 0 || isLoadingSessions || !activeId) return;
    
    const current = sessions.find(s => s.id === activeId);
    // Only save if there are messages to save
    if (current && current.messages && current.messages.length > 0) {
        const currentId = user.email || user.uid;
        FirebaseService.saveSession(currentId, current).catch(console.error);
    }
  }, [sessions, activeId, user, isLoadingSessions]);

  return {
    user, setUser,
    githubToken, setGithubToken,
    sessions, setSessions,
    isLoadingSessions
  };
};
