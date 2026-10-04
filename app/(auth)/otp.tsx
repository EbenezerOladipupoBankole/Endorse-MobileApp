import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Svg, { Path, Rect } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EndorseTokens as T } from '../../constants/EndorseTokens';
import { useAuth } from '@/context/AuthContext';
import { authErrorMessage } from '@/lib/authErrors';

const RESEND_COOLDOWN = 30;

const MailIcon = () => (
  <Svg width="26" height="26" viewBox="0 0 24 24" fill="none">
    <Rect x="2.5" y="5" width="19" height="14" rx="2.5" stroke={T.colors.blue} strokeWidth="1.8" />
    <Path d="M3 7l9 6 9-6" stroke={T.colors.blue} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

/**
 * "Check your inbox" — Firebase emails a verification link on sign-up.
 * The user confirms here once they've clicked it. (Route kept as /otp.)
 */
export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const { user, refreshUser, sendVerification, logout } = useAuth();
  const email = user?.email ?? emailParam ?? 'your email';

  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [resendIn, setResendIn] = useState(RESEND_COOLDOWN);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const handleVerified = async () => {
    setError('');
    setNotice('');
    setChecking(true);
    try {
      const verified = await refreshUser();
      if (verified) router.replace('/(auth)/signature');
      else setError('We haven’t seen the confirmation yet. Open the link in the email, then try again.');
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    setError('');
    try {
      await sendVerification();
      setNotice(`We sent a new link to ${email}.`);
      setResendIn(RESEND_COOLDOWN);
    } catch (e) {
      setError(authErrorMessage(e));
    }
  };

  const useAnotherAccount = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.iconChip}>
          <MailIcon />
        </View>

        <Text style={styles.title} accessibilityRole="header">
          Verify your email
        </Text>
        <Text style={styles.subtitle}>
          We sent a verification link to <Text style={styles.subtitleEmail}>{email}</Text>. Open it on any device, then come back
          and continue.
        </Text>

        <View style={styles.tipCard}>
          <Text style={styles.tipText}>Can’t find it? Check your spam or promotions folder. The link expires after a while, so request a new one if needed.</Text>
        </View>

        {error ? (
          <Text style={styles.errorText} accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}
        {notice ? (
          <Text style={styles.noticeText} accessibilityLiveRegion="polite">
            {notice}
          </Text>
        ) : null}

        <Pressable
          style={[styles.primaryButton, checking && styles.busy]}
          onPress={handleVerified}
          disabled={checking}
          accessibilityRole="button"
          accessibilityState={{ busy: checking }}>
          {checking ? <ActivityIndicator color={T.colors.navyInk} /> : <Text style={styles.primaryButtonText}>I’ve verified my email</Text>}
        </Pressable>

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>{resendIn > 0 ? `Resend available in ${resendIn}s` : 'Didn’t get it? '}</Text>
          {resendIn <= 0 ? (
            <Pressable onPress={handleResend} hitSlop={10} accessibilityRole="button">
              <Text style={styles.resendLink}>Resend link</Text>
            </Pressable>
          ) : null}
        </View>

        <Pressable onPress={useAnotherAccount} hitSlop={10} style={styles.switchAccount} accessibilityRole="button">
          <Text style={styles.switchAccountText}>Use a different account</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.colors.cloud },
  scrollContent: { paddingHorizontal: 26, paddingTop: 48, paddingBottom: 34 },
  iconChip: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: T.colors.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: { fontFamily: T.fonts.sora.semiBold, fontSize: 28, color: T.colors.ink, marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontFamily: T.fonts.jakarta.regular, fontSize: 15, color: T.colors.inkSoft, marginBottom: 20, lineHeight: 22.5 },
  subtitleEmail: { fontFamily: T.fonts.jakarta.semiBold, color: T.colors.ink },
  tipCard: { backgroundColor: T.colors.blueSoft, borderRadius: 14, padding: 14, marginBottom: 20 },
  tipText: { fontFamily: T.fonts.jakarta.medium, fontSize: 13, color: T.colors.label, lineHeight: 19 },
  errorText: { fontFamily: T.fonts.jakarta.medium, fontSize: 13, color: T.colors.error, marginBottom: 12, lineHeight: 19 },
  noticeText: { fontFamily: T.fonts.jakarta.medium, fontSize: 13, color: T.colors.blue, marginBottom: 12 },
  primaryButton: {
    height: 56,
    borderRadius: 15,
    backgroundColor: T.colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: T.colors.yellow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.32,
    shadowRadius: 24,
    elevation: 5,
  },
  busy: { opacity: 0.7 },
  primaryButtonText: { fontFamily: T.fonts.jakarta.bold, fontSize: 16, color: T.colors.navyInk },
  resendContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 22, minHeight: 44 },
  resendText: { fontFamily: T.fonts.jakarta.regular, fontSize: 14, color: T.colors.inkSoft },
  resendLink: { fontFamily: T.fonts.jakarta.semiBold, fontSize: 14, color: T.colors.blue },
  switchAccount: { alignSelf: 'center', marginTop: 4, minHeight: 44, justifyContent: 'center' },
  switchAccountText: { fontFamily: T.fonts.jakarta.semiBold, fontSize: 14, color: T.colors.inkSoft },
});
