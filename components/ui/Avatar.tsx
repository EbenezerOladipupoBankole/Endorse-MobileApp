import React, { memo } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { initials } from '@/lib/dashboard/format';
import { useTheme } from '@/theme';
import { Typography } from './Typography';

interface AvatarProps {
  name: string;
  uri?: string;
  size?: number;
}

/** Photo avatar with an initials fallback. Decorative: label the parent instead. */
export const Avatar = memo(function Avatar({ name, uri, size = 40 }: AvatarProps) {
  const { colors } = useTheme();
  const shape = { width: size, height: size, borderRadius: size / 2 };
  if (uri) return <Image source={{ uri }} style={shape} accessibilityIgnoresInvertColors />;
  return (
    <View style={[styles.fallback, shape, { backgroundColor: colors.primarySoft }]}>
      <Typography
        variant={size >= 40 ? 'headline' : 'micro'}
        color={colors.primary}
        maxFontSizeMultiplier={1.2}
        aria-hidden>
        {initials(name)}
      </Typography>
    </View>
  );
});

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
});
