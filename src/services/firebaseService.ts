import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  orderBy, 
  deleteDoc, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { ChatSession, User } from '../types';

/**
 * Removes any undefined properties since Firestore strictly rejects undefined.
 */
const sanitizeForFirestore = (obj: any): any => {
  if (!obj || typeof obj !== 'object') return obj;
  const clean: any = Array.isArray(obj) ? [] : {};
  
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !(value instanceof Timestamp)) {
        clean[key] = sanitizeForFirestore(value);
      } else {
        clean[key] = value;
      }
    }
  }
  return clean;
};

/**
 * PRODUCTION-GRADE FIREBASE SERVICE
 * Handles real-time cloud sync with sanitized data.
 */
export const FirebaseService = {
  /**
   * Syncs user profile metadata to Firestore
   */
  upsertUser: async (user: User) => {
    if (!db) return;
    try {
      const userRef = doc(db, 'users', user.email);
      await setDoc(userRef, sanitizeForFirestore({
        name: user.name || 'User',
        email: user.email,
        avatar: user.avatar || '',
        lastLogin: Timestamp.now()
      }), { merge: true });
    } catch (err) {
      console.warn("Firestore upsertUser skipped:", err);
    }
  },

  /**
   * Saves or updates a chat session metadata and its messages
   */
  saveSession: async (userEmail: string, session: ChatSession) => {
    if (!db) return;
    try {
      const sessionRef = doc(db, 'users', userEmail, 'sessions', session.id);
      
      // 1. Save sanitized metadata
      const metadata = sanitizeForFirestore({
        id: session.id,
        title: session.title || 'Code Review',
        focusModes: session.focusModes || [],
        createdAt: session.createdAt || Date.now(),
        updatedAt: Timestamp.now()
      });
      await setDoc(sessionRef, metadata, { merge: true });

      // 2. Save sanitized messages to sub-collection
      if (session.messages && session.messages.length > 0) {
        const messagesRef = collection(db, 'users', userEmail, 'sessions', session.id, 'messages');
        const promises = session.messages.map((msg, index) => {
          const msgId = msg.id || `msg_${index}_${Date.now()}`;
          const cleanMsg = sanitizeForFirestore({
            id: msgId,
            role: msg.role,
            content: msg.content || '',
            ...(msg.code ? { code: msg.code } : {}),
            timestamp: msg.timestamp || new Date().toLocaleTimeString(),
            createdAt: msg.createdAt || Date.now()
          });
          return setDoc(doc(messagesRef, msgId), cleanMsg, { merge: true });
        });
        await Promise.all(promises);
      }
      console.log(`[Firestore] Session ${session.id} synced to cloud.`);
    } catch (err) {
      console.error("[Firestore] saveSession error:", err);
    }
  },

  /**
   * Fetches only metadata for all sessions (Lightweight for sidebar)
   */
  getUserSessions: async (userEmail: string): Promise<ChatSession[]> => {
    if (!db) return [];
    try {
      const sessionsRef = collection(db, 'users', userEmail, 'sessions');
      const q = query(sessionsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: data.id as string,
          title: (data.title as string) || 'Code Review',
          messages: [],
          focusModes: (data.focusModes as string[]) || [],
          createdAt: Number(data.createdAt) || Date.now()
        } as ChatSession;
      });
    } catch (err) {
      console.warn("Firestore getUserSessions skipped:", err);
      return [];
    }
  },

  /**
   * Fetches specific messages for a session (On-demand loading)
   */
  getSessionMessages: async (userEmail: string, sessionId: string): Promise<import('../types').Message[]> => {
    if (!db) return [];
    try {
      const messagesRef = collection(db, 'users', userEmail, 'sessions', sessionId, 'messages');
      const q = query(messagesRef, orderBy('createdAt', 'asc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(d => {
        const data = d.data();
        return {
          id: data.id,
          role: data.role,
          content: data.content,
          code: data.code,
          timestamp: data.timestamp,
          createdAt: data.createdAt
        } as import('../types').Message;
      });
    } catch (err) {
      console.warn("Firestore getSessionMessages skipped:", err);
      return [];
    }
  },

  /**
   * Deletes a specific session
   */
  deleteSession: async (userEmail: string, sessionId: string) => {
    if (!db) return;
    try {
      const sessionRef = doc(db, 'users', userEmail, 'sessions', sessionId);
      await deleteDoc(sessionRef);
    } catch (err) {
      console.warn("Firestore deleteSession skipped:", err);
    }
  },

  /**
   * Saves GitHub token
   */
  saveGitHubToken: async (userEmail: string, token: string) => {
    if (!db) return;
    try {
      const tokenRef = doc(db, 'users', userEmail, 'secrets', 'github');
      await setDoc(tokenRef, { token });
    } catch (err) {
      console.warn("Firestore saveGitHubToken skipped:", err);
    }
  },

  /**
   * Fetches GitHub token
   */
  getGitHubToken: async (userEmail: string): Promise<string | null> => {
    if (!db) return null;
    try {
      const tokenRef = doc(db, 'users', userEmail, 'secrets', 'github');
      const docSnap = await getDoc(tokenRef);
      return docSnap.exists() ? docSnap.data().token : null;
    } catch (err) {
      console.warn("Firestore getGitHubToken skipped:", err);
      return null;
    }
  }
};
