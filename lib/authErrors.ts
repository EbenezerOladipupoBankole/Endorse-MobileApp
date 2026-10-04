/** Turns Firebase Auth error codes into messages a person can act on. */
export function authErrorMessage(error: unknown): string {
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code: unknown }).code) : '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'That email and password don’t match an account.';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try logging in.';
    case 'auth/weak-password':
      return 'Choose a stronger password (at least 8 characters).';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a minute and try again.';
    case 'auth/network-request-failed':
      return 'No connection. Check your internet and try again.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return ''; // the user closed the Google window — not an error worth showing
    case 'auth/popup-blocked':
      return 'Your browser blocked the Google window. Allow pop-ups and try again.';
    case 'auth/account-exists-with-different-credential':
      return 'This email already uses a password. Log in with your password, then you can use Google next time.';
    case 'auth/unauthorized-domain':
      return 'This web address isn’t allowed for Google sign-in yet (Firebase → Authentication → Settings → Authorized domains).';
    case 'auth/operation-not-allowed':
      return 'This sign-in method isn’t enabled in Firebase yet (Authentication → Sign-in method).';
    default:
      return error instanceof Error && error.message ? error.message : 'Something went wrong. Please try again.';
  }
}
