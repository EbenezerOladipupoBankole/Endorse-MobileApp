import { router } from 'expo-router';
import type { LucideIcon } from 'lucide-react-native';
import { ChevronLeft, X } from 'lucide-react-native';
import React, { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';
import { Typography } from './Typography';

interface HeaderAction {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
}

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  /** `back` shows a chevron, `close` an X (for modal-style flows), `none` hides it. */
  leading?: 'back' | 'close' | 'none';
  onLeadingPress?: () => void;
  actions?: HeaderAction[];
}

export function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/(tabs)/home');
}

/** Circular 44pt icon button used in headers. */
export const HeaderIconButton = memo(function HeaderIconButton({ icon: Icon, label, onPress }: HeaderAction) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      style={({ pressed }) => [
        styles.iconButton,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && { backgroundColor: colors.surfaceMuted },
      ]}>
      <Icon size={20} color={colors.text} strokeWidth={2.2} />
    </Pressable>
  );
});

/** Standard top bar: back/close, title + subtitle, up to two trailing actions. */
export const ScreenHeader = memo(function ScreenHeader({
  title,
  subtitle,
  leading = 'back',
  onLeadingPress = goBack,
  actions = [],
}: ScreenHeaderProps) {
  const { spacing } = useTheme();
  return (
    <View style={[styles.row, { paddingHorizontal: spacing.xl, paddingVertical: spacing.sm }]}>
      {leading !== 'none' ? (
        <HeaderIconButton icon={leading === 'close' ? X : ChevronLeft} label={leading === 'close' ? 'Close' : 'Back'} onPress={onLeadingPress} />
      ) : null}
      <View style={styles.titles}>
        <Typography variant="title3" numberOfLines={1} accessibilityRole="header">
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="caption" tone="textSecondary" numberOfLines={1}>
            {subtitle}
          </Typography>
        ) : null}
      </View>
      {actions.map((action) => (
        <HeaderIconButton key={action.label} {...action} />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 60 },
  titles: { flex: 1, gap: 1 },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
