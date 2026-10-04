import { Bell, CircleX, Search } from 'lucide-react-native';
import React, { memo } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { PressableScale } from '@/components/ui/PressableScale';
import { Skeleton } from '@/components/ui/Skeleton';
import { Typography } from '@/components/ui/Typography';
import { fontFamily, useTheme } from '@/theme';

interface DashboardHeaderProps {
  greeting: string;
  /** Undefined while the profile is loading. */
  name?: string;
  avatarUrl?: string;
  unreadCount: number;
  onPressAvatar: () => void;
  onPressNotifications: () => void;
  query: string;
  onChangeQuery: (value: string) => void;
  searchFocused: boolean;
  onSearchFocusChange: (focused: boolean) => void;
  onCancelSearch: () => void;
}

export const DashboardHeader = memo(function DashboardHeader({
  greeting,
  name,
  avatarUrl,
  unreadCount,
  onPressAvatar,
  onPressNotifications,
  query,
  onChangeQuery,
  searchFocused,
  onSearchFocusChange,
  onCancelSearch,
}: DashboardHeaderProps) {
  const { colors, spacing, radius, shadows, isDark } = useTheme();
  const searching = searchFocused || query.length > 0;
  const badge = unreadCount > 9 ? '9+' : String(unreadCount);

  return (
    <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.md, gap: spacing.lg }}>
      {!searching ? (
        <View style={styles.topRow}>
          <PressableScale
            onPress={onPressAvatar}
            haptic="selection"
            accessibilityLabel={name ? `${name}, open profile` : 'Open profile'}
            style={styles.identity}>
            <Avatar name={name ?? '?'} uri={avatarUrl} size={44} />
            <View style={styles.identityText}>
              <Typography variant="caption" tone="textSecondary">
                {greeting},
              </Typography>
              {name ? (
                <Typography variant="title1" numberOfLines={1}>
                  {name}
                </Typography>
              ) : (
                <Skeleton width={120} height={22} style={styles.nameSkeleton} />
              )}
            </View>
          </PressableScale>

          <PressableScale
            onPress={onPressNotifications}
            haptic="selection"
            accessibilityLabel={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
            style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.sm]}>
            <Bell size={21} color={colors.text} strokeWidth={2} />
            {unreadCount > 0 ? (
              <View style={[styles.badge, { backgroundColor: colors.status.declined.fg, borderColor: colors.surface }]}>
                <Typography variant="micro" color={isDark ? colors.background : colors.surface} maxFontSizeMultiplier={1}>
                  {badge}
                </Typography>
              </View>
            ) : null}
          </PressableScale>
        </View>
      ) : null}

      <View style={styles.searchRow}>
        <View
          style={[
            styles.search,
            {
              backgroundColor: colors.surface,
              borderColor: searchFocused ? colors.primary : colors.border,
              borderRadius: radius.lg,
            },
            !searchFocused && shadows.sm,
          ]}>
          <Search size={18} color={colors.textTertiary} />
          <TextInput
            value={query}
            onChangeText={onChangeQuery}
            onFocus={() => onSearchFocusChange(true)}
            onBlur={() => onSearchFocusChange(false)}
            placeholder="Search documents, templates, contacts"
            placeholderTextColor={colors.textTertiary}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            accessibilityLabel="Search documents, templates and contacts"
            style={[styles.input, { color: colors.text, fontFamily: fontFamily.medium }]}
          />
          {query.length > 0 ? (
            <Pressable onPress={() => onChangeQuery('')} hitSlop={10} accessibilityRole="button" accessibilityLabel="Clear search">
              <CircleX size={18} color={colors.textTertiary} />
            </Pressable>
          ) : null}
        </View>
        {searching ? (
          <Pressable onPress={onCancelSearch} accessibilityRole="button" style={styles.cancel} hitSlop={6}>
            <Typography variant="calloutStrong" color={colors.primary}>
              Cancel
            </Typography>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  identity: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
  identityText: { flex: 1 },
  nameSkeleton: { marginTop: 4 },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  // The container border already shows focus; drop the browser's inner outline on web.
  input: { flex: 1, fontSize: 15, paddingVertical: 10, ...(Platform.OS === 'web' ? { outlineWidth: 0 } : null) },
  cancel: { minHeight: 44, justifyContent: 'center' },
});
