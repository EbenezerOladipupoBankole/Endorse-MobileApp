import type { LucideIcon } from 'lucide-react-native';
import React, { memo } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { useTheme } from '@/theme';
import { PressableScale } from './PressableScale';
import { Typography } from './Typography';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  icon?: LucideIcon;
  /** Optional count badge, e.g. "Legal 12". */
  count?: number;
}

/** Selectable pill for filters and single-choice options. */
export const Chip = memo(function Chip({ label, selected, onPress, icon: Icon, count }: ChipProps) {
  const { colors } = useTheme();
  const fg = selected ? colors.onPrimary : colors.text;
  return (
    <PressableScale
      onPress={onPress}
      haptic="selection"
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      accessibilityLabel={count !== undefined ? `${label}, ${count}` : label}
      style={[
        styles.chip,
        selected
          ? { backgroundColor: colors.primary, borderColor: colors.primary }
          : { backgroundColor: colors.surface, borderColor: colors.borderStrong },
      ]}>
      {Icon ? <Icon size={15} color={fg} strokeWidth={2.2} /> : null}
      <Typography variant="captionStrong" color={fg} maxFontSizeMultiplier={1.3}>
        {label}
      </Typography>
      {count !== undefined ? (
        <Typography variant="captionStrong" color={selected ? colors.onPrimary : colors.textTertiary} maxFontSizeMultiplier={1.3}>
          {count}
        </Typography>
      ) : null}
    </PressableScale>
  );
});

/** Horizontally scrolling row of chips with screen gutters. */
export function ChipRow({ children }: { children: React.ReactNode }) {
  const { spacing } = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: spacing.sm }}
      keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
  },
});
