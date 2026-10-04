import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  withDelay, 
  FadeInUp,
  FadeInDown,
  runOnJS
} from 'react-native-reanimated';
import { ArrowRight, LogIn, FileText, CheckCircle, Award } from 'lucide-react-native';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/context/AuthContext';
import { mustVerifyEmail } from '@/lib/authPolicy';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const [showSplash, setShowSplash] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const { user, loading: authLoading, emailVerified } = useAuth();
  const splashOpacity = useSharedValue(1);
  const splashScale = useSharedValue(1);
  const progressWidth = useSharedValue(0);

  const imageOpacity = useSharedValue(0);
  const imageTranslateY = useSharedValue(20);

  useEffect(() => {
    // Start progress bar
    progressWidth.value = withTiming(1, { duration: 1800 });

    // Mark as loaded when progress completes
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 1800);

    return () => clearTimeout(timer);
  }, [progressWidth]);

  // Signed-in users see the logo, then go straight in (or finish verifying their email).
  useEffect(() => {
    if (!isLoaded || authLoading || !user) return;
    if (!mustVerifyEmail(emailVerified)) router.replace('/(tabs)/home');
    else router.replace({ pathname: '/(auth)/otp', params: { email: user.email ?? '' } });
  }, [isLoaded, authLoading, user, emailVerified]);

  const handleProceed = () => {
    splashOpacity.value = withTiming(0, { duration: 550 }, (finished) => {
      if (finished) {
        runOnJS(setShowSplash)(false);
      }
    });
    splashScale.value = withTiming(1.08, { duration: 550 });
    
    // Trigger Welcome Screen animations
    imageOpacity.value = withDelay(100, withTiming(1, { duration: 800 }));
    imageTranslateY.value = withDelay(100, withSpring(0, { damping: 12 }));
  };

  const animatedSplashStyle = useAnimatedStyle(() => ({
    opacity: splashOpacity.value,
    transform: [{ scale: splashScale.value }],
  }));

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Header Section */}
          <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
            <View style={styles.logoRow}>
              <Logo size={72} style={styles.headerLogo} />
            </View>
          </Animated.View>

          {/* Custom Illustration Section */}
          <View style={styles.illustrationContainer}>
            {/* Entering animation on the wrapper, rotation on the card, so they don't fight over `transform`. */}
            <Animated.View entering={FadeInDown.delay(300).duration(800)} style={styles.cardLeft}>
              <View style={[styles.floatingCard, styles.cardLeftTilt]}>
                <View style={styles.iconCircleBlue}>
                  <FileText color="#0E68B4" size={24} />
                </View>
                <View style={styles.cardTextContainer}>
                  <View style={styles.cardLineLong} />
                  <View style={styles.cardLineShort} />
                </View>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(500).duration(800)} style={[styles.floatingCard, styles.cardCenter]}>
              <View style={styles.iconCircleGreen}>
                <CheckCircle color="#10B981" size={32} />
              </View>
              <Text style={styles.cardCenterText}>Verified</Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(700).duration(800)} style={styles.cardRight}>
              <View style={[styles.floatingCard, styles.cardRightTilt]}>
                <View style={styles.iconCirclePurple}>
                  <Award color="#8B5CF6" size={24} />
                </View>
                <View style={styles.cardTextContainer}>
                  <View style={styles.cardLineLong} />
                  <View style={styles.cardLineShort} />
                </View>
              </View>
            </Animated.View>
          </View>
          <View style={styles.bottomSection}>
            {/* Text Content */}
            <View style={styles.textSection}>
              <Animated.Text entering={FadeInUp.delay(400).duration(800)} style={styles.headline}>
                Secure digital{'\n'}
                <Text style={styles.headlineHighlight}>endorsements.</Text>
              </Animated.Text>
              <Animated.Text entering={FadeInUp.delay(500).duration(800)} style={styles.subheadline}>
                The professional standard for verified documents, signatures, and team collaboration.
              </Animated.Text>
            </View>

            {/* Action Buttons */}
            <Animated.View 
              entering={FadeInUp.delay(600).duration(800)}
              style={styles.buttonContainer}
            >
              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={() => router.push('/(auth)/welcome')}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>Get Started</Text>
                <ArrowRight color="#FFFFFF" size={20} strokeWidth={2.5} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={() => router.push('/(auth)/login')}
                activeOpacity={0.6}
              >
                <LogIn color="#14213D" size={20} style={{ marginRight: 8 }} />
                <Text style={styles.secondaryButtonText}>Log in to your account</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </SafeAreaView>

      {showSplash && (
        <Animated.View style={[StyleSheet.absoluteFill, styles.splashContainer, animatedSplashStyle]}>
          <View style={styles.splashGradient}>
            <View style={styles.splashContent}>
              <Logo size={220} />
              <Text style={styles.splashSubtitle}>VERIFIABLE TRUST PLATFORM</Text>
            </View>
            <View style={styles.splashFooter}>
              {!isLoaded ? (
                <View style={{ width: '100%', alignItems: 'center' }}>
                  <View style={styles.progressBarBg}>
                    <Animated.View style={[styles.progressBarFill, animatedProgressStyle]} />
                  </View>
                  <Text style={styles.progressBarLabel}>Securing environment...</Text>
                </View>
              ) : (
                <Animated.View entering={FadeInUp.duration(500)} style={{ width: '100%', alignItems: 'center' }}>
                  <TouchableOpacity 
                    style={styles.splashProceedBtn}
                    onPress={handleProceed}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.splashProceedText}>GET STARTED</Text>
                    <ArrowRight color="#FFFFFF" size={18} strokeWidth={2.5} />
                  </TouchableOpacity>
                </Animated.View>
              )}
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: Platform.OS === 'ios' ? 10 : 30,
  },
  header: {
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    marginBottom: 20,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerLogo: {
    marginVertical: -14,
    marginLeft: -8,
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 160,
    maxHeight: 220,
    position: 'relative',
    marginVertical: 10,
  },
  floatingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#14213D',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardLeft: {
    position: 'absolute',
    left: width * 0.02,
    top: '10%',
  },
  cardLeftTilt: {
    transform: [{ rotate: '-6deg' }],
  },
  cardRight: {
    position: 'absolute',
    right: width * 0.02,
    bottom: '10%',
  },
  cardRightTilt: {
    transform: [{ rotate: '6deg' }],
  },
  cardCenter: {
    position: 'absolute',
    zIndex: 10,
    paddingVertical: 20,
    paddingHorizontal: 28,
    shadowOpacity: 0.1,
    flexDirection: 'column',
    gap: 12,
  },
  iconCircleBlue: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E7F0FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleGreen: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCirclePurple: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTextContainer: {
    gap: 8,
    width: 60,
  },
  cardLineLong: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    width: '100%',
  },
  cardLineShort: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    width: '60%',
  },
  cardCenterText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  bottomSection: {
    paddingTop: 20,
  },
  textSection: {
    marginBottom: 20,
  },
  headline: {
    fontSize: 38,
    fontWeight: '900',
    color: '#14213D',
    lineHeight: 44,
    marginBottom: 12,
    letterSpacing: -1,
  },
  headlineHighlight: {
    color: '#0E68B4',
  },
  subheadline: {
    fontSize: 15,
    color: '#64748B',
    lineHeight: 24,
    fontWeight: '500',
    paddingRight: 20,
  },
  buttonContainer: {
    gap: 16,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#0E68B4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#0E68B4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  secondaryButtonText: {
    color: '#14213D',
    fontSize: 16,
    fontWeight: '800',
  },
  splashContainer: {
    zIndex: 9999,
  },
  splashGradient: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Platform.OS === 'ios' ? 80 : 60,
    paddingHorizontal: 40,
  },
  splashContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  splashSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0E68B4',
    letterSpacing: 4,
    opacity: 0.8,
  },
  splashFooter: {
    width: '100%',
    alignItems: 'center',
  },
  progressBarBg: {
    width: '70%',
    height: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0E68B4',
  },
  progressBarLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  splashProceedBtn: {
    backgroundColor: '#0E68B4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 36,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#0E68B4',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  splashProceedText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
});


