import { router, useFocusEffect } from 'expo-router';
import { BookOpen, CircleX, Copy, LayoutTemplate, Pencil, Plus, Search, SearchX, Send, Trash2 } from 'lucide-react-native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, Platform, Pressable, RefreshControl, StyleSheet, TextInput, View, type ListRenderItem } from 'react-native';

import { AgreementPreview } from '@/components/templates/AgreementPreview';
import { GridTemplateCard, GridTemplateCardSkeleton } from '@/components/templates/GridTemplateCard';
import { CATEGORY_TONE } from '@/components/templates/templateMeta';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Chip, ChipRow } from '@/components/ui/Chip';
import { ListOption } from '@/components/ui/ListOption';
import { Screen } from '@/components/ui/Screen';
import { HeaderIconButton } from '@/components/ui/ScreenHeader';
import { EmptyState, ErrorState } from '@/components/ui/StateViews';
import { Typography } from '@/components/ui/Typography';
import { triggerHaptic } from '@/lib/haptics';
import { deleteTemplate, duplicateTemplate, fetchTemplateDetail, fetchTemplateList } from '@/lib/templates/api';
import { fontFamily, useTheme } from '@/theme';
import type { AgreementTemplate, Resource, TemplateCategory } from '@/types/dashboard';
import { TEMPLATE_CATEGORIES } from '@/types/workflows';

type TemplateAction = 'use' | 'preview' | 'edit' | 'duplicate' | 'delete';
type GridItem = AgreementTemplate | { id: '__spacer' };

const SKELETONS = [0, 1, 2, 3];

const isSpacer = (item: GridItem): item is { id: '__spacer' } => item.id === '__spacer';
const keyExtractor = (item: GridItem) => item.id;

function openEditor(id: string) {
  router.push({ pathname: '/template/[id]', params: { id } });
}

