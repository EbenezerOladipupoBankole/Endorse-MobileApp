import React from 'react';
import { Text, type TextProps } from 'react-native';

import { useTheme, type TypographyVariant } from '@/theme';

type TextTone =
  | 'text'
  | 'textSecondary'
  | 'textTertiary'
  | 'primary'
  | 'onPrimary'
  | 'onBrand'
  | 'onBrandMuted'
  | 'onAccent';

export interface TypographyProps extends TextProps {
  variant?: TypographyVariant;
  tone?: TextTone;
  /** Explicit color; wins over `tone`. */
  color?: string;
}

/**
 * Themed text. Supports Dynamic Type / font scaling by default; pass
 * `maxFontSizeMultiplier` for space-constrained UI such as chips.
 */
export function Typography({ variant = 'body', tone = 'text', color, style, ...rest }: TypographyProps) {
  const { colors, typography } = useTheme();
  return <Text {...rest} style={[typography[variant], { color: color ?? colors[tone] }, style]} />;
}
