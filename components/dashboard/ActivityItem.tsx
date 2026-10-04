import type { LucideIcon } from 'lucide-react-native';
import { Ban, BellRing, CircleCheck, CircleX, Eye, PenLine, Send } from 'lucide-react-native';
import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/ui/PressableScale';
import { Skeleton } from '@/components/ui/Skeleton';
import { Typography } from '@/components/ui/Typography';
import { formatRelative } from '@/lib/dashboard/format';
import { useTheme, type ColorTokens } from '@/theme';
import type { ActivityEvent, ActivityType } from '@/types/dashboard';
import { groupedRowStyle, type GroupPosition } from './DocumentListItem';

const ACTIVITY_META: Record<ActivityType, { icon: LucideIcon; verb: string; tone: keyof ColorTokens['status'] }> = {
  sent: { icon: Send, verb: 'sent', tone: 'awaiting' },
  viewed: { icon: Eye, verb: 'viewed', tone: 'draft' },
  signed: { icon: PenLine, verb: 'signed', tone: 'success' },
  completed: { icon: CircleCheck, verb: 'completed', tone: 'success' },
  declined: { icon: CircleX, verb: 'declined', tone: 'declined' },
  reminder_sent: { icon: BellRing, verb: 'sent a reminder for', tone: 'waiting' },
  voided: { icon: Ban, verb: 'voided', tone: 'declined' },
};

interface ActivityItemProps extends GroupPosition {
  event: ActivityEvent;
  now: number;
  onPress: (event: ActivityEvent) => void;
}

/** One timeline entry; connector lines link consecutive events. */
export const ActivityItem = memo(function ActivityItem({ event, now, isFirst, isLast, onPress }: ActivityItemProps) {
  const theme = useTheme();
  const { colors, spacing } = theme;
  const meta = ACTIVITY_META[event.type];
  const tone = colors.status[meta.tone];
  const Icon = meta.icon;
  const when = formatRelative(event.timestamp, now);

  return (
    <View style={groupedRowStyle(theme, { isFirst, isLast })}>
      <PressableScale
        onPress={() => onPress(event)}
        haptic="selection"
        scaleTo={0.985}
        accessibilityLabel={`${event.actorName} ${meta.verb} ${event.documentTitle}, ${when}`}
        style={[styles.row, { paddingHorizontal: spacing.lg }]}>
        <View style={styles.rail}>
          <View style={[styles.connector, { backgroundColor: isFirst ? 'transparent' : colors.border }]} />
          <View style={[styles.icon, { backgroundColor: tone.soft }]}>
            <Icon size={15} color={tone.fg} strokeWidth={2.3} />
          </View>
          <View style={[styles.connector, { backgroundColor: isLast ? 'transparent' : colors.border }]} />
        </View>
        <View style={styles.text}>
          <Typography variant="callout" tone="textSecondary" numberOfLines={2}>
            <Typography variant="calloutStrong">{event.actorName}</Typography> {meta.verb}{' '}
            <Typography variant="calloutStrong">{event.documentTitle}</Typography>
          </Typography>
          <Typography variant="caption" tone="textTertiary">
            {when}
          </Typography>
        </View>
      </PressableScale>
    </View>
  );
});

export const ActivityItemSkeleton = memo(function ActivityItemSkeleton(props: GroupPosition) {
  const theme = useTheme();
  return (
    <View style={groupedRowStyle(theme, props)}>
      <View style={[styles.row, styles.skeleton, { paddingHorizontal: theme.spacing.lg }]}>
        <Skeleton width={32} height={32} radius={16} />
        <View style={[styles.text, styles.skeletonText]}>
          <Skeleton width="85%" height={13} />
          <Skeleton width="30%" height={11} />
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'stretch', gap: 12, minHeight: 64 },
  rail: { width: 32, alignItems: 'center' },
  connector: { width: 2, flex: 1, minHeight: 10 },
  icon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, justifyContent: 'center', gap: 2, paddingVertical: 12 },
  skeleton: { alignItems: 'center', paddingVertical: 14 },
  skeletonText: { gap: 8, paddingVertical: 0 },
});
