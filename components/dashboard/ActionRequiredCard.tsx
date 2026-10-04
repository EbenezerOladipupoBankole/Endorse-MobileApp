import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, CircleCheck, PenLine } from 'lucide-react-native';
import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { PressableScale } from '@/components/ui/PressableScale';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/StateViews';
import { Typography } from '@/components/ui/Typography';
import { formatDue, formatRelative } from '@/lib/dashboard/format';
import { useTheme } from '@/theme';
import type { DocumentSummary, Resource } from '@/types/dashboard';

interface ActionRequiredCardProps {
  resource: Resource<DocumentSummary[]>;
  onSign: (doc: DocumentSummary) => void;
  onRetry: () => void;
}

const MAX_SECONDARY = 2;

/** Highlighted hero for documents that need the user's signature right now. */
export const ActionRequiredCard = memo(function ActionRequiredCard({ resource, onSign, onRetry }: ActionRequiredCardProps) {
  const { colors, radius, spacing, shadows } = useTheme();
  const outer = { marginHorizontal: spacing.xl };

  if (resource.status === 'error' && !resource.data) {
    return <ErrorState title="Couldn't load documents to sign" onRetry={onRetry} />;
  }
  if (!resource.data) {
    return <Skeleton height={196} radius={radius.xl} style={outer} />;
  }

  const docs = resource.data;
  const now = resource.fetchedAt ?? 0;

  if (docs.length === 0) {
    const tone = colors.status.success;
    return (
      <View
        accessible
        accessibilityLabel="You're all caught up. Nothing needs your signature."
        style={[outer, styles.caughtUp, { backgroundColor: tone.soft, borderRadius: radius.xl, padding: spacing.lg }]}>
        <View style={[styles.caughtUpIcon, { backgroundColor: colors.surface }]}>
          <CircleCheck size={22} color={tone.fg} />
        </View>
        <View style={styles.flex}>
          <Typography variant="headline">You&apos;re all caught up</Typography>
          <Typography variant="caption" tone="textSecondary">
            Nothing needs your signature right now.
          </Typography>
        </View>
      </View>
    );
  }

  const [primary, ...others] = docs;
  const dueLabel = primary.expiresAt ? formatDue(primary.expiresAt, now) : formatRelative(primary.updatedAt, now);

  return (
    <View style={[outer, shadows.lg, { shadowColor: colors.brandSurfaceEnd, borderRadius: radius.xl }]}>
      <LinearGradient
        colors={[colors.brandSurface, colors.brandSurfaceEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, { borderRadius: radius.xl, padding: spacing.xl }]}>
        <View style={styles.kickerRow}>
          <View style={[styles.kicker, { backgroundColor: colors.accent }]}>
            <PenLine size={12} color={colors.onAccent} strokeWidth={2.5} />
            <Typography variant="micro" tone="onAccent" maxFontSizeMultiplier={1.3}>
              ACTION REQUIRED
            </Typography>
          </View>
          <Typography variant="captionStrong" tone="onBrandMuted">
            {docs.length} to sign
          </Typography>
        </View>

        <View style={styles.primaryText}>
          <Typography variant="title2" tone="onBrand" numberOfLines={2}>
            {primary.title}
          </Typography>
          <Typography variant="caption" tone="onBrandMuted" numberOfLines={1}>
            From {primary.sender.name} · {dueLabel} · {primary.pageCount} pages
          </Typography>
        </View>

        <Button
          label="Sign now"
          icon={PenLine}
          variant="accent"
          haptic="medium"
          onPress={() => onSign(primary)}
          accessibilityLabel={`Sign now: ${primary.title}`}
          style={styles.signButton}
        />

        {others.length > 0 ? (
          <View style={[styles.others, { borderTopColor: 'rgba(255,255,255,0.14)' }]}>
            {others.slice(0, MAX_SECONDARY).map((doc) => (
              <PressableScale
                key={doc.id}
                onPress={() => onSign(doc)}
                haptic="selection"
                scaleTo={0.98}
                accessibilityLabel={`Sign ${doc.title}, from ${doc.sender.name}`}
                style={styles.otherRow}>
                <View style={styles.flex}>
                  <Typography variant="calloutStrong" tone="onBrand" numberOfLines={1}>
                    {doc.title}
                  </Typography>
                  <Typography variant="caption" tone="onBrandMuted" numberOfLines={1}>
                    {doc.sender.name} · {doc.expiresAt ? formatDue(doc.expiresAt, now) : formatRelative(doc.updatedAt, now)}
                  </Typography>
                </View>
                <ChevronRight size={18} color={colors.onBrandMuted} />
              </PressableScale>
            ))}
          </View>
        ) : null}
      </LinearGradient>
    </View>
  );
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { gap: 16, overflow: 'hidden' },
  kickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kicker: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999 },
  primaryText: { gap: 4 },
  signButton: { alignSelf: 'stretch' },
  others: { borderTopWidth: 1, paddingTop: 4, marginTop: -2 },
  otherRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52 },
  caughtUp: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  caughtUpIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
