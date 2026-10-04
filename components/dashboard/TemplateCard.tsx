import { LayoutTemplate } from 'lucide-react-native';
import React, { memo, useCallback } from 'react';
import { FlatList, StyleSheet, View, type ListRenderItem } from 'react-native';

import { PressableScale } from '@/components/ui/PressableScale';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/StateViews';
import { Typography } from '@/components/ui/Typography';
import { useTheme, type ColorTokens } from '@/theme';
import type { AgreementTemplate, Resource, TemplateCategory } from '@/types/dashboard';

const CARD_WIDTH = 156;

const CATEGORY_TONE: Record<TemplateCategory, keyof ColorTokens['status']> = {
  Legal: 'awaiting',
  Services: 'success',
  HR: 'waiting',
  'Real estate': 'expiring',
  Sales: 'declined',
};

interface TemplateCardProps {
  template: AgreementTemplate;
  onPress: (template: AgreementTemplate) => void;
}

export const TemplateCard = memo(function TemplateCard({ template, onPress }: TemplateCardProps) {
  const { colors, radius, spacing, shadows } = useTheme();
  const tone = colors.status[CATEGORY_TONE[template.category]];
  return (
    <PressableScale
      onPress={() => onPress(template)}
      accessibilityLabel={`${template.name} template, ${template.category}, ${template.fieldCount} fields, about ${template.estimatedMinutes} minutes`}
      accessibilityHint="Starts a new document from this template"
      style={[styles.card, shadows.sm, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl }]}>
      {/* Miniature agreement "page" */}
      <View style={[styles.preview, { backgroundColor: tone.soft, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl }]}>
        <View style={[styles.page, { backgroundColor: colors.surface, borderRadius: radius.sm }]}>
          <View style={[styles.pageTitle, { backgroundColor: tone.fg }]} />
          <View style={[styles.pageLine, { backgroundColor: colors.borderStrong, width: '90%' }]} />
          <View style={[styles.pageLine, { backgroundColor: colors.borderStrong, width: '75%' }]} />
          <View style={[styles.pageLine, { backgroundColor: colors.borderStrong, width: '82%' }]} />
          <View style={[styles.pageSign, { borderColor: tone.fg }]} />
        </View>
      </View>
      <View style={{ padding: spacing.md, gap: 4 }}>
        <Typography variant="headline" numberOfLines={2}>
          {template.name}
        </Typography>
        <Typography variant="caption" tone="textSecondary" numberOfLines={1}>
          {template.category} · {template.fieldCount} fields
        </Typography>
      </View>
    </PressableScale>
  );
});

interface TemplatesCarouselProps {
  resource: Resource<AgreementTemplate[]>;
  onSelect: (template: AgreementTemplate) => void;
  onCreate: () => void;
  onRetry: () => void;
}

const keyExtractor = (t: AgreementTemplate) => t.id;

export const TemplatesCarousel = memo(function TemplatesCarousel({ resource, onSelect, onCreate, onRetry }: TemplatesCarouselProps) {
  const { spacing, radius } = useTheme();
  const renderItem = useCallback<ListRenderItem<AgreementTemplate>>(
    ({ item }) => <TemplateCard template={item} onPress={onSelect} />,
    [onSelect],
  );

  if (resource.status === 'error' && !resource.data) {
    return <ErrorState title="Couldn't load templates" onRetry={onRetry} />;
  }
  if (!resource.data) {
    return (
      <View style={[styles.skeletonRow, { paddingHorizontal: spacing.xl, gap: spacing.md }]}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} width={CARD_WIDTH} height={196} radius={radius.xl} />
        ))}
      </View>
    );
  }
  if (resource.data.length === 0) {
    return <EmptyState compact icon={LayoutTemplate} title="No templates yet" message="Save time on repeat agreements." actionLabel="Create template" onAction={onCreate} />;
  }

  return (
    <FlatList
      horizontal
      data={resource.data}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingVertical: spacing.xs, gap: spacing.md }}
      decelerationRate="fast"
      snapToInterval={CARD_WIDTH + spacing.md}
      initialNumToRender={3}
    />
  );
});

const styles = StyleSheet.create({
  card: { width: CARD_WIDTH, borderWidth: StyleSheet.hairlineWidth },
  preview: { height: 104, alignItems: 'center', justifyContent: 'flex-end', paddingTop: 14 },
  page: { width: 84, flex: 1, padding: 9, gap: 5, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  pageTitle: { width: 36, height: 5, borderRadius: 3, marginBottom: 2 },
  pageLine: { height: 3, borderRadius: 2 },
  pageSign: { marginTop: 'auto', width: 40, height: 12, borderWidth: 1, borderStyle: 'dashed', borderRadius: 3 },
  skeletonRow: { flexDirection: 'row' },
});
