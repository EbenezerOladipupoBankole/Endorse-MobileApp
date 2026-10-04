import type { LucideIcon } from 'lucide-react-native';
import { CircleCheck, Clock, FilePen, Hourglass, PenLine } from 'lucide-react-native';
import React, { memo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/ui/PressableScale';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/StateViews';
import { Typography } from '@/components/ui/Typography';
import { STATUS_FILTER_META } from '@/lib/dashboard/format';
import { useTheme } from '@/theme';
import type { Resource, StatusCount, StatusFilter } from '@/types/dashboard';

const FILTER_ICONS: Record<StatusFilter, LucideIcon> = {
  awaiting_me: PenLine,
  waiting_on_others: Hourglass,
  expiring_soon: Clock,
  completed: CircleCheck,
  draft: FilePen,
};

const CARD_WIDTH = 136;

interface StatCardProps {
  filter: StatusFilter;
  count: number;
  selected: boolean;
  onPress: (filter: StatusFilter) => void;
}

export const StatCard = memo(function StatCard({ filter, count, selected, onPress }: StatCardProps) {
  const { colors, radius, spacing, shadows } = useTheme();
  const meta = STATUS_FILTER_META[filter];
  const tone = colors.status[meta.tone];
  const Icon = FILTER_ICONS[filter];
  return (
    <PressableScale
      onPress={() => onPress(filter)}
      haptic="selection"
      accessibilityRole="togglebutton"
      accessibilityState={{ selected }}
      accessibilityLabel={`${meta.label}: ${count} ${count === 1 ? 'document' : 'documents'}`}
      accessibilityHint={selected ? 'Clears the filter on recent documents' : 'Filters recent documents'}
      style={[
        styles.card,
        shadows.sm,
        {
          backgroundColor: selected ? tone.soft : colors.surface,
          borderColor: selected ? tone.fg : colors.border,
          borderRadius: radius.lg,
          padding: spacing.md,
        },
      ]}>
      <View style={[styles.well, { backgroundColor: selected ? colors.surface : tone.soft, borderRadius: radius.sm }]}>
        <Icon size={18} color={tone.fg} strokeWidth={2.2} />
      </View>
      <Typography variant="stat" maxFontSizeMultiplier={1.3}>
        {count}
      </Typography>
      <Typography variant="captionStrong" tone="textSecondary" numberOfLines={2} maxFontSizeMultiplier={1.4}>
        {meta.label}
      </Typography>
    </PressableScale>
  );
});

interface StatusOverviewProps {
  resource: Resource<StatusCount[]>;
  selected: StatusFilter | null;
  onSelect: (filter: StatusFilter) => void;
  onRetry: () => void;
}

/** Horizontal carousel of status counts; each card toggles a filter on Recent documents. */
export const StatusOverview = memo(function StatusOverview({ resource, selected, onSelect, onRetry }: StatusOverviewProps) {
  const { spacing, radius } = useTheme();

  if (resource.status === 'error' && !resource.data) {
    return <ErrorState title="Couldn't load your overview" onRetry={onRetry} />;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingVertical: spacing.xs, gap: spacing.md }}>
      {resource.data
        ? resource.data.map((item) => (
            <StatCard key={item.filter} filter={item.filter} count={item.count} selected={selected === item.filter} onPress={onSelect} />
          ))
        : [0, 1, 2, 3].map((i) => <Skeleton key={i} width={CARD_WIDTH} height={124} radius={radius.lg} />)}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  card: { width: CARD_WIDTH, minHeight: 124, gap: 6, borderWidth: 1 },
  well: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
});
