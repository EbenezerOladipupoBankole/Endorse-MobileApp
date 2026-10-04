import type { Auth, User } from 'firebase/auth';

/** Native stub: phones sign in with Google through expo-auth-session instead (see GoogleSignInButton). */
export async function googlePopupSignIn(_auth: Auth): Promise<User> {
  throw new Error('Popup sign-in is only available on the web.');
}
