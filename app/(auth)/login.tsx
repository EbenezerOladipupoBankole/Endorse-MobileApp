import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, KeyboardAvoidingView, ScrollView, Platform, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Svg, { Path, Circle } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EndorseTokens as T } from '../../constants/EndorseTokens';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { useAuth } from '@/context/AuthContext';
import { authErrorMessage } from '@/lib/authErrors';
import { mustVerifyEmail } from '@/lib/authPolicy';

// Icons
const BackIcon = () => (
  <Svg width="18" height="16" viewBox="0 0 18 16" fill="none">
    <Path d="M17 8H1M7 2 1 8l6 6" stroke="#1D3358" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const EyeIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 20 20" fill="none" color="#8494AB">
    <Path d="M1.5 10S4.5 4 10 4s8.5 6 8.5 6-3 6-8.5 6-8.5-6-8.5-6Z" stroke="currentColor" strokeWidth="1.6" />
    <Circle cx="10" cy="10" r="2.6" stroke="currentColor" strokeWidth="1.6" />
  </Svg>
);

const emailOK = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export default function LoginScreen() {
  const router = useRouter();
  
  // Prefilled when sign-up found an existing account for this email.
  const params = useLocalSearchParams<{ email?: string }>();
  const [li, setLi] = useState({ email: params.email ?? '', pass: '' });
  const [liT, setLiT] = useState<Record<string, boolean>>({});
  const [liSubmit, setLiSubmit] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');
  const { signIn, resetPassword } = useAuth();

  const liErr = {
    email: !li.email.trim() ? 'Email is required' : !emailOK(li.email) ? 'Enter a valid email address' : '',
    pass: !li.pass ? 'Enter your password' : '',
  };

  const showLi = (f: 'email' | 'pass') => (liSubmit || liT[f]) ? liErr[f] : '';

  const submitLogin = async () => {
    setLiSubmit(true);
    setAuthError('');
    if (liErr.email || liErr.pass) return;
    setSubmitting(true);
    try {
      const user = await signIn(li.email, li.pass);
      if (!mustVerifyEmail(user.emailVerified)) {
        router.replace({ pathname: '/(auth)/success', params: { from: 'login' } });
      } else {
        // Accounts must confirm their email before using the app.
        router.replace({ pathname: '/(auth)/otp', params: { email: user.email ?? li.email } });
      }
    } catch (error) {
      setAuthError(authErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgot = async () => {
    if (!emailOK(li.email)) {
      setLiT({ ...liT, email: true });
      setAuthError('Enter your email above, then tap “Forgot?” again.');
      return;
    }
    try {
      await resetPassword(li.email);
      Alert.alert('Check your inbox', `We sent a password reset link to ${li.email.trim()}.`);
    } catch (error) {
      setAuthError(authErrorMessage(error));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <BackIcon />
          </Pressable>

          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to pick up right where you left off.</Text>

          <View style={styles.socialContainer}>
            <GoogleSignInButton
              onSuccess={() => router.replace({ pathname: '/(auth)/success', params: { from: 'login' } })}
              onError={setAuthError}
            />
          </View>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>


          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, { borderColor: showLi('email') ? T.colors.errBorder : T.colors.fieldBorder }]}
            value={li.email}
            onChangeText={(text) => setLi({ ...li, email: text })}
            onBlur={() => setLiT({ ...liT, email: true })}
            placeholder="you@email.com"
            placeholderTextColor="#9AA7BC"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{showLi('email')}</Text>
          </View>

          <View style={styles.pwHeader}>
            <Text style={styles.label}>Password</Text>
            <Pressable hitSlop={10} onPress={handleForgot} accessibilityRole="button">
              <Text style={styles.forgotText}>Forgot?</Text>
            </Pressable>
          </View>
          <View style={styles.pwContainer}>
            <TextInput
              style={[styles.input, { paddingRight: 48, borderColor: showLi('pass') ? T.colors.errBorder : T.colors.fieldBorder }]}
              value={li.pass}
              onChangeText={(text) => setLi({ ...li, pass: text })}
              onBlur={() => setLiT({ ...liT, pass: true })}
              placeholder="Your password"
              placeholderTextColor="#9AA7BC"
              secureTextEntry={!showPw}
            />
            <Pressable style={styles.eyeBtn} onPress={() => setShowPw(!showPw)}>
              <EyeIcon />
            </Pressable>
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{showLi('pass')}</Text>
          </View>

          {authError ? (
            <View style={styles.errorContainer} accessibilityLiveRegion="polite">
              <Text style={styles.errorText}>{authError}</Text>
            </View>
          ) : null}

          <Pressable style={styles.primaryBtn} onPress={submitLogin} disabled={submitting}>
            <Text style={styles.primaryBtnText}>{submitting ? 'Signing in…' : 'Log in'}</Text>
          </Pressable>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>
              New here?{' '}
              <Text style={styles.footerLink} onPress={() => router.push('/(auth)/signup')}>
                Create an account
              </Text>
            </Text>
          </View>
          
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.colors.cloud },
  scrollContent: { paddingHorizontal: 26, paddingTop: 6, paddingBottom: 34 },
  backButton: { width: 42, height: 42, borderRadius: 12, borderWidth: 1, borderColor: T.colors.border, backgroundColor: T.colors.white, alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  title: { fontFamily: T.fonts.sora.semiBold, fontSize: 28, color: T.colors.ink, marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontFamily: T.fonts.jakarta.regular, fontSize: 15, color: T.colors.inkSoft, marginBottom: 24, lineHeight: 22.5 },
  socialContainer: { gap: 11, marginBottom: 22 },
  socialBtn: { height: 54, borderWidth: 1, borderColor: T.colors.border, borderRadius: 14, backgroundColor: T.colors.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 11 },
  socialBtnText: { fontFamily: T.fonts.jakarta.semiBold, fontSize: 15, color: T.colors.ink },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: T.colors.border },
  dividerText: { fontFamily: T.fonts.jakarta.medium, fontSize: 12.5, color: '#90A0B8' },
  label: { fontFamily: T.fonts.jakarta.semiBold, fontSize: 13, color: T.colors.label, marginBottom: 7 },
  input: { width: '100%', height: 52, paddingHorizontal: 16, borderRadius: 13, borderWidth: 1.5, backgroundColor: T.colors.white, fontFamily: T.fonts.jakarta.regular, fontSize: 15, color: T.colors.ink },
  errorContainer: { minHeight: 18, paddingTop: 4, paddingHorizontal: 2 },
  errorText: { fontFamily: T.fonts.jakarta.medium, fontSize: 12.5, color: T.colors.error },
  pwHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 6, marginBottom: 7 },
  forgotText: { fontFamily: T.fonts.jakarta.semiBold, fontSize: 12.5, color: T.colors.blue },
  pwContainer: { position: 'relative' },
  eyeBtn: { position: 'absolute', right: 6, top: 6, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  primaryBtn: { width: '100%', height: 56, marginTop: 12, borderRadius: 15, backgroundColor: T.colors.yellow, alignItems: 'center', justifyContent: 'center', shadowColor: '#F8D12D', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.32, shadowRadius: 24, elevation: 5 },
  primaryBtnText: { fontFamily: T.fonts.jakarta.bold, fontSize: 16, color: T.colors.navyInk },
  footerContainer: { alignItems: 'center', marginTop: 22 },
  footerText: { fontFamily: T.fonts.jakarta.regular, fontSize: 14, color: T.colors.inkSoft },
  footerLink: { fontFamily: T.fonts.jakarta.bold, color: T.colors.blue },
});