export default function TemplatesScreen() {
  const { colors, spacing, radius, shadows } = useTheme();
  const [state, setState] = useState<Resource<AgreementTemplate[]>>({ status: 'loading' });
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<TemplateCategory | null>(null);

  const [selected, setSelected] = useState<AgreementTemplate | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const pendingAction = useRef<TemplateAction | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchTemplateList();
      setState({ status: 'success', data, fetchedAt: Date.now() });
    } catch (error) {
      setState((prev) => ({ ...prev, status: 'error', error: error instanceof Error ? error.message : 'Something went wrong' }));
    }
  }, []);

  // Reload whenever the tab regains focus so edits from the editor show up.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    triggerHaptic('light');
    await load();
    setRefreshing(false);
  }, [load]);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    load();
  }, [load]);

  const templates = state.data;

  const counts = useMemo(() => {
    const map = new Map<TemplateCategory, number>();
    templates?.forEach((t) => map.set(t.category, (map.get(t.category) ?? 0) + 1));
    return map;
  }, [templates]);

  const filtered = useMemo<GridItem[]>(() => {
    if (!templates) return [];
    const q = query.trim().toLowerCase();
    const items: GridItem[] = templates.filter(
      (t) => (!category || t.category === category) && (!q || t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)),
    );
    // Keep the last card half-width when the count is odd.
    if (items.length % 2 === 1) items.push({ id: '__spacer' });
    return items;
  }, [templates, query, category]);

  const clearFilters = useCallback(() => {
    setQuery('');
    setCategory(null);
  }, []);

  const openActions = useCallback((template: AgreementTemplate) => {
    setSelected(template);
    setSheetVisible(true);
  }, []);
  const closeSheet = useCallback(() => setSheetVisible(false), []);
  const [preview, setPreview] = useState<{ title: string; body?: string } | null>(null);
  const chooseAction = useCallback((action: TemplateAction) => {
    pendingAction.current = action;
    setSheetVisible(false);
  }, []);

  // Runs once the action sheet has animated away.
  const handleDismissed = useCallback(() => {
    const action = pendingAction.current;
    pendingAction.current = null;
    const template = selected;
    if (!action || !template) return;

    switch (action) {
      case 'use':
        router.push({ pathname: '/send', params: { templateId: template.id, name: template.name } });
        break;
      case 'preview':
        fetchTemplateDetail(template.id)
          .then((detail) => setPreview({ title: detail.name, body: detail.body }))
          .catch(() => Alert.alert('Could not open template', 'Please try again.'));
        break;
      case 'edit':
        openEditor(template.id);
        break;
      case 'duplicate':
        duplicateTemplate(template.id)
          .then(() => {
            triggerHaptic('success');
            return load();
          })
          .catch(() => Alert.alert('Could not duplicate', 'Please try again.'));
        break;
      case 'delete':
        Alert.alert(`Delete “${template.name}”?`, 'Documents already sent from this template are not affected.', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              deleteTemplate(template.id)
                .then(() => {
                  triggerHaptic('success');
                  return load();
                })
                .catch(() => Alert.alert('Could not delete', 'Please try again.'));
            },
          },
        ]);
        break;
    }
  }, [selected, load]);

  const renderItem = useCallback<ListRenderItem<GridItem>>(
    ({ item }) => (isSpacer(item) ? <View style={styles.flex} /> : <GridTemplateCard template={item} onPress={openActions} />),
    [openActions],
  );

  const subtitle = templates ? `${templates.length} ${templates.length === 1 ? 'template' : 'templates'}` : 'Loading…';
  const selectedTone = selected ? colors.status[CATEGORY_TONE[selected.category]] : undefined;

  let body: React.ReactNode;
  if (!templates && state.status === 'error') {
    body = (
      <View style={{ paddingTop: spacing.xl }}>
        <ErrorState title="Couldn't load templates" message={state.error} onRetry={retry} />
      </View>
    );
  } else if (!templates) {
    body = (
      <View style={{ padding: spacing.xl, gap: spacing.md }} accessibilityLabel="Loading templates">
        {[0, 2].map((row) => (
          <View key={row} style={[styles.row, { gap: spacing.md }]}>
            {SKELETONS.slice(row, row + 2).map((i) => (
              <GridTemplateCardSkeleton key={i} />
            ))}
          </View>
        ))}
      </View>
    );
  } else {
    body = (
      <FlatList
        data={filtered}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={{ gap: spacing.md }}
        contentContainerStyle={[{ padding: spacing.xl, gap: spacing.md }, filtered.length === 0 && styles.grow]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        initialNumToRender={6}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} colors={[colors.primary]} progressBackgroundColor={colors.surface} />
        }
        ListEmptyComponent={
          templates.length === 0 ? (
            <EmptyState
              icon={LayoutTemplate}
              title="No templates yet"
              message="Save your go-to agreements once and send them in seconds."
              actionLabel="Create template"
              onAction={() => openEditor('new')}
            />
          ) : (
            <EmptyState icon={SearchX} title="No matching templates" message="Try a different name or category." actionLabel="Clear filters" onAction={clearFilters} />
          )
        }
      />
    );
  }

  return (
    <Screen>
      <View style={[styles.header, { paddingHorizontal: spacing.xl, paddingTop: spacing.sm }]}>
        <View style={styles.flex}>
          <Typography variant="title1" accessibilityRole="header">
            Templates
          </Typography>
          <Typography variant="caption" tone="textSecondary">
            {subtitle}
          </Typography>
          <Typography variant="caption" tone="textTertiary">
            Starter templates are a starting point, not legal advice.
          </Typography>
        </View>
        <HeaderIconButton icon={Plus} label="Create template" onPress={() => openEditor('new')} />
      </View>

      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.md }}>
        <View style={[styles.search, shadows.sm, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
          <Search size={18} color={colors.textTertiary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search templates"
            placeholderTextColor={colors.textTertiary}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            accessibilityLabel="Search templates"
            style={[styles.input, { color: colors.text, fontFamily: fontFamily.medium }, Platform.OS === 'web' ? { outlineWidth: 0 } : null]}
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityRole="button" accessibilityLabel="Clear search">
              <CircleX size={18} color={colors.textTertiary} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <View>
        <ChipRow>
          <Chip label="All" selected={category === null} count={templates?.length} onPress={() => setCategory(null)} />
          {TEMPLATE_CATEGORIES.map((c) => (
            <Chip key={c} label={c} selected={category === c} count={counts.get(c) ?? 0} onPress={() => setCategory(category === c ? null : c)} />
          ))}
        </ChipRow>
      </View>

      <View style={styles.flex}>{body}</View>

      <BottomSheet
        visible={sheetVisible}
        onRequestClose={closeSheet}
        onDismissed={handleDismissed}
        title={selected?.name ?? 'Template'}
        subtitle={selected ? `${selected.category} · ${selected.fieldCount} fields` : undefined}>
        <View style={{ paddingTop: spacing.sm }}>
          <ListOption icon={Send} label="Use template" description="Fill in recipients and send for signature" tone={selectedTone} onPress={() => chooseAction('use')} />
          <ListOption icon={BookOpen} label="Preview" description="Read the agreement and share it as a PDF" onPress={() => chooseAction('preview')} />
          <ListOption
            icon={Pencil}
            label={selected?.builtIn ? 'Customize' : 'Edit'}
            description={selected?.builtIn ? 'Save your own editable copy of this starter' : 'Change details, roles and fields'}
            onPress={() => chooseAction('edit')}
          />
          <ListOption icon={Copy} label="Duplicate" description="Make a copy to customise" tone={colors.status.draft} onPress={() => chooseAction('duplicate')} />
          {selected?.builtIn ? null : (
            <ListOption icon={Trash2} label="Delete template" description="This can't be undone" destructive onPress={() => chooseAction('delete')} />
          )}
        </View>
      </BottomSheet>

      <AgreementPreview visible={!!preview} onClose={() => setPreview(null)} title={preview?.title ?? ''} body={preview?.body} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  grow: { flexGrow: 1 },
  row: { flexDirection: 'row' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, paddingHorizontal: 14, borderWidth: 1 },
  input: { flex: 1, fontSize: 15, paddingVertical: 10 },
});
