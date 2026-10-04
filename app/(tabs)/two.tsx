import { router, useFocusEffect } from 'expo-router';
import { FileText, FileUp, SearchX } from 'lucide-react-native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, View, type ListRenderItem } from 'react-native';

import { DocumentActionsSheet } from '@/components/dashboard/DocumentActionsSheet';
import { DocumentListItem, DocumentListItemSkeleton } from '@/components/dashboard/DocumentListItem';
import { Chip, ChipRow } from '@/components/ui/Chip';
import { Screen } from '@/components/ui/Screen';
import { HeaderIconButton } from '@/components/ui/ScreenHeader';
import { EmptyState, ErrorState } from '@/components/ui/StateViews';
import { TextField } from '@/components/ui/TextField';
import { Typography } from '@/components/ui/Typography';
import { useCreateActions } from '@/hooks/useCreateActions';
import { useResource } from '@/hooks/useResource';
import { performDocumentAction } from '@/lib/dashboard/api';
import { matchesFilter, STATUS_FILTER_META } from '@/lib/dashboard/format';
import { listDocumentSummaries } from '@/lib/firestore/documents';
import { triggerHaptic } from '@/lib/haptics';
import { buildDocumentPdf } from '@/lib/pdf/signedPdf';
import { shareFile } from '@/lib/share';
import { useTheme } from '@/theme';
import type { DocumentAction, DocumentSummary, StatusFilter } from '@/types/dashboard';

const FILTERS: StatusFilter[] = ['awaiting_me', 'waiting_on_others', 'completed', 'draft', 'expiring_soon'];

const keyExtractor = (doc: DocumentSummary) => doc.id;

export default function DocumentsScreen() {
  const { spacing } = useTheme();
  const runCreateAction = useCreateActions();
  const { resource, reload } = useResource(listDocumentSummaries);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<StatusFilter | null>(null);
  const [menuDoc, setMenuDoc] = useState<DocumentSummary | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const pendingAction = useRef<DocumentAction | null>(null);
  const firstFocus = useRef(true);

  // Pick up documents created or signed on other screens.
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      reload();
    }, [reload]),
  );

  const docs = resource.data;
  const now = resource.fetchedAt ?? 0;
  const term = query.trim().toLowerCase();

  const counts = useMemo(() => {
    const out = {} as Record<StatusFilter, number>;
    FILTERS.forEach((f) => (out[f] = (docs ?? []).filter((d) => matchesFilter(d, f)).length));
    return out;
  }, [docs]);

  const visible = useMemo(
    () =>
      (docs ?? []).filter(
        (d) =>
          (!filter || matchesFilter(d, filter)) &&
          (!term || d.title.toLowerCase().includes(term) || d.recipients.some((r) => r.name.toLowerCase().includes(term))),
      ),
    [docs, filter, term],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    triggerHaptic('light');
    reload();
    // useResource reloads asynchronously; give the spinner a moment.
    setTimeout(() => setRefreshing(false), 600);
  }, [reload]);

  const openDoc = useCallback((doc: DocumentSummary) => {
    router.push({ pathname: '/document/[id]', params: { id: doc.id } });
  }, []);

  const openMenu = useCallback((doc: DocumentSummary) => {
    setMenuDoc(doc);
    setMenuVisible(true);
  }, []);

  const handleMenuDismissed = useCallback(() => {
    const action = pendingAction.current;
    pendingAction.current = null;
    if (!action || !menuDoc) return;
    if (action === 'share') {
      // The signed PDF (original + signatures + certificate) via the system share sheet.
      buildDocumentPdf(menuDoc.id)
        .then((uri) => shareFile(uri, 'any', { title: menuDoc.title, message: `${menuDoc.title} — shared from Endorse` }))
        .catch((e: unknown) => Alert.alert('Couldn’t share', e instanceof Error ? e.message : 'Please try again.'));
      return;
    }
    const run = () =>
      performDocumentAction(menuDoc.id, action)
        .then(() => {
          triggerHaptic('success');
          if (action !== 'download') reload();
        })
        .catch((e: unknown) => Alert.alert('Something went wrong', e instanceof Error ? e.message : 'Please try again.'));
    if (action === 'void') {
      Alert.alert('Void this document?', 'All recipients will be notified and can no longer sign.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Void', style: 'destructive', onPress: run },
      ]);
    } else run();
  }, [menuDoc, reload]);

  const renderItem = useCallback<ListRenderItem<DocumentSummary>>(
    ({ item, index }) => (
      <DocumentListItem
        doc={item}
        now={now}
        isFirst={index === 0}
        isLast={index === visible.length - 1}
        onPress={openDoc}
        onMore={openMenu}
      />
    ),
    [now, visible.length, openDoc, openMenu],
  );

  const empty = () => {
    if (!docs) {
      if (resource.status === 'error') return <ErrorState title="Couldn't load your documents" message={resource.error} onRetry={reload} />;
      return (
        <View>
          {[0, 1, 2, 3].map((i) => (
            <DocumentListItemSkeleton key={i} isFirst={i === 0} isLast={i === 3} />
          ))}
        </View>
      );
    }
    if (docs.length === 0) {
      return (
        <EmptyState
          icon={FileText}
          title="No documents yet"
          message="Upload or scan a document to sign it, or send one for signature."
          actionLabel="Upload a document"
          onAction={() => runCreateAction('upload')}
        />
      );
    }
    return (
      <EmptyState
        compact
        icon={SearchX}
        title="No matching documents"
        message="Try a different search or filter."
        actionLabel="Clear filters"
        onAction={() => {
          setQuery('');
          setFilter(null);
        }}
      />
    );
  };

  return (
    <Screen>
      <View style={[styles.header, { paddingHorizontal: spacing.xl }]}>
        <View style={styles.flex}>
          <Typography variant="title1" accessibilityRole="header">
            Documents
          </Typography>
          <Typography variant="caption" tone="textSecondary">
            {docs ? `${docs.length} ${docs.length === 1 ? 'document' : 'documents'}` : 'Loading…'}
          </Typography>
        </View>
        <HeaderIconButton icon={FileUp} label="Upload a document" onPress={() => runCreateAction('upload')} />
      </View>

      <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
        <TextField
          label="Search"
          value={query}
          onChangeText={setQuery}
          placeholder="Search by title or recipient"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
      </View>

      <View style={{ paddingBottom: spacing.md }}>
        <ChipRow>
          <Chip label="All" selected={!filter} onPress={() => setFilter(null)} count={docs?.length} />
          {FILTERS.map((f) => (
            <Chip
              key={f}
              label={STATUS_FILTER_META[f].shortLabel}
              selected={filter === f}
              count={docs ? counts[f] : undefined}
              onPress={() => setFilter(filter === f ? null : f)}
            />
          ))}
        </ChipRow>
      </View>

      <FlatList
        data={visible}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListEmptyComponent={empty}
        contentContainerStyle={{ paddingBottom: spacing.huge }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      />

      <DocumentActionsSheet
        doc={menuDoc}
        visible={menuVisible}
        onRequestClose={() => setMenuVisible(false)}
        onDismissed={handleMenuDismissed}
        onAction={(action) => {
          pendingAction.current = action;
          setMenuVisible(false);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 8, paddingBottom: 12 },
});
