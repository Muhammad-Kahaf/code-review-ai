import { useState, useEffect } from 'react';
import type { User, ChatSession } from '../types';
import { EncryptionService } from '../services/encryptionService';
import { FirebaseService } from '../services/firebaseService';

/**
 * PURE CLOUD PERSISTENCE HOOK
 * All sessions & review histories are stored and fetched 100% directly from Firebase Firestore.
 * Zero session data stored in localStorage.
 */
export const usePersistence = () => {
  // Remember logged-in user profile across reloads
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

  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [githubToken, setGithubToken] = useState('');
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  const setUser = (newUser: User | null) => {
    if (!newUser) {
      setSessions([]);
      setGithubToken('');
    }
    setUserInternal(newUser);
  };

  // 1. Direct Cloud Fetch on Login / Initial Load
  useEffect(() => {
    if (!user) {
      setSessions([]);
      setGithubToken('');
      setIsLoadingSessions(false);
      return;
    }

    setIsLoadingSessions(true);
    Promise.all([
      FirebaseService.getUserSessions(user.email),
      FirebaseService.getGitHubToken(user.email),
      FirebaseService.upsertUser(user)
    ])
      .then(([cloudSessions, cloudToken]) => {
        setSessions(cloudSessions || []);
        if (cloudToken) setGithubToken(cloudToken);
      })
      .catch((err) => {
        console.error("Firestore initial fetch error:", err);
      })
      .finally(() => {
        setIsLoadingSessions(false);
      });
  }, [user?.email]);

  // 2. Persist User Auth token to localStorage
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

  // 3. Direct Cloud Sync for GitHub Token
  useEffect(() => {
    if (user && githubToken) {
      FirebaseService.saveGitHubToken(user.email, githubToken).catch(console.error);
    }
  }, [user, githubToken]);

  return {
    user,
    setUser,
    githubToken,
    setGithubToken,
    sessions,
    setSessions,
    isLoadingSessions
  };
};
