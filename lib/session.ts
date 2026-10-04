import { auth } from '@/lib/firebase';

export interface SessionUser {
  uid: string;
  /** Lower-cased, as stored in `recipientEmails`. */
  email: string;
  /** Exactly as in the auth token (not lower-cased). */
  authEmail: string;
  name: string;
  emailVerified: boolean;
}

/** The signed-in user for data-layer calls; throws when signed out. */
export function requireUser(): SessionUser {
  const user = auth.currentUser;
  if (!user) throw new Error('You need to be signed in.');
  const email = (user.email ?? '').toLowerCase();
  return {
    uid: user.uid,
    email,
    authEmail: user.email ?? '',
    name: user.displayName || email.split('@')[0] || 'You',
    emailVerified: user.emailVerified,
  };
}
