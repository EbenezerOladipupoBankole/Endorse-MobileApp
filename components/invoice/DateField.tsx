import { CalendarDays, ChevronRight } from 'lucide-react-native';
import React, { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Typography } from '@/components/ui/Typography';
import { useTheme } from '@/theme';
import { formatDate } from './format';

interface DateFieldProps {
  label: string;
  value: number;
  onPress: () => void;
  hint?: string;
}

/** Tappable date row that opens the calendar sheet. */
export const DateField = memo(function DateField({ label, value, onPress, hint }: DateFieldProps) {
  const { colors, radius, spacing } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${formatDate(value)}. Change date`}
      style={({ pressed }) => [
        styles.row,
        { gap: spacing.md, borderColor: colors.borderStrong, borderRadius: radius.md, backgroundColor: pressed ? colors.surfaceMuted : colors.surface },
      ]}>
      <View style={[styles.icon, { backgroundColor: colors.primarySoft, borderRadius: radius.sm }]}>
        <CalendarDays size={18} color={colors.primary} />
      </View>
      <View style={styles.flex}>
        <Typography variant="caption" tone="textSecondary">
          {label}
        </Typography>
        <Typography variant="bodyStrong">{formatDate(value)}</Typography>
        {hint ? (
          <Typography variant="caption" tone="textTertiary">
            {hint}
          </Typography>
        ) : null}
      </View>
      <ChevronRight size={18} color={colors.textTertiary} />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 60, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1 },
  icon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});
