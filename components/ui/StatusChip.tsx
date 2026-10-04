import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { DOCUMENT_STATUS_META } from '@/lib/dashboard/format';
import { useTheme } from '@/theme';
import type { DocumentStatus } from '@/types/dashboard';
import { Typography } from './Typography';

interface StatusChipProps {
  status: DocumentStatus;
  /** Override the default label. */
  label?: string;
}

export const StatusChip = memo(function StatusChip({ status, label }: StatusChipProps) {
  const { colors } = useTheme();
  const meta = DOCUMENT_STATUS_META[status];
  const tone = colors.status[meta.tone];
  const text = label ?? meta.label;
  return (
    <View style={[styles.chip, { backgroundColor: tone.soft }]} accessible accessibilityLabel={`Status: ${text}`}>
      <View style={[styles.dot, { backgroundColor: tone.fg }]} />
      <Typography variant="micro" color={tone.fg} maxFontSizeMultiplier={1.3} numberOfLines={1}>
        {text}
      </Typography>
    </View>
  );
});

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
