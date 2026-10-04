import { Ellipsis } from 'lucide-react-native';
import React, { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/ui/PressableScale';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusChip } from '@/components/ui/StatusChip';
import { Typography } from '@/components/ui/Typography';
import { DOCUMENT_STATUS_META, formatDue, formatPeople, formatRelative } from '@/lib/dashboard/format';
import { useTheme, type Theme } from '@/theme';
import type { DocumentSummary } from '@/types/dashboard';

/** Grouped-list positioning so consecutive rows render as one rounded card. */
export interface GroupPosition {
  isFirst: boolean;
  isLast: boolean;
}

export function groupedRowStyle({ colors, radius, spacing }: Theme, { isFirst, isLast }: GroupPosition) {
  return {
    marginHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderTopWidth: isFirst ? StyleSheet.hairlineWidth : 0,
    borderBottomWidth: isLast ? StyleSheet.hairlineWidth : 0,
    borderTopLeftRadius: isFirst ? radius.xl : 0,
    borderTopRightRadius: isFirst ? radius.xl : 0,
    borderBottomLeftRadius: isLast ? radius.xl : 0,
    borderBottomRightRadius: isLast ? radius.xl : 0,
  };
}

/** Small "page" illustration tinted by document status. */
const DocumentThumbnail = memo(function DocumentThumbnail({ doc }: { doc: DocumentSummary }) {
  const { colors } = useTheme();
  const tone = colors.status[DOCUMENT_STATUS_META[doc.status].tone];
  return (
    <View style={[styles.thumb, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
      <View style={[styles.thumbBand, { backgroundColor: tone.fg }]} />
      <View style={[styles.thumbLine, { backgroundColor: colors.borderStrong, width: 20 }]} />
      <View style={[styles.thumbLine, { backgroundColor: colors.borderStrong, width: 24 }]} />
      <View style={[styles.thumbLine, { backgroundColor: colors.borderStrong, width: 14 }]} />
      <Typography variant="micro" tone="textSecondary" style={styles.thumbType} maxFontSizeMultiplier={1}>
        {doc.fileType.toUpperCase()}
      </Typography>
    </View>
  );
});

interface DocumentListItemProps extends GroupPosition {
  doc: DocumentSummary;
  now: number;
  onPress: (doc: DocumentSummary) => void;
  onMore: (doc: DocumentSummary) => void;
}

export const DocumentListItem = memo(function DocumentListItem({ doc, now, isFirst, isLast, onPress, onMore }: DocumentListItemProps) {
  const theme = useTheme();
  const { colors, spacing } = theme;
  const incoming = doc.status === 'awaiting_me';
  const people = incoming ? `From ${doc.sender.name}` : `To ${formatPeople(doc.recipients)}`;
  const expiring = doc.isExpiringSoon && doc.expiresAt ? formatDue(doc.expiresAt, now) : null;
  const statusLabel = DOCUMENT_STATUS_META[doc.status].label;

  return (
    <View style={groupedRowStyle(theme, { isFirst, isLast })}>
      <View style={[styles.row, { paddingHorizontal: spacing.lg }]}>
        <PressableScale
          onPress={() => onPress(doc)}
          haptic="selection"
          scaleTo={0.985}
          accessibilityLabel={`${doc.title}. ${people}. ${statusLabel}. Updated ${formatRelative(doc.updatedAt, now)}${expiring ? `. ${expiring}` : ''}`}
          style={styles.main}>
          <DocumentThumbnail doc={doc} />
          <View style={styles.text}>
            <Typography variant="headline" numberOfLines={1}>
              {doc.title}
            </Typography>
            <Typography variant="caption" tone="textSecondary" numberOfLines={1}>
              {people}
            </Typography>
            <View style={styles.meta}>
              <StatusChip status={doc.status} />
              <Typography variant="caption" tone="textTertiary" numberOfLines={1} style={styles.date}>
                {expiring ? (
                  <Typography variant="captionStrong" color={colors.status.expiring.fg}>
                    {expiring}
                  </Typography>
                ) : (
                  formatRelative(doc.updatedAt, now)
                )}
              </Typography>
            </View>
          </View>
        </PressableScale>
        <Pressable
          onPress={() => onMore(doc)}
          accessibilityRole="button"
          accessibilityLabel={`More actions for ${doc.title}`}
          style={({ pressed }) => [styles.more, pressed && { backgroundColor: colors.surfaceMuted }]}>
          <Ellipsis size={20} color={colors.textSecondary} />
        </Pressable>
      </View>
      {!isLast ? <View style={[styles.separator, { backgroundColor: colors.border, marginLeft: spacing.lg + 52 }]} /> : null}
    </View>
  );
});

export const DocumentListItemSkeleton = memo(function DocumentListItemSkeleton(props: GroupPosition) {
  const theme = useTheme();
  return (
    <View style={groupedRowStyle(theme, props)}>
      <View style={[styles.row, styles.skeletonRow, { paddingHorizontal: theme.spacing.lg }]}>
        <Skeleton width={40} height={50} radius={8} />
        <View style={[styles.text, styles.skeletonText]}>
          <Skeleton width="75%" height={14} />
          <Skeleton width="45%" height={12} />
          <Skeleton width={84} height={18} radius={999} />
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  text: { flex: 1, gap: 3 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 },
  date: { flexShrink: 1 },
  more: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: -10 },
  separator: { height: StyleSheet.hairlineWidth },
  thumb: { width: 40, height: 50, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth, padding: 6, paddingTop: 0, gap: 4, overflow: 'hidden' },
  thumbBand: { height: 4, marginHorizontal: -6, marginBottom: 3 },
  thumbLine: { height: 3, borderRadius: 2 },
  thumbType: { fontSize: 7, lineHeight: 9, letterSpacing: 0.2, marginTop: 'auto' },
  skeletonRow: { gap: 12, paddingVertical: 14 },
  skeletonText: { gap: 8 },
});
