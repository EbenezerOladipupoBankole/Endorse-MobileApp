import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EndorseTokens as T } from '../../constants/EndorseTokens';

export default function SuccessScreen() {
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const isLogin = from === 'login';

  const onGoToDashboard = () => {
    // Navigate to dashboard
    router.replace('/(tabs)/home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.shadowContainer}>
          <LinearGradient
            colors={['#FFD65A', '#FFB800']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.circle}
          >
            <Svg width="44" height="34" viewBox="0 0 44 34" fill="none">
              <Path
                d="M3 18l12 12L41 4"
                stroke={T.colors.navyInk}
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </LinearGradient>
        </View>

        <Text style={styles.heading}>
          {isLogin ? 'Welcome back!' : "You're all set!"}
        </Text>
        
        <Text style={styles.subhead}>
          {isLogin
            ? 'You’re signed in. Your documents are waiting for you.'
            : 'Your email is verified and your signature is saved. You’re ready to sign.'}
        </Text>

        <Pressable style={styles.button} onPress={onGoToDashboard}>
          <Text style={styles.buttonText}>Go to dashboard</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.colors.navy, // white in token
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    paddingHorizontal: 40,
    paddingVertical: 32,
  },
  shadowContainer: {
    marginBottom: 30,
    shadowColor: '#FFB800',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 40,
    elevation: 8,
  },
  circle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontFamily: T.fonts.sora.semiBold,
    fontSize: 30,
    color: '#14213D',
    marginBottom: 12,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  subhead: {
    fontFamily: T.fonts.jakarta.regular,
    fontSize: 15.5,
    color: '#5C6B84',
    marginBottom: 40,
    lineHeight: 24,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 15,
    backgroundColor: T.colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F8D12D',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.32,
    shadowRadius: 26,
    elevation: 5,
  },
  buttonText: {
    fontFamily: T.fonts.jakarta.bold,
    color: T.colors.navyInk,
    fontSize: 16,
  },
});
