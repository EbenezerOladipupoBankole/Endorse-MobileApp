import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';
import { Typography } from './Typography';

interface StepIndicatorProps {
  steps: string[];
  current: number;
}

/** Segmented progress bar with step labels, e.g. Document → Recipients → Review. */
export const StepIndicator = memo(function StepIndicator({ steps, current }: StepIndicatorProps) {
  const { colors, spacing } = useTheme();
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${current + 1} of ${steps.length}: ${steps[current]}`}
      accessibilityValue={{ min: 1, max: steps.length, now: current + 1 }}
      style={[styles.row, { paddingHorizontal: spacing.xl, gap: spacing.sm }]}>
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <View key={step} style={styles.step}>
            <View style={[styles.bar, { backgroundColor: done || active ? colors.primary : colors.border }]} />
            <Typography
              variant="micro"
              color={active ? colors.primary : done ? colors.textSecondary : colors.textTertiary}
              numberOfLines={1}
              maxFontSizeMultiplier={1.2}>
              {`${i + 1}. ${step}`.toUpperCase()}
            </Typography>
          </View>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  step: { flex: 1, gap: 6 },
  bar: { height: 4, borderRadius: 2 },
});
