import type { LucideIcon } from 'lucide-react-native';
import { ChevronRight } from 'lucide-react-native';
import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import type { StatusColor } from '@/theme';
import { useTheme } from '@/theme';
import { PressableScale } from './PressableScale';
import { Typography } from './Typography';

interface ListOptionProps {
  icon: LucideIcon;
  label: string;
  description?: string;
  onPress: () => void;
  /** Icon well colors; defaults to the brand blue tint. */
  tone?: StatusColor;
  destructive?: boolean;
}

/** Icon + label + description row used in sheets and menus. */
export const ListOption = memo(function ListOption({ icon: Icon, label, description, onPress, tone, destructive }: ListOptionProps) {
  const { colors, radius, spacing } = useTheme();
  const well = destructive ? colors.status.declined : (tone ?? { fg: colors.primary, soft: colors.primarySoft });
  return (
    <PressableScale
      onPress={onPress}
      haptic="selection"
      scaleTo={0.98}
      accessibilityLabel={description ? `${label}. ${description}` : label}
      style={[styles.row, { paddingHorizontal: spacing.xl }]}>
      <View style={[styles.well, { backgroundColor: well.soft, borderRadius: radius.md }]}>
        <Icon size={22} color={well.fg} strokeWidth={2} />
      </View>
      <View style={styles.text}>
        <Typography variant="bodyStrong" color={destructive ? well.fg : colors.text}>
          {label}
        </Typography>
        {description ? (
          <Typography variant="caption" tone="textSecondary">
            {description}
          </Typography>
        ) : null}
      </View>
      {!destructive ? <ChevronRight size={18} color={colors.textTertiary} /> : null}
    </PressableScale>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 64, paddingVertical: 10 },
  well: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 2 },
});
