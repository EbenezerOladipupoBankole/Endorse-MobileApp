import { Users } from 'lucide-react-native';
import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/ui/PressableScale';
import { Skeleton } from '@/components/ui/Skeleton';
import { Typography } from '@/components/ui/Typography';
import { useTheme } from '@/theme';
import type { AgreementTemplate } from '@/types/dashboard';
import { CATEGORY_TONE } from './templateMeta';

interface GridTemplateCardProps {
  template: AgreementTemplate;
  onPress: (template: AgreementTemplate) => void;
}

/** Gallery card that fills its grid column: page illustration, name, meta and usage. */
export const GridTemplateCard = memo(function GridTemplateCard({ template, onPress }: GridTemplateCardProps) {
  const { colors, radius, spacing, shadows } = useTheme();
  const tone = colors.status[CATEGORY_TONE[template.category]];
  return (
    <PressableScale
      onPress={() => onPress(template)}
      accessibilityLabel={`${template.name}. ${template.category}, ${template.fieldCount} fields, used ${template.usageCount} times`}
      accessibilityHint="Opens template actions"
      style={[styles.card, shadows.sm, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl }]}>
      <View style={[styles.preview, { backgroundColor: tone.soft, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl }]}>
        <View style={[styles.page, { backgroundColor: colors.surface, borderRadius: radius.sm }]}>
          <View style={[styles.pageTitle, { backgroundColor: tone.fg }]} />
          <View style={[styles.pageLine, { backgroundColor: colors.borderStrong, width: '92%' }]} />
          <View style={[styles.pageLine, { backgroundColor: colors.borderStrong, width: '78%' }]} />
          <View style={[styles.pageLine, { backgroundColor: colors.borderStrong, width: '85%' }]} />
          <View style={[styles.pageSign, { borderColor: tone.fg }]} />
        </View>
        <View style={[styles.badge, { backgroundColor: colors.surface }]}>
          <Typography variant="micro" color={tone.fg} maxFontSizeMultiplier={1.2}>
            {template.category.toUpperCase()}
          </Typography>
        </View>
      </View>
      <View style={{ padding: spacing.md, gap: 4 }}>
        <Typography variant="headline" numberOfLines={2}>
          {template.name}
        </Typography>
        <Typography variant="caption" tone="textSecondary" numberOfLines={1}>
          {template.fieldCount} fields · ~{template.estimatedMinutes} min
        </Typography>
        <View style={styles.usage}>
          <Users size={13} color={colors.textTertiary} />
          <Typography variant="caption" tone="textTertiary" numberOfLines={1}>
            Used {template.usageCount}×
          </Typography>
        </View>
      </View>
    </PressableScale>
  );
});

export function GridTemplateCardSkeleton() {
  const { radius } = useTheme();
  return <Skeleton height={232} radius={radius.xl} style={styles.skeleton} />;
}

const styles = StyleSheet.create({
  card: { flex: 1, borderWidth: StyleSheet.hairlineWidth },
  preview: { height: 118, alignItems: 'center', justifyContent: 'flex-end', paddingTop: 16 },
  page: { width: '62%', flex: 1, padding: 10, gap: 5, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  pageTitle: { width: '45%', height: 5, borderRadius: 3, marginBottom: 2 },
  pageLine: { height: 3, borderRadius: 2 },
  pageSign: { marginTop: 'auto', width: '50%', height: 12, borderWidth: 1, borderStyle: 'dashed', borderRadius: 3 },
  badge: { position: 'absolute', top: 10, left: 10, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999 },
  usage: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  skeleton: { flex: 1 },
});
