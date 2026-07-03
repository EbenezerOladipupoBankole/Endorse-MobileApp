import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path, Circle } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EndorseTokens as T } from '../../constants/EndorseTokens';

// Icons
const BackIcon = () => (
  <Svg width="18" height="16" viewBox="0 0 18 16" fill="none">
    <Path d="M17 8H1M7 2 1 8l6 6" stroke="#1D3358" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const EyeIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <Path d="M1.5 10S4.5 4 10 4s8.5 6 8.5 6-3 6-8.5 6-8.5-6-8.5-6Z" stroke="currentColor" strokeWidth="1.6" />
    <Circle cx="10" cy="10" r="2.6" stroke="currentColor" strokeWidth="1.6" />
  </Svg>
);
const CheckIcon = () => (
  <Svg width="13" height="10" viewBox="0 0 13 10" fill="none">
    <Path d="M1 5l4 4 7-8" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const GoogleIcon = () => (
  <Svg width="19" height="19" viewBox="0 0 18 18">
    <Path fill="#4285F4" d="M17.6 9.2c0-.6-.05-1.18-.16-1.74H9v3.3h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.66-3.88 2.66-6.54z" />
    <Path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.94v2.33A9 9 0 0 0 9 18z" />
    <Path fill="#FBBC05" d="M3.95 10.7a5.4 5.4 0 0 1 0-3.4V4.96H.94a9 9 0 0 0 0 8.08l3.01-2.34z" />
    <Path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.47.9 11.43 0 9 0A9 9 0 0 0 .94 4.96l3.01 2.34C4.66 5.17 6.65 3.58 9 3.58z" />
  </Svg>
);
const AppleIcon = () => (
  <Svg width="17" height="19" viewBox="0 0 15 18" fill={T.colors.navyInk}>
    <Path d="M12.6 9.6c-.02-1.7.76-2.98 2.34-3.92-.88-1.26-2.22-1.96-3.98-2.1-1.67-.13-3.5.98-4.17.98-.7 0-2.32-.94-3.6-.94C.6 3.66-.9 5.9-.9 8.86c0 1.34.24 2.72.73 4.14.65 1.86 3 6.42 5.44 6.34 1.14-.03 1.95-.81 3.43-.81 1.44 0 2.19.81 3.46.81 2.47-.04 4.59-4.18 5.21-6.05-3.3-1.56-3.12-4.56-3.12-4.66z" transform="translate(0.9 -1.4)" />
    <Path d="M10.6 2.6C11.7 1.3 11.6-.1 11.56-.6c-1.12.06-2.42.76-3.16 1.62-.8.92-1.28 2.06-1.17 3.3 1.22.1 2.33-.53 3.37-1.72z" transform="translate(0.9 0.6)" />
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

  const handleSocial = () => {
    router.push({ pathname: '/(auth)/success', params: { from: 'signup' } });
  };

  const submitSignup = () => {
    setSuSubmit(true);
    if (!suErr.name && !suErr.email && !suErr.pass && !suErr.terms) {
      setSubmitting(true);
      setTimeout(() => {
        setSubmitting(false);
        router.push({ pathname: '/(auth)/otp', params: { email: su.email } });
      }, 1100);
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
            <Pressable style={styles.socialBtn} onPress={handleSocial}>
              <GoogleIcon />
              <Text style={styles.socialBtnText}>Continue with Google</Text>
            </Pressable>
            <Pressable style={styles.socialBtn} onPress={handleSocial}>
              <AppleIcon />
              <Text style={styles.socialBtnText}>Continue with Apple</Text>
            </Pressable>
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
              <View style={{ color: '#8494AB' }}><EyeIcon /></View>
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
  primaryBtn: { width: '100%', height: 56, marginTop: 12, borderRadius: 15, backgroundColor: T.colors.yellow, alignItems: 'center', justifyContent: 'center', shadowColor: '#FFC72C', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.32, shadowRadius: 24, elevation: 5 },
  primaryBtnText: { fontFamily: T.fonts.jakarta.bold, fontSize: 16, color: T.colors.navyInk },
});
