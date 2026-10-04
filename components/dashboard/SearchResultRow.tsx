import type { LucideIcon } from 'lucide-react-native';
import { ChevronRight } from 'lucide-react-native';
import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { PressableScale } from '@/components/ui/PressableScale';
import { Typography } from '@/components/ui/Typography';
import { useTheme } from '@/theme';
import { groupedRowStyle, type GroupPosition } from './DocumentListItem';

interface SearchResultRowProps extends GroupPosition {
  title: string;
  subtitle: string;
  onPress: () => void;
  /** Shows an icon well… */
  icon?: LucideIcon;
  /** …or an initials avatar. */
  avatarName?: string;
}

export const SearchResultRow = memo(function SearchResultRow({ title, subtitle, onPress, icon: Icon, avatarName, isFirst, isLast }: SearchResultRowProps) {
  const theme = useTheme();
  const { colors, spacing, radius } = theme;
  return (
    <View style={groupedRowStyle(theme, { isFirst, isLast })}>
      <PressableScale
        onPress={onPress}
        haptic="selection"
        scaleTo={0.985}
        accessibilityLabel={`${title}. ${subtitle}`}
        style={[styles.row, { paddingHorizontal: spacing.lg }]}>
        {avatarName ? (
          <Avatar name={avatarName} size={40} />
        ) : Icon ? (
          <View style={[styles.well, { backgroundColor: colors.primarySoft, borderRadius: radius.md }]}>
            <Icon size={20} color={colors.primary} />
          </View>
        ) : null}
        <View style={styles.text}>
          <Typography variant="headline" numberOfLines={1}>
            {title}
          </Typography>
          <Typography variant="caption" tone="textSecondary" numberOfLines={1}>
            {subtitle}
          </Typography>
        </View>
        <ChevronRight size={18} color={colors.textTertiary} />
      </PressableScale>
      {!isLast ? <View style={[styles.separator, { backgroundColor: colors.border, marginLeft: spacing.lg + 52 }]} /> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, paddingVertical: 12 },
  well: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 2 },
  separator: { height: StyleSheet.hairlineWidth },
});
