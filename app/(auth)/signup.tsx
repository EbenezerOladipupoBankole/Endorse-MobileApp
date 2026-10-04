import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, KeyboardAvoidingView, ScrollView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
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
const CheckIcon = () => (
  <Svg width="13" height="10" viewBox="0 0 13 10" fill="none">
    <Path d="M1 5l4 4 7-8" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);


const emailOK = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export default function SignupScreen() {
  const router = useRouter();
  
  const [su, setSu] = useState({ name: '', email: '', pass: '', terms: false });
  const [suT, setSuT] = useState<Record<string, boolean>>({});
  const [suSubmit, setSuSubmit] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');
  const { signUp } = useAuth();

  const suErr = {
    name: !su.name.trim() ? 'Please enter your name' : '',
    email: !su.email.trim() ? 'Email is required' : !emailOK(su.email) ? 'Enter a valid email address' : '',
    pass: su.pass.length < 8 ? 'Use at least 8 characters' : '',
    terms: !su.terms ? 'Please accept the terms to continue' : '',
  };

  const showSu = (f: 'name' | 'email' | 'pass' | 'terms') => (suSubmit || suT[f]) ? suErr[f] : '';

  const getStrength = (p: string) => {
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
    if (/\d/.test(p) || /[^A-Za-z0-9]/.test(p)) s++;
    return Math.min(s, 3);
  };

  const strength = getStrength(su.pass);
  const sColors = ['#D9534F', '#E0A82E', '#2E9E5B'];
  const sLabels = ['Weak', 'Fair', 'Strong'];
  const sColor = su.pass ? sColors[Math.max(0, strength - 1)] : T.colors.fieldBorder;

  const submitSignup = async () => {
    setSuSubmit(true);
    setAuthError('');
    if (suErr.name || suErr.email || suErr.pass || suErr.terms) return;
    setSubmitting(true);
    try {
      const [firstName, ...rest] = su.name.trim().split(/\s+/);
      await signUp(su.email, su.pass, firstName, rest.join(' '));
      // Firebase has emailed a verification link; release builds wait for it.
      if (mustVerifyEmail(false)) router.replace({ pathname: '/(auth)/otp', params: { email: su.email.trim() } });
      else router.replace({ pathname: '/(auth)/success', params: { from: 'signup' } });
    } catch (error) {
      const code = typeof error === 'object' && error && 'code' in error ? (error as { code: string }).code : '';
      if (code === 'auth/email-already-in-use') {
        // The account exists (maybe from an earlier attempt or another sign-in method).
        Alert.alert(
          'You already have an account',
          `${su.email.trim()} is already registered. Log in instead — tap “Forgot?” there if you don’t know the password, or use Continue with Google.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Log in', onPress: () => router.replace({ pathname: '/(auth)/login', params: { email: su.email.trim() } }) },
          ],
        );
      }
      setAuthError(authErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <BackIcon />
          </Pressable>

          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>
            Join <Text style={{ fontFamily: T.fonts.jakarta.bold, color: T.colors.blue }}>Endorse</Text> and start signing documents in seconds.
          </Text>

          <View style={styles.socialContainer}>
            <GoogleSignInButton
              onSuccess={() => router.replace({ pathname: '/(auth)/success', params: { from: 'signup' } })}
              onError={setAuthError}
            />
          </View>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or sign up with email</Text>
            <View style={styles.dividerLine} />
          </View>


          <Text style={styles.label}>Full name</Text>
          <TextInput
            style={[styles.input, { borderColor: showSu('name') ? T.colors.errBorder : T.colors.fieldBorder }]}
            value={su.name}
            onChangeText={(text) => setSu({ ...su, name: text })}
            onBlur={() => setSuT({ ...suT, name: true })}
            placeholder="Alex Morgan"
            placeholderTextColor="#9AA7BC"
          />
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{showSu('name')}</Text>
          </View>

          <Text style={[styles.label, { marginTop: 6 }]}>Email</Text>
          <TextInput
            style={[styles.input, { borderColor: showSu('email') ? T.colors.errBorder : T.colors.fieldBorder }]}
            value={su.email}
            onChangeText={(text) => setSu({ ...su, email: text })}
            onBlur={() => setSuT({ ...suT, email: true })}
            placeholder="you@email.com"
            placeholderTextColor="#9AA7BC"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{showSu('email')}</Text>
          </View>

          <Text style={[styles.label, { marginTop: 6 }]}>Password</Text>
          <View style={styles.pwContainer}>
            <TextInput
              style={[styles.input, { paddingRight: 48, borderColor: showSu('pass') ? T.colors.errBorder : T.colors.fieldBorder }]}
              value={su.pass}
              onChangeText={(text) => setSu({ ...su, pass: text })}
              onBlur={() => setSuT({ ...suT, pass: true })}
              placeholder="At least 8 characters"
              placeholderTextColor="#9AA7BC"
              secureTextEntry={!showPw}
            />
            <Pressable style={styles.eyeBtn} onPress={() => setShowPw(!showPw)}>
              <EyeIcon />
            </Pressable>
          </View>

          <View style={styles.pwMetaContainer}>
            {!!su.pass && !showSu('pass') ? (
              <>
                <View style={styles.strengthBars}>
                  {[0, 1, 2].map((i) => (
                    <View key={i} style={[styles.strengthBar, { backgroundColor: i < strength ? sColor : '#E7ECF3' }]} />
                  ))}
                </View>
                <Text style={[styles.strengthText, { color: sColor }]}>
                  {sLabels[Math.max(0, strength - 1)]}
                </Text>
              </>
            ) : (
              <Text style={styles.errorText}>{showSu('pass')}</Text>
            )}
          </View>

          <Pressable style={styles.termsRow} onPress={() => setSu({ ...su, terms: !su.terms })}>
            <View style={[styles.checkbox, { 
              borderColor: showSu('terms') ? T.colors.errBorder : su.terms ? T.colors.blue : '#C4CFDE',
              backgroundColor: su.terms ? T.colors.blue : T.colors.white
            }]}>
              {su.terms && <CheckIcon />}
            </View>
            <Text style={styles.termsText}>
              I agree to the <Text style={styles.linkText}>Terms of Service</Text> and <Text style={styles.linkText}>e-Sign Consent</Text>.
            </Text>
          </Pressable>
          
          <View style={[styles.errorContainer, { paddingLeft: 33, minHeight: 16 }]}>
            <Text style={styles.errorText}>{showSu('terms')}</Text>
          </View>

          {authError ? (
            <View style={styles.errorContainer} accessibilityLiveRegion="polite">
              <Text style={styles.errorText}>{authError}</Text>
            </View>
          ) : null}

          <Pressable style={styles.primaryBtn} onPress={submitSignup} disabled={submitting}>
            <Text style={styles.primaryBtnText}>{submitting ? 'Creating account…' : 'Create account'}</Text>
          </Pressable>
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
  pwContainer: { position: 'relative' },
  eyeBtn: { position: 'absolute', right: 6, top: 6, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  pwMetaContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 18, paddingTop: 6, paddingHorizontal: 2 },
  strengthBars: { flex: 1, flexDirection: 'row', gap: 4 },
  strengthBar: { flex: 1, height: 3, borderRadius: 2 },
  strengthText: { fontFamily: T.fonts.jakarta.semiBold, fontSize: 12 },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, marginTop: 10, marginBottom: 4 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, marginTop: 1, alignItems: 'center', justifyContent: 'center' },
  termsText: { flex: 1, fontFamily: T.fonts.jakarta.regular, fontSize: 13, color: T.colors.inkSoft, lineHeight: 19.5 },
  linkText: { fontFamily: T.fonts.jakarta.semiBold, color: T.colors.blue },
  primaryBtn: { width: '100%', height: 56, marginTop: 12, borderRadius: 15, backgroundColor: T.colors.yellow, alignItems: 'center', justifyContent: 'center', shadowColor: '#F8D12D', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.32, shadowRadius: 24, elevation: 5 },
  primaryBtnText: { fontFamily: T.fonts.jakarta.bold, fontSize: 16, color: T.colors.navyInk },
});
