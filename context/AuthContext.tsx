import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithCredential,
  signOut,
  User as FirebaseUser,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { googlePopupSignIn } from '../lib/googlePopup';

export interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  country: string;
  createdAt: number;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  /** True until Firebase has restored (or ruled out) a session. */
  loading: boolean;
  /** Mirrors user.emailVerified, refreshed by `refreshUser()`. */
  emailVerified: boolean;
  signIn: (email: string, password: string) => Promise<FirebaseUser>;
  signUp: (email: string, password: string, firstName: string, lastName: string, country?: string) => Promise<void>;
  /** Web: Google account chooser popup. */
  signInWithGooglePopup: () => Promise<FirebaseUser>;
  /** Native: exchange a Google ID token (from expo-auth-session) for a Firebase session. */
  signInWithGoogleIdToken: (idToken: string) => Promise<FirebaseUser>;
  logout: () => Promise<void>;
  sendVerification: () => Promise<void>;
  /** Reloads the Firebase user (e.g. after clicking the verification link). Returns the new verified state. */
  refreshUser: () => Promise<boolean>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function profileFrom(firebaseUser: FirebaseUser, firstName?: string, lastName?: string): UserProfile {
  const [first = '', ...rest] = (firebaseUser.displayName ?? '').split(' ');
  return {
    uid: firebaseUser.uid,
    email: (firebaseUser.email ?? '').toLowerCase(),
    firstName: firstName ?? first,
    lastName: lastName ?? rest.join(' '),
    country: '',
    createdAt: Date.now(),
  };
}

/**
 * Keeps `onChange` in sync with the user's profile, creating it when missing
 * (first Google sign-in, or a sign-up whose profile write failed). Firestore
 * re-delivers the document once it reconnects, so an offline start recovers
 * on its own. Returns the unsubscribe function.
 */
function watchProfile(firebaseUser: FirebaseUser, onChange: (profile: UserProfile | null) => void) {
  const ref = doc(db, 'users', firebaseUser.uid);
  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        onChange(snap.data() as UserProfile);
      } else if (!snap.metadata.fromCache) {
        // Only the server can say the profile is really missing; an offline cache miss can't.
        setDoc(ref, profileFrom(firebaseUser)).catch((error) => console.warn('Profile create failed', error));
      }
    },
    (error) => console.error('Error loading user profile:', error),
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      unsubscribeProfile?.();
      unsubscribeProfile = undefined;
      setUser(firebaseUser);
      setEmailVerified(!!firebaseUser?.emailVerified);
      setProfile(null);
      // Screens fall back to the auth user's name until the profile arrives.
      if (firebaseUser) unsubscribeProfile = watchProfile(firebaseUser, setProfile);
      setLoading(false);
    });
    return () => {
      unsubscribeProfile?.();
      unsubscribeAuth();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
    return credential.user;
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, firstName: string, lastName: string, country = '') => {
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email.trim(), password);

      // Once the account exists nothing below may fail the sign-up; otherwise a retry
      // would report "email already in use" for an account the user never finished.
      const displayName = [firstName, lastName].filter(Boolean).join(' ');
      await updateProfile(firebaseUser, { displayName }).catch(() => {});
      // Firebase sends the verification link with its default template.
      await sendEmailVerification(firebaseUser).catch((e) => console.warn('Verification email failed', e));

      const profileData: UserProfile = { ...profileFrom(firebaseUser, firstName, lastName), country };
      try {
        await setDoc(doc(db, 'users', firebaseUser.uid), profileData);
        setProfile(profileData);
      } catch (error) {
        // Recreated by watchProfile once the server confirms it's missing.
        console.warn('Profile save failed', error);
      }
    },
    [],
  );

  const signInWithGooglePopup = useCallback(() => googlePopupSignIn(auth), []);

  const signInWithGoogleIdToken = useCallback(async (idToken: string) => {
    const { user: firebaseUser } = await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
    return firebaseUser;
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  const sendVerification = useCallback(async () => {
    if (!auth.currentUser) throw new Error('You need to be signed in');
    await sendEmailVerification(auth.currentUser);
  }, []);

  const refreshUser = useCallback(async () => {
    const current = auth.currentUser;
    if (!current) return false;
    await current.reload();
    // Force a fresh ID token so Firestore rules see email_verified = true.
    if (current.emailVerified) await current.getIdToken(true);
    setEmailVerified(current.emailVerified);
    return current.emailVerified;
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      emailVerified,
      signIn,
      signUp,
      signInWithGooglePopup,
      signInWithGoogleIdToken,
      logout,
      sendVerification,
      refreshUser,
      resetPassword,
    }),
    [user, profile, loading, emailVerified, signIn, signUp, signInWithGooglePopup, signInWithGoogleIdToken, logout, sendVerification, refreshUser, resetPassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
