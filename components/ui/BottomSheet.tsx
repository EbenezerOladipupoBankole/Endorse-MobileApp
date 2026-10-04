import { X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { useTheme } from '@/theme';
import { Typography } from './Typography';

interface BottomSheetProps {
  visible: boolean;
  /** User asked to close (backdrop tap, close button, Android back). Set `visible` to false. */
  onRequestClose: () => void;
  /** Fires after the exit animation finishes — run follow-up navigation here. */
  onDismissed?: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

/**
 * Lightweight animated bottom sheet built on Modal + Reanimated, so no extra
 * dependency is needed. Animates out before unmounting, then calls `onDismissed`.
 */
export function BottomSheet({ visible, onRequestClose, onDismissed, title, subtitle, children }: BottomSheetProps) {
  const { colors, radius, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);
  const sheetHeight = useSharedValue(800);
  const [mounted, setMounted] = useState(visible);

  // Mount immediately when opened; unmount only after the exit animation.
  if (visible && !mounted) setMounted(true);

  useEffect(() => {
    if (!mounted) return;
    const duration = reduceMotion ? 0 : visible ? 300 : 220;
    const easing = visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic);
    const finish = () => {
      setMounted(false);
      onDismissed?.();
    };
    progress.set(
      withTiming(visible ? 1 : 0, { duration, easing }, (finished) => {
        if (finished && !visible) scheduleOnRN(finish);
      }),
    );
  }, [visible, mounted, progress, reduceMotion, onDismissed]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.get() }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.get()) * sheetHeight.get() }],
  }));

  return (
    <Modal visible={mounted} transparent animationType="none" statusBarTranslucent navigationBarTranslucent onRequestClose={onRequestClose}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onRequestClose} accessibilityRole="button" accessibilityLabel="Close sheet" />
      </Animated.View>
      <Animated.View
        accessibilityViewIsModal
        onLayout={(e) => sheetHeight.set(e.nativeEvent.layout.height)}
        style={[
          styles.sheet,
          {
            backgroundColor: colors.surfaceElevated,
            borderTopLeftRadius: radius.xxl,
            borderTopRightRadius: radius.xxl,
            paddingBottom: insets.bottom + spacing.lg,
          },
          sheetStyle,
        ]}>
        <View style={[styles.handle, { backgroundColor: colors.borderStrong }]} />
        <View style={[styles.header, { paddingHorizontal: spacing.xl }]}>
          <View style={styles.titles}>
            <Typography variant="title1" accessibilityRole="header">
              {title}
            </Typography>
            {subtitle ? (
              <Typography variant="callout" tone="textSecondary" numberOfLines={2}>
                {subtitle}
              </Typography>
            ) : null}
          </View>
          <Pressable
            onPress={onRequestClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={6}
            style={({ pressed }) => [styles.close, { backgroundColor: colors.surfaceMuted }, pressed && styles.pressed]}>
            <X size={18} color={colors.text} />
          </Pressable>
        </View>
        {children}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  handle: { width: 40, height: 5, borderRadius: 3, alignSelf: 'center', marginTop: 10 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingTop: 16, paddingBottom: 8 },
  titles: { flex: 1, gap: 2 },
  close: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.6 },
});
