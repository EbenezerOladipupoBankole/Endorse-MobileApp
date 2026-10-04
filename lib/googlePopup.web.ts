import type { Auth, User } from 'firebase/auth';

/*
 * Web only. The app's TypeScript config points `firebase/auth` at the React
 * Native typings, which don't include popup sign-in, so these come in untyped
 * and are given their real signatures here.
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const firebaseAuth = require('firebase/auth') as {
  GoogleAuthProvider: new () => { setCustomParameters: (params: Record<string, string>) => void };
  signInWithPopup: (auth: Auth, provider: unknown) => Promise<{ user: User }>;
};

/** Opens Google's account chooser in a popup and signs into Firebase. */
export async function googlePopupSignIn(auth: Auth): Promise<User> {
  const provider = new firebaseAuth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const { user } = await firebaseAuth.signInWithPopup(auth, provider);
  return user;
}
