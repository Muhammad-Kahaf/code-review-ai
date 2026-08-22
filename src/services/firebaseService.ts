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
 * PRODUCTION-GRADE FIREBASE SERVICE
 * Handles database operations with graceful offline/local fallback.
 */
export const FirebaseService = {
  /**
   * Syncs user profile metadata to Firestore
   */
  upsertUser: async (user: User) => {
    if (!db) return;
    try {
      const userRef = doc(db, 'users', user.email);
      await setDoc(userRef, {
        ...user,
        lastLogin: Timestamp.now()
      }, { merge: true });
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
      
      // 1. Save metadata
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { messages, ...metadata } = session;
      await setDoc(sessionRef, {
        ...metadata,
        updatedAt: Timestamp.now()
      }, { merge: true });

      // 2. Save messages to sub-collection
      if (session.messages && session.messages.length > 0) {
        const messagesRef = collection(db, 'users', userEmail, 'sessions', session.id, 'messages');
        const promises = session.messages.map((msg, index) => {
          const msgId = msg.id || `msg_${index}_${msg.timestamp.replace(/[: ]/g, '_')}`;
          return setDoc(doc(messagesRef, msgId), msg, { merge: true });
        });
        await Promise.all(promises);
      }
    } catch (err) {
      console.warn("Firestore saveSession skipped:", err);
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
          title: data.title as string,
          messages: [],
          focusModes: (data.focusModes as string[]) || [],
          createdAt: data.createdAt as number
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
      
      return querySnapshot.docs.map(d => d.data() as import('../types').Message);
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
