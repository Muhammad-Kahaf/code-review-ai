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
 * Handles all database operations with Firestore.
 */
export const FirebaseService = {
  /**
   * Syncs user profile metadata to Firestore
   */
  upsertUser: async (user: User) => {
    const userRef = doc(db, 'users', user.email);
    await setDoc(userRef, {
      ...user,
      lastLogin: Timestamp.now()
    }, { merge: true });
  },

  /**
   * Saves or updates a chat session metadata and its messages
   */
  saveSession: async (userEmail: string, session: ChatSession) => {
    const sessionRef = doc(db, 'users', userEmail, 'sessions', session.id);
    
    // 1. Save metadata (Exclude messages array from the main document document)
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
  },

  /**
   * Fetches only metadata for all sessions (Lightweight for sidebar)
   */
  getUserSessions: async (userEmail: string): Promise<ChatSession[]> => {
    const sessionsRef = collection(db, 'users', userEmail, 'sessions');
    const q = query(sessionsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: data.id as string,
        title: data.title as string,
        messages: [], // Initially empty, loaded on demand
        focusModes: (data.focusModes as string[]) || [],
        createdAt: data.createdAt as number
      } as ChatSession;
    });
  },

  /**
   * Fetches specific messages for a session (On-demand loading)
   */
  getSessionMessages: async (userEmail: string, sessionId: string): Promise<import('../types').Message[]> => {
    const messagesRef = collection(db, 'users', userEmail, 'sessions', sessionId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(d => d.data() as import('../types').Message);
  },

  /**
   * Deletes a specific session
   */
  deleteSession: async (userEmail: string, sessionId: string) => {
    const sessionRef = doc(db, 'users', userEmail, 'sessions', sessionId);
    await deleteDoc(sessionRef);
  },

  /**
   * Saves GitHub token (Encrypted in transit by Firebase SSL)
   */
  saveGitHubToken: async (userEmail: string, token: string) => {
    const tokenRef = doc(db, 'users', userEmail, 'secrets', 'github');
    await setDoc(tokenRef, { token });
  },

  /**
   * Fetches GitHub token
   */
  getGitHubToken: async (userEmail: string): Promise<string | null> => {
    const tokenRef = doc(db, 'users', userEmail, 'secrets', 'github');
    const docSnap = await getDoc(tokenRef);
    return docSnap.exists() ? docSnap.data().token : null;
  }
};
