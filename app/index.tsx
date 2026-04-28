import React, { useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Dimensions, StatusBar } from 'react-native';
import { router } from 'expo-router';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withDelay, 
  withSequence,
  FadeInUp,
  FadeIn
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const APP_NAME = "Endorse";
const LETTERS = APP_NAME.split("");

export default function WelcomeScreen() {
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    // Fade in the buttons and subtext after the letters finish animating
    contentOpacity.value = withDelay(LETTERS.length * 150 + 500, withTiming(1, { duration: 800 }));
  }, []);

  const animatedContentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: withTiming(contentOpacity.value === 1 ? 0 : 20) }]
  }));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#0F172A', '#1E3A8A']} // Deep Navy to Royal Blue
        style={styles.gradient}
      >
        <View style={styles.logoSection}>
          <View style={styles.letterContainer}>
            {LETTERS.map((letter, index) => (
              <Animated.Text
                key={index}
                entering={FadeInUp.delay(index * 150).springify()}
                style={[
                  styles.logoLetter,
                  // Color pattern: Blue is base, but we can make some yellow or alternate
                  index % 2 === 0 ? styles.blueLetter : styles.yellowLetter
                ]}
              >
                {letter}
              </Animated.Text>
            ))}
          </View>
          
          <Animated.View style={styles.taglineWrapper} entering={FadeIn.delay(1200)}>
            <View style={styles.line} />
            <Text style={styles.tagline}>SECURE DIGITAL ENDORSEMENT</Text>
            <View style={styles.line} />
          </Animated.View>
        </View>

        <Animated.View style={[styles.footer, animatedContentStyle]}>
          <Text style={styles.headline}>
            Simple. Secure. Verified.
          </Text>
          <Text style={styles.subheadline}>
            Join thousands of professionals securing their future with Endorse.
          </Text>

          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => router.push('/(auth)/register')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Create Free Account</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Log In to Account</Text>
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 60,
  },
  letterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    fontSize: 64,
    fontWeight: '900',
    letterSpacing: -2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  blueLetter: {
    color: '#60A5FA', // Sky Blue
  },
  yellowLetter: {
    color: '#FACC15', // Vibrant Yellow
  },
  taglineWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
  tagline: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
  },
  line: {
    height: 1,
    width: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  footer: {
    marginTop: 40,
  },
  headline: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  subheadline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  primaryButton: {
    backgroundColor: '#FACC15', // Yellow for the main action
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FACC15',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 16,
  },
  primaryButtonText: {
    color: '#1E1B4B',
    fontSize: 18,
    fontWeight: '800',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
