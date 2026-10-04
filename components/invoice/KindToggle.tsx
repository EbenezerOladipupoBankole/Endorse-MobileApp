import React, { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Typography } from '@/components/ui/Typography';
import { triggerHaptic } from '@/lib/haptics';
import { useTheme } from '@/theme';
import type { InvoiceKind } from '@/types/workflows';

const OPTIONS: { value: InvoiceKind; label: string; hint: string }[] = [
  { value: 'invoice', label: 'Invoice', hint: 'Request a payment' },
  { value: 'receipt', label: 'Receipt', hint: 'Record a payment received' },
];

/** Segmented Invoice | Receipt switch. */
export const KindToggle = memo(function KindToggle({ value, onChange }: { value: InvoiceKind; onChange: (kind: InvoiceKind) => void }) {
  const { colors, radius, shadows } = useTheme();
  return (
    <View accessibilityRole="radiogroup" style={[styles.track, { backgroundColor: colors.surfaceMuted, borderRadius: radius.lg }]}>
      {OPTIONS.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => {
              if (selected) return;
              triggerHaptic('selection');
              onChange(option.value);
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`${option.label}. ${option.hint}`}
            style={[styles.option, { borderRadius: radius.md }, selected && [{ backgroundColor: colors.surface }, shadows.sm]]}>
            <Typography variant="calloutStrong" color={selected ? colors.primary : colors.textSecondary}>
              {option.label}
            </Typography>
            <Typography variant="caption" tone="textTertiary" numberOfLines={1}>
              {option.hint}
            </Typography>
          </Pressable>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  track: { flexDirection: 'row', padding: 4, gap: 4 },
  option: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 56, paddingHorizontal: 8, paddingVertical: 6 },
});
