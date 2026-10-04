/**
 * Whether an account must verify its email before using the app.
 *
 * Release builds always require it. Development builds (Expo Go / `expo start`)
 * skip it so test accounts work without access to a real inbox. Documents sent
 * *to* an email still require verification either way (enforced by firestore.rules).
 */
export const REQUIRE_VERIFIED_EMAIL = !__DEV__;

export function mustVerifyEmail(emailVerified: boolean): boolean {
  return REQUIRE_VERIFIED_EMAIL && !emailVerified;
}
