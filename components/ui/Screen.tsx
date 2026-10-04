import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

interface ScreenProps {
  children: React.ReactNode;
  /** Safe-area edges to pad. Defaults to top only (tab bar / footers handle the bottom). */
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
}

/** Full-screen themed container: white background, status bar and safe area. */
export function Screen({ children, edges = ['top'], style }: ScreenProps) {
  const { colors, isDark } = useTheme();
  return (
    <SafeAreaView edges={edges} style={[styles.screen, { backgroundColor: colors.background }, style]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
