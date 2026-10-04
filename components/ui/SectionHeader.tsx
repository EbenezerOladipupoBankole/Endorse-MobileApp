import React, { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';
import { Typography } from './Typography';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Rendered under the title, e.g. an active filter pill. */
  accessory?: React.ReactNode;
}

export const SectionHeader = memo(function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
  accessory,
}: SectionHeaderProps) {
  const { colors, spacing } = useTheme();
  return (
    <View style={[styles.row, { paddingHorizontal: spacing.xl }]}>
      <View style={styles.titles}>
        <Typography variant="title2" accessibilityRole="header">
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="caption" tone="textSecondary">
            {subtitle}
          </Typography>
        ) : null}
        {accessory ? <View style={styles.accessory}>{accessory}</View> : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`${actionLabel}: ${title}`}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
          <Typography variant="calloutStrong" color={colors.primary}>
            {actionLabel}
          </Typography>
        </Pressable>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  titles: { flex: 1, gap: 2 },
  accessory: { flexDirection: 'row', marginTop: 6 },
  action: { minHeight: 44, justifyContent: 'center', paddingLeft: 8 },
  pressed: { opacity: 0.6 },
});
