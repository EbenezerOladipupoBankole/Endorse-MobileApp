import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, TextInput, Dimensions, KeyboardAvoidingView, Platform, ScrollView, SafeAreaView, StatusBar, View as RNView } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Link, router } from 'expo-router';
import { Mail, Lock, Eye, EyeOff, ChevronRight } from 'lucide-react-native';
import { Logo } from '@/components/Logo';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.header}>
            <View style={styles.logoWrapper}>
              {/* Logo removed */}
            </View>
            <View style={{ marginTop: 32, backgroundColor: 'transparent' }}>
              <Text style={styles.title}>Welcome back</Text>
              <Text style={styles.subtitle}>Sign in to your Endorse account</Text>
            </View>
          </View>

          <View style={styles.formSection}>
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="email@example.com"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Password</Text>
                <TouchableOpacity>
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={20} color="#64748B" /> : <Eye size={20} color="#64748B" />}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.loginButton} 
              onPress={handleLogin}
              activeOpacity={0.8}
            >
              <Text style={styles.loginButtonText}>Sign In</Text>
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>OR LOGIN WITH</Text>
              <View style={styles.line} />
            </View>

            <View style={styles.socialGrid}>
              <TouchableOpacity style={styles.socialButton}>
                <View style={[styles.socialIcon, { backgroundColor: '#DB4437' }]}>
                  <Text style={styles.socialIconText}>G</Text>
                </View>
                <Text style={styles.socialText}>Google</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.socialButton}>
                <View style={[styles.socialIcon, { backgroundColor: '#000000' }]}>
                  <Text style={styles.socialIconText}></Text>
                </View>
                <Text style={styles.socialText}>Apple</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>No account? </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text style={styles.signupLink}>Create Free Account</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    backgroundColor: '#FFFFFF',
  },
  header: {
    marginBottom: 48,
    backgroundColor: '#FFFFFF',
  },
  logoWrapper: {
    alignItems: 'flex-start',
    marginLeft: -10,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1E1B4B',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 12,
    fontWeight: '500',
  },
  formSection: {
    backgroundColor: '#FFFFFF',
  },
  inputWrapper: {
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E1B4B',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1E1B4B',
    fontWeight: '500',
  },
  forgotText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4F46E5',
  },
  loginButton: {
    height: 60,
    borderRadius: 8,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 40,
    backgroundColor: '#FFFFFF',
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '800',
    letterSpacing: 1,
  },
  socialGrid: {
    flexDirection: 'row',
    gap: 16,
    backgroundColor: '#FFFFFF',
  },
  socialButton: {
    flex: 1,
    height: 56,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  socialIcon: {
    width: 24,
    height: 24,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialIconText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
  },
  socialText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E1B4B',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 48,
    backgroundColor: '#FFFFFF',
  },
  footerText: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '500',
  },
  signupLink: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4F46E5',
  },
});
