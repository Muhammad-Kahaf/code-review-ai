import { useState, useEffect, useRef } from 'react';
import type { User, ChatSession } from '../types';
import { EncryptionService } from '../services/encryptionService';
import { FirebaseService } from '../services/firebaseService';

const getEmailKey = (user: User | null) => user ? user.email.replace(/[.@]/g, '_') : '';

const loadInitialSessions = (emailKey: string): ChatSession[] => {
  if (!emailKey) return []; // Guests have no persistent sessions

  try {
    const hashedKey = EncryptionService.hashKey(`review_sessions_v2_${emailKey}`);
    const encryptedSaved = localStorage.getItem(hashedKey);
    if (encryptedSaved) {
      const decrypted = EncryptionService.decryptObject<ChatSession[]>(encryptedSaved, emailKey);
      if (Array.isArray(decrypted)) return decrypted;
    }
  } catch (err) {
    console.warn('Failed to load local sessions:', err);
  }

  return [];
};

export const usePersistence = () => {
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
    if (!emailKey) return '';
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
    if (!newUser) {
      setLastSyncedEmail(null);
      setSessions([]); // Clear sessions on logout / guest
    }
    setUserInternal(newUser);
  };

  const prevUserRef = useRef<User | null>(user);
  useEffect(() => {
    if (user?.email !== prevUserRef.current?.email) {
      prevUserRef.current = user;
      const newEmailKey = getEmailKey(user);
      
      const cachedSessions = loadInitialSessions(newEmailKey);
      setSessions(cachedSessions);
      
      if (newEmailKey) {
        try {
          const hashedTokenKey = EncryptionService.hashKey(`review_github_token_${newEmailKey}`);
          const encryptedToken = localStorage.getItem(hashedTokenKey);
          setGithubToken(encryptedToken ? EncryptionService.decrypt(encryptedToken, newEmailKey) : '');
        } catch {
          setGithubToken('');
        }
      } else {
        setGithubToken('');
      }
    }
  }, [user]);

  // Cloud Sync Effect for Logged-In Users
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

      // Auto-upload any local sessions with messages to Firestore for cross-device sync
      const cached = loadInitialSessions(getEmailKey(user));
      cached.forEach(localS => {
        if (localS.messages && localS.messages.length > 0) {
          FirebaseService.saveSession(user.email, localS).catch(console.warn);
        }
      });
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

  // Local Storage & Cloud persistence ONLY FOR LOGGED-IN USERS
  useEffect(() => {
    if (!user) return; // Do NOT persist guest session in localStorage!

    try {
      const key = getEmailKey(user);
      const hashedTokenKey = EncryptionService.hashKey(`review_github_token_${key}`);
      const hashedSessionsKey = EncryptionService.hashKey(`review_sessions_v2_${key}`);

      if (githubToken) {
        localStorage.setItem(hashedTokenKey, EncryptionService.encrypt(githubToken, key));
        FirebaseService.saveGitHubToken(user.email, githubToken).catch(console.error);
      }
      
      localStorage.setItem(hashedSessionsKey, EncryptionService.encryptObject(sessions, key));

      // Sync active session messages to Firestore
      sessions.forEach(session => {
        if (session.messages && session.messages.length > 0) {
          FirebaseService.saveSession(user.email, session).catch(err => {
            console.warn("Auto-sync session to Firebase failed:", err);
          });
        }
      });
    } catch (err) {
      console.warn("Failed to persist sessions for logged-in user:", err);
    }
  }, [user, githubToken, sessions]);

  return {
    user, setUser,
    githubToken, setGithubToken,
    sessions, setSessions,
    isLoadingSessions
  };
};
