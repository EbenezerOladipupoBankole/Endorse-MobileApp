import type { LucideIcon } from 'lucide-react-native';
import React, { memo } from 'react';
import { ActivityIndicator, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import type { HapticKind } from '@/lib/haptics';
import { useTheme } from '@/theme';
import { PressableScale } from './PressableScale';
import { Typography } from './Typography';

type Variant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: 'sm' | 'md';
  icon?: LucideIcon;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  haptic?: HapticKind;
  disabled?: boolean;
  /** Shows a spinner and blocks presses. */
  loading?: boolean;
}

export const Button = memo(function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  style,
  accessibilityLabel,
  accessibilityHint,
  haptic = 'light',
  disabled,
  loading,
}: ButtonProps) {
  const { colors, radius } = useTheme();
  const tones: Record<Variant, { bg: string; fg: string; border?: string }> = {
    primary: { bg: colors.primary, fg: colors.onPrimary },
    accent: { bg: colors.accent, fg: colors.onAccent },
    secondary: { bg: colors.surface, fg: colors.text, border: colors.borderStrong },
    ghost: { bg: 'transparent', fg: colors.primary },
    danger: { bg: colors.status.declined.soft, fg: colors.status.declined.fg },
  };
  const tone = tones[variant];
  return (
    <PressableScale
      onPress={onPress}
      haptic={haptic}
      disabled={disabled || loading}
      accessibilityState={{ busy: !!loading }}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      style={[
        styles.base,
        size === 'sm' ? styles.sm : styles.md,
        { backgroundColor: tone.bg, borderRadius: radius.md },
        tone.border ? { borderWidth: 1, borderColor: tone.border } : null,
        style,
      ]}>
      {loading ? <ActivityIndicator size="small" color={tone.fg} /> : null}
      {!loading && Icon ? <Icon size={size === 'sm' ? 16 : 18} color={tone.fg} strokeWidth={2.2} /> : null}
      <Typography variant={size === 'sm' ? 'captionStrong' : 'calloutStrong'} color={tone.fg} maxFontSizeMultiplier={1.4}>
        {label}
      </Typography>
    </PressableScale>
  );
});

const styles = StyleSheet.create({
  base: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  sm: { minHeight: 44, paddingHorizontal: 14 },
  md: { minHeight: 48, paddingHorizontal: 18 },
});
