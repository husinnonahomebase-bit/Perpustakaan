import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  getDocFromServer,
  deleteDoc,
  onSnapshot,
  query,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Book, Transaction, UserSession } from '../types';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  throw new Error(JSON.stringify(errInfo));
}

// Test Firestore connection safely
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      return false;
    }
    return true;
  }
}

// Sync user profile to Firestore
export async function syncUserProfileToFirestore(user: UserSession): Promise<void> {
  if (!user || !user.uid) return;
  const userPath = `users/${user.uid}`;
  try {
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(
      userDocRef,
      {
        userId: user.uid,
        email: user.email || '',
        displayName: user.name || 'Lumina Patron',
        photoURL: user.avatar || '',
        role: user.role || 'student',
        memberCode: user.memberCode || 'LMN-PATRON',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.WRITE, userPath);
    } catch {
      // Handled gracefully
    }
  }
}

// Add user bookmark
export async function addFirestoreBookmark(userId: string, book: Book): Promise<void> {
  if (!userId || !book) return;
  const path = `users/${userId}/bookmarks/${book.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'bookmarks', book.id), {
      bookId: book.id,
      title: book.title,
      author: book.author,
      coverImage: book.coverImage || '',
      savedAt: new Date().toISOString(),
    });
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.WRITE, path);
    } catch {
      // Handled
    }
  }
}

// Remove user bookmark
export async function removeFirestoreBookmark(userId: string, bookId: string): Promise<void> {
  if (!userId || !bookId) return;
  const path = `users/${userId}/bookmarks/${bookId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'bookmarks', bookId));
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.DELETE, path);
    } catch {
      // Handled
    }
  }
}

// Fetch user bookmarks
export async function getFirestoreBookmarks(userId: string): Promise<string[]> {
  if (!userId) return [];
  const path = `users/${userId}/bookmarks`;
  try {
    const snap = await getDocs(collection(db, 'users', userId, 'bookmarks'));
    return snap.docs.map((d) => d.id);
  } catch (error) {
    return [];
  }
}

export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.addScope('https://www.googleapis.com/auth/drive');
googleAuthProvider.addScope('https://www.googleapis.com/auth/drive.file');
googleAuthProvider.addScope('https://www.googleapis.com/auth/drive.readonly');
googleAuthProvider.addScope('https://www.googleapis.com/auth/spreadsheets');
googleAuthProvider.addScope('https://www.googleapis.com/auth/spreadsheets.readonly');
googleAuthProvider.addScope('https://www.googleapis.com/auth/gmail.send');
googleAuthProvider.addScope('https://www.googleapis.com/auth/gmail.readonly');
googleAuthProvider.addScope('https://www.googleapis.com/auth/gmail.compose');
googleAuthProvider.addScope('https://mail.google.com/');

let isSigningIn = false;
let cachedAccessToken: string | null = null;
let cachedIdToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, accessToken: string | null, idToken: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      try {
        const idToken = await user.getIdToken();
        cachedIdToken = idToken;
        if (onAuthSuccess) {
          onAuthSuccess(user, cachedAccessToken, idToken);
        }
      } catch {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken, null);
      }
    } else {
      cachedAccessToken = null;
      cachedIdToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const signInWithGoogle = async (): Promise<{ user: User; accessToken: string | null; idToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleAuthProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    cachedAccessToken = credential?.accessToken || null;
    const idToken = await result.user.getIdToken(true);
    cachedIdToken = idToken;
    return { user: result.user, accessToken: cachedAccessToken, idToken };
  } catch (error: any) {
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getCachedAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const getCachedIdToken = async (): Promise<string | null> => {
  if (auth.currentUser) {
    cachedIdToken = await auth.currentUser.getIdToken();
  }
  return cachedIdToken;
};

export const signOutUser = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  cachedIdToken = null;
};
