import type { User as FirebaseUser } from 'firebase/auth';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { EndorseTokens as T } from '@/constants/EndorseTokens';
import { useAuth } from '@/context/AuthContext';
import { authErrorMessage } from '@/lib/authErrors';

// Closes the auth popup/redirect window on web once Google returns.
WebBrowser.maybeCompleteAuthSession();

/**
 * OAuth client IDs from Google Cloud (APIs & Services → Credentials).
 * Web: the "Web client" Firebase created when Google sign-in was enabled.
 */
const CLIENT_IDS = {
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
};

const NATIVE_READY =
  (Platform.OS === 'android' && !!CLIENT_IDS.androidClientId) || (Platform.OS === 'ios' && !!CLIENT_IDS.iosClientId);

const NOT_CONFIGURED =
  'Google sign-in isn’t set up for this device yet. Use email for now, or try again after the app update that enables it.';

interface GoogleSignInButtonProps {
  onSuccess: (user: FirebaseUser) => void;
  onError: (message: string) => void;
}

const GoogleIcon = () => (
  <Svg width="19" height="19" viewBox="0 0 18 18">
    <Path fill="#4285F4" d="M17.6 9.2c0-.6-.05-1.18-.16-1.74H9v3.3h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.66-3.88 2.66-6.54z" />
    <Path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.94v2.33A9 9 0 0 0 9 18z" />
    <Path fill="#FBBC05" d="M3.95 10.7a5.4 5.4 0 0 1 0-3.4V4.96H.94a9 9 0 0 0 0 8.08l3.01-2.34z" />
    <Path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.47.9 11.43 0 9 0A9 9 0 0 0 .94 4.96l3.01 2.34C4.66 5.17 6.65 3.58 9 3.58z" />
  </Svg>
);

function ButtonView({ onPress, busy, disabled }: { onPress: () => void; busy?: boolean; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={busy || disabled}
      accessibilityRole="button"
      accessibilityLabel="Continue with Google"
      accessibilityState={{ busy: !!busy, disabled: !!disabled }}
      style={({ pressed }) => [styles.button, (pressed || busy) && styles.pressed]}>
      {busy ? <ActivityIndicator color={T.colors.navyInk} /> : <GoogleIcon />}
      <Text style={styles.label}>Continue with Google</Text>
    </Pressable>
  );
}

/** Web: Firebase's own popup — no client IDs needed. */
function WebGoogleButton({ onSuccess, onError }: GoogleSignInButtonProps) {
  const { signInWithGooglePopup } = useAuth();
  const [busy, setBusy] = useState(false);
  const press = async () => {
    setBusy(true);
    try {
      onSuccess(await signInWithGooglePopup());
    } catch (error) {
      const message = authErrorMessage(error);
      if (message) onError(message);
    } finally {
      setBusy(false);
    }
  };
  return <ButtonView onPress={press} busy={busy} />;
}

/** iOS / Android: Google account chooser via expo-auth-session, then Firebase credential sign-in. */
function NativeGoogleButton({ onSuccess, onError }: GoogleSignInButtonProps) {
  const { signInWithGoogleIdToken } = useAuth();
  const [request, , promptAsync] = Google.useIdTokenAuthRequest(CLIENT_IDS);
  const [busy, setBusy] = useState(false);

  const press = async () => {
    setBusy(true);
    try {
      const result = await promptAsync();
      if (result.type !== 'success') {
        if (result.type === 'error') onError(result.error?.description ?? 'Google sign-in failed. Please try again.');
        return;
      }
      const idToken = result.params.id_token ?? result.authentication?.idToken;
      if (!idToken) throw new Error('Google didn’t return a sign-in token. Please try again.');
      onSuccess(await signInWithGoogleIdToken(idToken));
    } catch (error) {
      onError(authErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return <ButtonView onPress={press} busy={busy} disabled={!request} />;
}

export function GoogleSignInButton(props: GoogleSignInButtonProps) {
  if (Platform.OS === 'web') return <WebGoogleButton {...props} />;
  if (!NATIVE_READY) return <ButtonView onPress={() => props.onError(NOT_CONFIGURED)} />;
  return <NativeGoogleButton {...props} />;
}

const styles = StyleSheet.create({
  button: {
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: T.colors.fieldBorder,
    backgroundColor: T.colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  pressed: { opacity: 0.7 },
  label: { fontFamily: T.fonts.jakarta.semiBold, fontSize: 15, color: T.colors.navyInk },
});
