import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Svg, { Path, Rect } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EndorseTokens as T } from '../../constants/EndorseTokens';

const BackIcon = () => (
  <Svg width="18" height="16" viewBox="0 0 18 16" fill="none">
    <Path d="M17 8H1M7 2 1 8l6 6" stroke="#1D3358" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const MailIcon = () => (
  <Svg width="26" height="26" viewBox="0 0 24 24" fill="none">
    <Rect x="2.5" y="5" width="19" height="14" rx="2.5" stroke={T.colors.blue} strokeWidth="1.8" />
    <Path d="M3 7l9 6 9-6" stroke={T.colors.blue} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export default function OtpScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email?: string }>();
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpSubmit, setOtpSubmit] = useState(false);
  const [resendIn, setResendIn] = useState(30);
  const [submitting, setSubmitting] = useState(false);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const onOtp = (text: string, i: number) => {
    const d = text.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[i] = d;
    setOtp(newOtp);

    if (d && i < 5) {
      inputRefs.current[i + 1]?.focus();
    }
  };

  const onOtpKey = (e: any, i: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  };

  const submitOtp = () => {
    setOtpSubmit(true);
    if (otp.join('').length === 6) {
      setSubmitting(true);
      // Simulate API call
      setTimeout(() => {
        setSubmitting(false);
        router.push('/(auth)/signature');
      }, 1000);
    }
  };

  const handleResend = () => {
    setOtp(['', '', '', '', '', '']);
    setResendIn(30);
    inputRefs.current[0]?.focus();
  };

  const otpErr = otpSubmit && otp.join('').length < 6 ? 'Please enter all 6 digits' : '';

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <BackIcon />
          </Pressable>

          <View style={styles.iconChip}>
            <MailIcon />
          </View>

          <Text style={styles.title}>Verify your email</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code we sent to{' '}
            <Text style={styles.subtitleEmail}>{email || 'you@email.com'}</Text>.
          </Text>

          <View style={styles.otpContainer}>
            {otp.map((v, i) => (
              <TextInput
                key={i}
                ref={(ref) => (inputRefs.current[i] = ref)}
                value={v}
                onChangeText={(text) => onOtp(text, i)}
                onKeyPress={(e) => onOtpKey(e, i)}
                keyboardType="number-pad"
                maxLength={1}
                style={[
                  styles.otpInput,
                  {
                    borderColor: otpErr && !v ? T.colors.errBorder : v ? T.colors.blue : T.colors.fieldBorder,
                    backgroundColor: v ? '#F4F9FF' : T.colors.white,
                  }
                ]}
              />
            ))}
          </View>
          
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{otpErr}</Text>
          </View>

          <Pressable style={styles.primaryButton} onPress={submitOtp} disabled={submitting}>
            <Text style={styles.primaryButtonText}>
              {submitting ? 'Verifying...' : 'Verify & continue'}
            </Text>
          </Pressable>

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>
              {resendIn === 0 ? "Didn't get it? " : `Resend available in ${resendIn}s`}
            </Text>
            {resendIn === 0 && (
              <Pressable onPress={handleResend} hitSlop={10}>
                <Text style={styles.resendLink}>Resend code</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.colors.cloud,
  },
  scrollContent: {
    paddingHorizontal: 26,
    paddingTop: 6,
    paddingBottom: 34,
    flexGrow: 1,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: T.colors.border,
    backgroundColor: T.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  iconChip: {
    width: 52,
    height: 52,
    borderRadius: 15,
    backgroundColor: T.colors.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    fontFamily: T.fonts.sora.semiBold,
    fontSize: 28,
    color: T.colors.ink,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: T.fonts.jakarta.regular,
    fontSize: 15,
    color: T.colors.inkSoft,
    marginBottom: 28,
    lineHeight: 22.5,
  },
  subtitleEmail: {
    fontFamily: T.fonts.jakarta.semiBold,
    color: T.colors.ink,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 9,
  },
  otpInput: {
    flex: 1,
    height: 60,
    textAlign: 'center',
    fontFamily: T.fonts.sora.semiBold,
    fontSize: 24,
    color: T.colors.ink,
    borderRadius: 13,
    borderWidth: 1.5,
  },
  errorContainer: {
    minHeight: 20,
    paddingTop: 4,
    paddingHorizontal: 2,
  },
  errorText: {
    fontFamily: T.fonts.jakarta.medium,
    fontSize: 12.5,
    color: T.colors.error,
  },
  primaryButton: {
    width: '100%',
    height: 56,
    marginTop: 10,
    borderRadius: 15,
    backgroundColor: T.colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFC72C',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.32,
    shadowRadius: 24,
    elevation: 5,
  },
  primaryButtonText: {
    fontFamily: T.fonts.jakarta.bold,
    fontSize: 16,
    color: T.colors.navyInk,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 22,
  },
  resendText: {
    fontFamily: T.fonts.jakarta.regular,
    fontSize: 14,
    color: T.colors.inkSoft,
  },
  resendLink: {
    fontFamily: T.fonts.jakarta.bold,
    fontSize: 14,
    color: T.colors.blue,
  },
});
