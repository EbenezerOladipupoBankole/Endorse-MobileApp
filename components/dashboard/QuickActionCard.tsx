import { LinearGradient } from 'expo-linear-gradient';
import type { LucideIcon } from 'lucide-react-native';
import { ArrowUpRight, FileUp, LayoutTemplate, PenLine, ReceiptText, Send } from 'lucide-react-native';
import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/ui/PressableScale';
import { Typography } from '@/components/ui/Typography';
import type { CreateAction } from '@/hooks/useCreateActions';
import { useTheme, type StatusColor } from '@/theme';

interface QuickActionCardProps {
  icon: LucideIcon;
  label: string;
  description?: string;
  onPress: () => void;
  /** `brand` = navy gradient hero, `featured` = large surface card, `tile` = compact. */
  variant: 'brand' | 'featured' | 'tile';
  tone?: StatusColor;
}

export const QuickActionCard = memo(function QuickActionCard({ icon: Icon, label, description, onPress, variant, tone }: QuickActionCardProps) {
  const { colors, radius, spacing, shadows } = useTheme();
  const well = tone ?? { fg: colors.primary, soft: colors.primarySoft };
  const a11y = description ? `${label}. ${description}` : label;

  if (variant === 'brand') {
    return (
      <PressableScale onPress={onPress} haptic="medium" accessibilityLabel={a11y} style={[styles.flex, shadows.md, { borderRadius: radius.xl }]}>
        <LinearGradient
          colors={[colors.brandSurface, colors.brandSurfaceEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.featured, { borderRadius: radius.xl, padding: spacing.lg }]}>
          <View style={styles.featuredTop}>
            <View style={[styles.well, { backgroundColor: colors.accent, borderRadius: radius.md }]}>
              <Icon size={22} color={colors.onAccent} strokeWidth={2.2} />
            </View>
            <ArrowUpRight size={18} color={colors.onBrandMuted} />
          </View>
          <View style={styles.featuredText}>
            <Typography variant="title3" tone="onBrand">
              {label}
            </Typography>
            {description ? (
              <Typography variant="caption" tone="onBrandMuted" numberOfLines={2}>
                {description}
              </Typography>
            ) : null}
          </View>
        </LinearGradient>
      </PressableScale>
    );
  }

  if (variant === 'featured') {
    return (
      <PressableScale
        onPress={onPress}
        accessibilityLabel={a11y}
        style={[styles.flex, styles.featured, shadows.sm, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.xl, padding: spacing.lg }]}>
        <View style={styles.featuredTop}>
          <View style={[styles.well, { backgroundColor: well.soft, borderRadius: radius.md }]}>
            <Icon size={22} color={well.fg} strokeWidth={2.2} />
          </View>
          <ArrowUpRight size={18} color={colors.textTertiary} />
        </View>
        <View style={styles.featuredText}>
          <Typography variant="title3">{label}</Typography>
          {description ? (
            <Typography variant="caption" tone="textSecondary" numberOfLines={2}>
              {description}
            </Typography>
          ) : null}
        </View>
      </PressableScale>
    );
  }

  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={a11y}
      style={[styles.flex, styles.tile, shadows.sm, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, paddingVertical: spacing.md }]}>
      <View style={[styles.tileWell, { backgroundColor: well.soft, borderRadius: radius.md }]}>
        <Icon size={20} color={well.fg} strokeWidth={2.2} />
      </View>
      <Typography variant="captionStrong" style={styles.tileLabel} numberOfLines={2} maxFontSizeMultiplier={1.4}>
        {label}
      </Typography>
    </PressableScale>
  );
});

/** The dashboard's quick-action block: two featured cards over three compact tiles. */
export const QuickActions = memo(function QuickActions({ onAction }: { onAction: (action: CreateAction) => void }) {
  const { colors, spacing } = useTheme();
  return (
    <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
      <View style={[styles.row, { gap: spacing.md }]}>
        <QuickActionCard variant="brand" icon={PenLine} label="Sign a document" description="Add your signature in seconds" onPress={() => onAction('sign')} />
        <QuickActionCard variant="featured" icon={Send} label="Send for signature" description="Request from others" tone={colors.status.success} onPress={() => onAction('send')} />
      </View>
      <View style={[styles.row, { gap: spacing.md }]}>
        <QuickActionCard variant="tile" icon={FileUp} label="Upload / scan" tone={colors.status.waiting} onPress={() => onAction('scan')} />
        <QuickActionCard variant="tile" icon={LayoutTemplate} label="New template" tone={colors.status.expiring} onPress={() => onAction('template')} />
        <QuickActionCard variant="tile" icon={ReceiptText} label="Create invoice" onPress={() => onAction('invoice')} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row' },
  featured: { minHeight: 148, justifyContent: 'space-between', gap: 16 },
  featuredTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  featuredText: { gap: 4 },
  well: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  tile: { alignItems: 'center', gap: 8, borderWidth: StyleSheet.hairlineWidth, minHeight: 96, paddingHorizontal: 6 },
  tileWell: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  tileLabel: { textAlign: 'center' },
});
