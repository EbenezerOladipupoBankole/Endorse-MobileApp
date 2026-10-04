import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

interface CardProps extends ViewProps {
  style?: StyleProp<ViewStyle>;
  /** Removes inner padding (e.g. for grouped lists). */
  flush?: boolean;
}

/** White surface with hairline border and soft shadow — the standard container on white screens. */
export function Card({ style, flush, children, ...rest }: CardProps) {
  const { colors, radius, spacing, shadows } = useTheme();
  return (
    <View
      {...rest}
      style={[
        shadows.sm,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: StyleSheet.hairlineWidth,
          borderRadius: radius.xl,
          padding: flush ? 0 : spacing.lg,
        },
        style,
      ]}>
      {children}
    </View>
  );
}
