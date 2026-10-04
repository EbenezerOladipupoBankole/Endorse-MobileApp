import { useFonts } from 'expo-font';
import { 
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
} from '@expo-google-fonts/inter';
import {
  Sora_500Medium,
  Sora_600SemiBold,
  Sora_700Bold,
} from '@expo-google-fonts/sora';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { darkTheme, lightTheme } from '@/theme';
import { AuthProvider } from '../context/AuthContext';
import { Text, StyleSheet } from 'react-native';

// Global Font Override Hack for React Native
const originalTextRender = (Text as any).render;
if (originalTextRender) {
  (Text as any).render = function render(props: any, ref: any) {
    let family = 'Inter_500Medium';
    if (props.style) {
      const flatStyle = StyleSheet.flatten(props.style);
      if (flatStyle.fontWeight === '400' || flatStyle.fontWeight === 'normal') family = 'Inter_400Regular';
      if (flatStyle.fontWeight === '600') family = 'Inter_600SemiBold';
      if (flatStyle.fontWeight === '700' || flatStyle.fontWeight === 'bold') family = 'Inter_700Bold';
      if (flatStyle.fontWeight === '800') family = 'Inter_800ExtraBold';
      if (flatStyle.fontWeight === '900') family = 'Inter_900Black';
    }
    return originalTextRender.call(this, { ...props, style: [{ fontFamily: family }, props.style] }, ref);
  };
}

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // The logo splash (app/index.tsx) is the first screen; it forwards signed-in users to the dashboard.
  initialRouteName: 'index',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
    Sora_500Medium,
    Sora_600SemiBold,
    Sora_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        initialRouteName="index"
        screenOptions={{ contentStyle: { backgroundColor: (colorScheme === 'dark' ? darkTheme : lightTheme).colors.background } }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/welcome" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="(auth)/login" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="(auth)/signup" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="(auth)/otp" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="(auth)/signature" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
        <Stack.Screen name="(auth)/success" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="scanner" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="save-scan" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="sign/[id]" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
        <Stack.Screen name="document/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="send" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
        <Stack.Screen name="template/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="invoice/new" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
        <Stack.Screen name="notifications" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}

