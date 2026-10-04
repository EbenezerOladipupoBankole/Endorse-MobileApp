import { Clock } from 'lucide-react-native';
import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Typography } from '@/components/ui/Typography';
import { useTheme } from '@/theme';
import type { Person } from '@/types/dashboard';

/** Amber banner shown when the envelope expires soon. */
export const ExpiryBanner = memo(function ExpiryBanner({ label }: { label: string }) {
  const { colors, radius, spacing } = useTheme();
  const tone = colors.status.expiring;
  return (
    <View
      accessibilityRole="alert"
      style={[styles.banner, { backgroundColor: tone.soft, borderRadius: radius.lg, padding: spacing.md, marginHorizontal: spacing.xl }]}>
      <Clock size={18} color={tone.fg} strokeWidth={2.2} />
      <View style={styles.flex}>
        <Typography variant="calloutStrong" color={tone.fg}>
          {label}
        </Typography>
        <Typography variant="caption" tone="textSecondary">
          This request expires soon. Unsigned recipients will lose access.
        </Typography>
      </View>
    </View>
  );
});

export const MessageCard = memo(function MessageCard({ sender, message }: { sender: Person; message: string }) {
  const { colors, spacing } = useTheme();
  return (
    <Card style={{ marginHorizontal: spacing.xl, gap: spacing.md }}>
      <View style={styles.messageHead}>
        <Avatar name={sender.name} size={36} />
        <View style={styles.flex}>
          <Typography variant="captionStrong" tone="textSecondary">
            Message from sender
          </Typography>
          <Typography variant="headline" numberOfLines={1}>
            {sender.name}
          </Typography>
        </View>
      </View>
      <View style={[styles.quote, { borderLeftColor: colors.primary }]}>
        <Typography variant="body" tone="textSecondary">
          “{message}”
        </Typography>
      </View>
    </Card>
  );
});

export interface DetailRow {
  label: string;
  value: string;
}

export const DetailsCard = memo(function DetailsCard({ rows }: { rows: DetailRow[] }) {
  const { colors, spacing } = useTheme();
  return (
    <Card style={{ marginHorizontal: spacing.xl, paddingVertical: spacing.xs }}>
      {rows.map((row, i) => (
        <View
          key={row.label}
          accessible
          accessibilityLabel={`${row.label}: ${row.value}`}
          style={[styles.detail, i < rows.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
          <Typography variant="callout" tone="textSecondary">
            {row.label}
          </Typography>
          <Typography variant="calloutStrong" numberOfLines={1} style={styles.detailValue}>
            {row.value}
          </Typography>
        </View>
      ))}
    </Card>
  );
});

/** Placeholder layout while the document loads. */
export function DocumentDetailSkeleton() {
  const { spacing, radius } = useTheme();
  return (
    <View accessible accessibilityLabel="Loading document" accessibilityRole="progressbar" style={{ paddingHorizontal: spacing.xl, gap: spacing.lg, paddingTop: spacing.sm }}>
      <Skeleton height={248} radius={radius.xl} />
      <Skeleton width="80%" height={26} />
      <Skeleton width={110} height={22} radius={999} />
      <Skeleton width="60%" height={14} />
      <Skeleton height={200} radius={radius.xl} />
      <Skeleton height={140} radius={radius.xl} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  banner: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  messageHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  quote: { borderLeftWidth: 3, paddingLeft: 12 },
  detail: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, minHeight: 48, paddingVertical: 10 },
  detailValue: { flexShrink: 1, textAlign: 'right' },
});
