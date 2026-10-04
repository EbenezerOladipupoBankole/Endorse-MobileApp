import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Activity, FileText, LayoutTemplate, SearchX, Search as SearchIcon, X } from 'lucide-react-native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, Keyboard, Pressable, RefreshControl, StyleSheet, View, type ListRenderItem } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionRequiredCard } from '@/components/dashboard/ActionRequiredCard';
import { ActivityItem, ActivityItemSkeleton } from '@/components/dashboard/ActivityItem';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DocumentActionsSheet } from '@/components/dashboard/DocumentActionsSheet';
import { DocumentListItem, DocumentListItemSkeleton, type GroupPosition } from '@/components/dashboard/DocumentListItem';
import { InvoiceSummaryCard } from '@/components/dashboard/InvoiceSummaryCard';
import { QuickActions } from '@/components/dashboard/QuickActionCard';
import { SearchResultRow } from '@/components/dashboard/SearchResultRow';
import { StatusOverview } from '@/components/dashboard/StatCard';
import { TemplatesCarousel } from '@/components/dashboard/TemplateCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { EmptyState, ErrorState } from '@/components/ui/StateViews';
import { Typography } from '@/components/ui/Typography';
import { useAuth } from '@/context/AuthContext';
import { useCreateActions } from '@/hooks/useCreateActions';
import { useDashboard } from '@/hooks/useDashboard';
import { useDashboardSearch } from '@/hooks/useDashboardSearch';
import { performDocumentAction } from '@/lib/dashboard/api';
import { greetingFor, matchesFilter, STATUS_FILTER_META } from '@/lib/dashboard/format';
import { triggerHaptic } from '@/lib/haptics';
import { buildDocumentPdf } from '@/lib/pdf/signedPdf';
import { shareFile } from '@/lib/share';
import { useTheme } from '@/theme';
import type {
  ActivityEvent,
  AgreementTemplate,
  Contact,
  DashboardSection,
  DocumentAction,
  DocumentSummary,
  StatusFilter,
} from '@/types/dashboard';

const RECENT_LIMIT = 6;
const ACTIVITY_LIMIT = 6;
const SKELETON_ROWS = 3;

type HeaderId = 'action' | 'overview' | 'documents' | 'templates' | 'invoices' | 'activity';

/** The dashboard is one virtualized list of heterogeneous rows. */
type Row =
  | { key: string; kind: 'quickActions' | 'stats' | 'actionRequired' | 'templates' | 'invoices' | 'footer' }
  | { key: string; kind: 'header'; id: HeaderId; title: string; subtitle?: string; actionLabel?: string }
  | { key: string; kind: 'document'; doc: DocumentSummary; pos: GroupPosition }
  | { key: string; kind: 'activity'; event: ActivityEvent; pos: GroupPosition }
  | { key: string; kind: 'documentSkeleton' | 'activitySkeleton'; pos: GroupPosition }
  | { key: string; kind: 'sectionError'; section: DashboardSection; title: string }
  | { key: string; kind: 'documentsEmpty' | 'activityEmpty' }
  | { key: string; kind: 'searchHint' | 'searchEmpty' | 'searchError' }
  | { key: string; kind: 'searchGroup'; title: string }
  | { key: string; kind: 'searchTemplate'; template: AgreementTemplate; pos: GroupPosition }
  | { key: string; kind: 'searchContact'; contact: Contact; pos: GroupPosition };

const position = (index: number, length: number): GroupPosition => ({ isFirst: index === 0, isLast: index === length - 1 });

function skeletonRows(kind: 'documentSkeleton' | 'activitySkeleton'): Row[] {
  return Array.from({ length: SKELETON_ROWS }, (_, i) => ({ key: `${kind}-${i}`, kind, pos: position(i, SKELETON_ROWS) }));
}

/** Opens the document viewer. */
function openDocument(id: string) {
  router.push({ pathname: '/document/[id]', params: { id } });
}

export default function DashboardScreen() {
  const theme = useTheme();
  const { colors, spacing } = theme;
  const { profile } = useAuth();
  const { resources, refreshing, refresh, retry, revalidate } = useDashboard();
  const firstFocus = useRef(true);

  // Coming back from sending or signing: pick up the changes quietly.
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      revalidate();
    }, [revalidate]),
  );
  const runCreateAction = useCreateActions();
  const listRef = useRef<FlatList<Row>>(null);

  const [filter, setFilter] = useState<StatusFilter | null>(null);
  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const search = useDashboardSearch(query);
  const searching = searchFocused || query.length > 0;

  const [menuDoc, setMenuDoc] = useState<DocumentSummary | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const pendingDocAction = useRef<DocumentAction | null>(null);

  const now = resources.documents.fetchedAt ?? 0;
  const activityNow = resources.activity.fetchedAt ?? 0;

  /* ----------------------------- Rows ----------------------------- */

  const dashboardRows = useMemo<Row[]>(() => {
    const rows: Row[] = [
      { key: 'quickActions', kind: 'quickActions' },
      { key: 'h-overview', kind: 'header', id: 'overview', title: 'Overview' },
      { key: 'stats', kind: 'stats' },
      { key: 'h-action', kind: 'header', id: 'action', title: 'Action required' },
      { key: 'actionRequired', kind: 'actionRequired' },
      { key: 'h-documents', kind: 'header', id: 'documents', title: 'Recent documents', actionLabel: 'See all' },
    ];

    const docs = resources.documents;
    if (docs.data) {
      const visible = (filter ? docs.data.filter((d) => matchesFilter(d, filter)) : docs.data).slice(0, RECENT_LIMIT);
      if (visible.length === 0) rows.push({ key: 'documentsEmpty', kind: 'documentsEmpty' });
      visible.forEach((doc, i) => rows.push({ key: `doc-${doc.id}`, kind: 'document', doc, pos: position(i, visible.length) }));
    } else if (docs.status === 'error') {
      rows.push({ key: 'documentsError', kind: 'sectionError', section: 'documents', title: "Couldn't load documents" });
    } else {
      rows.push(...skeletonRows('documentSkeleton'));
    }

    rows.push(
      { key: 'h-templates', kind: 'header', id: 'templates', title: 'Templates', subtitle: 'Start agreements in seconds', actionLabel: 'See all' },
      { key: 'templates', kind: 'templates' },
      { key: 'h-invoices', kind: 'header', id: 'invoices', title: 'Invoices' },
      { key: 'invoices', kind: 'invoices' },
      { key: 'h-activity', kind: 'header', id: 'activity', title: 'Activity', actionLabel: 'View all' },
    );

    const activity = resources.activity;
    if (activity.data) {
      const items = activity.data.slice(0, ACTIVITY_LIMIT);
      if (items.length === 0) rows.push({ key: 'activityEmpty', kind: 'activityEmpty' });
      items.forEach((event, i) => rows.push({ key: `act-${event.id}`, kind: 'activity', event, pos: position(i, items.length) }));
    } else if (activity.status === 'error') {
      rows.push({ key: 'activityError', kind: 'sectionError', section: 'activity', title: "Couldn't load activity" });
    } else {
      rows.push(...skeletonRows('activitySkeleton'));
    }

    rows.push({ key: 'footer', kind: 'footer' });
    return rows;
  }, [resources.documents, resources.activity, filter]);

  const searchRows = useMemo<Row[]>(() => {
    if (!search.term) return [{ key: 'searchHint', kind: 'searchHint' }];
    if (search.status === 'loading') return skeletonRows('documentSkeleton');
    if (search.status === 'error' || !search.results) return [{ key: 'searchError', kind: 'searchError' }];

    const { documents, templates, contacts } = search.results;
    if (!documents.length && !templates.length && !contacts.length) return [{ key: 'searchEmpty', kind: 'searchEmpty' }];

    const rows: Row[] = [];
    if (documents.length) {
      rows.push({ key: 'sg-docs', kind: 'searchGroup', title: 'Documents' });
      documents.forEach((doc, i) => rows.push({ key: `sd-${doc.id}`, kind: 'document', doc, pos: position(i, documents.length) }));
    }
    if (templates.length) {
      rows.push({ key: 'sg-templates', kind: 'searchGroup', title: 'Templates' });
      templates.forEach((template, i) => rows.push({ key: `st-${template.id}`, kind: 'searchTemplate', template, pos: position(i, templates.length) }));
    }
    if (contacts.length) {
      rows.push({ key: 'sg-contacts', kind: 'searchGroup', title: 'Contacts' });
      contacts.forEach((contact, i) => rows.push({ key: `sc-${contact.id}`, kind: 'searchContact', contact, pos: position(i, contacts.length) }));
    }
    return rows;
  }, [search.term, search.status, search.results]);

  const rows = searching ? searchRows : dashboardRows;

  /* --------------------------- Handlers --------------------------- */

  const handleFilter = useCallback(
    (next: StatusFilter) => {
      const value = filter === next ? null : next;
      setFilter(value);
      if (value) {
        const index = dashboardRows.findIndex((r) => r.key === 'h-documents');
        if (index >= 0) listRef.current?.scrollToIndex({ index, animated: true, viewOffset: spacing.sm });
      }
    },
    [filter, dashboardRows, spacing.sm],
  );

  const clearFilter = useCallback(() => setFilter(null), []);

  const handleHeaderAction = useCallback((id: HeaderId) => {
    if (id === 'documents') router.push('/(tabs)/two');
    else if (id === 'templates') router.push('/(tabs)/templates');
    // TODO(nav): route to a full activity feed screen once built.
    else if (id === 'activity') Alert.alert('Activity', 'The full activity history is coming soon.');
  }, []);

  const handleOpenDocument = useCallback((doc: DocumentSummary) => openDocument(doc.id), []);
  const handleOpenActivity = useCallback((event: ActivityEvent) => openDocument(event.documentId), []);
  const handleOpenTemplate = useCallback((template: AgreementTemplate) => {
    router.push({ pathname: '/send', params: { templateId: template.id, name: template.name } });
  }, []);
  const handleOpenContact = useCallback((contact: Contact) => {
    // TODO(nav): route to a contact detail / "send to contact" flow once built.
    Alert.alert(contact.name, contact.email);
  }, []);

  const handleMore = useCallback((doc: DocumentSummary) => {
    Keyboard.dismiss();
    setMenuDoc(doc);
    setMenuVisible(true);
  }, []);
  const closeMenu = useCallback(() => setMenuVisible(false), []);
  const handleDocAction = useCallback((action: DocumentAction) => {
    pendingDocAction.current = action;
    setMenuVisible(false);
  }, []);

  // Runs after the actions sheet has animated away.
  const handleMenuDismissed = useCallback(() => {
    const action = pendingDocAction.current;
    pendingDocAction.current = null;
    const doc = menuDoc;
    if (!action || !doc) return;

    const run = async () => {
      if (action === 'share') {
        // The signed PDF (original + signatures + certificate) via the system share sheet.
        await shareFile(await buildDocumentPdf(doc.id), 'any', { title: doc.title, message: `${doc.title} — shared from Endorse` });
        return;
      }
      await performDocumentAction(doc.id, action);
      triggerHaptic('success');
      const messages: Record<Exclude<DocumentAction, 'share'>, string> = {
        resend: 'Reminder sent to pending recipients.',
        download: 'Download started.',
        void: 'Document voided.',
      };
      Alert.alert(doc.title, messages[action]);
      refresh();
    };

    if (action === 'void') {
      Alert.alert('Void this document?', 'All recipients will be notified and can no longer sign.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Void', style: 'destructive', onPress: () => void run() },
      ]);
    } else {
      run().catch((e: unknown) => Alert.alert('Something went wrong', e instanceof Error ? e.message : 'Please try again.'));
    }
  }, [menuDoc, refresh]);

  const handleRefresh = useCallback(() => {
    triggerHaptic('light');
    refresh();
  }, [refresh]);

  const cancelSearch = useCallback(() => {
    setQuery('');
    setSearchFocused(false);
    Keyboard.dismiss();
  }, []);

  const handleScrollToIndexFailed = useCallback((info: { index: number; averageItemLength: number }) => {
    listRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: true });
  }, []);

  /* --------------------------- Rendering -------------------------- */

  const filterPill = useMemo(() => {
    if (!filter) return null;
    const meta = STATUS_FILTER_META[filter];
    const tone = colors.status[meta.tone];
    return (
      <Pressable
        onPress={clearFilter}
        accessibilityRole="button"
        accessibilityLabel={`Filtered by ${meta.label}. Clear filter`}
        hitSlop={8}
        style={[styles.filterPill, { backgroundColor: tone.soft }]}>
        <Typography variant="captionStrong" color={tone.fg} maxFontSizeMultiplier={1.3}>
          {meta.shortLabel}
        </Typography>
        <X size={14} color={tone.fg} strokeWidth={2.5} />
      </Pressable>
    );
  }, [filter, colors, clearFilter]);

  const renderItem = useCallback<ListRenderItem<Row>>(
    ({ item }) => {
      switch (item.kind) {
        case 'quickActions':
          return <QuickActions onAction={runCreateAction} />;
        case 'header':
          return (
            <View style={styles.sectionGap}>
              <SectionHeader
                title={item.title}
                subtitle={item.subtitle}
                actionLabel={item.actionLabel}
                onAction={item.actionLabel ? () => handleHeaderAction(item.id) : undefined}
                accessory={item.id === 'documents' ? filterPill : undefined}
              />
            </View>
          );
        case 'stats':
          return <StatusOverview resource={resources.stats} selected={filter} onSelect={handleFilter} onRetry={() => retry('stats')} />;
        case 'actionRequired':
          return <ActionRequiredCard resource={resources.actionRequired} onSign={handleOpenDocument} onRetry={() => retry('actionRequired')} />;
        case 'document':
          return <DocumentListItem doc={item.doc} now={now} {...item.pos} onPress={handleOpenDocument} onMore={handleMore} />;
        case 'documentSkeleton':
          return <DocumentListItemSkeleton {...item.pos} />;
        case 'documentsEmpty':
          return filter ? (
            <EmptyState compact icon={FileText} title={`No documents in “${STATUS_FILTER_META[filter].label}”`} message="Try another status or clear the filter." actionLabel="Clear filter" onAction={clearFilter} />
          ) : (
            <EmptyState icon={FileText} title="No documents yet" message="Upload or scan your first document to sign or send it." actionLabel="Sign a document" onAction={() => runCreateAction('sign')} />
          );
        case 'templates':
          return (
            <TemplatesCarousel
              resource={resources.templates}
              onSelect={handleOpenTemplate}
              onCreate={() => runCreateAction('template')}
              onRetry={() => retry('templates')}
            />
          );
        case 'invoices':
          return <InvoiceSummaryCard resource={resources.invoices} onCreateInvoice={() => runCreateAction('invoice')} onRetry={() => retry('invoices')} />;
        case 'activity':
          return <ActivityItem event={item.event} now={activityNow} {...item.pos} onPress={handleOpenActivity} />;
        case 'activitySkeleton':
          return <ActivityItemSkeleton {...item.pos} />;
        case 'activityEmpty':
          return <EmptyState compact icon={Activity} title="No activity yet" message="When people view or sign your documents, you'll see it here." />;
        case 'sectionError':
          return <ErrorState title={item.title} onRetry={() => retry(item.section)} />;
        case 'searchHint':
          return <EmptyState icon={SearchIcon} title="Search Endorse" message="Find documents, templates and contacts by name, email or company." />;
        case 'searchEmpty':
          return <EmptyState icon={SearchX} title={`No results for “${search.term}”`} message="Check the spelling or try a different keyword." />;
        case 'searchError':
          return <View style={styles.sectionGap}><ErrorState title="Search failed" onRetry={search.retry} /></View>;
        case 'searchGroup':
          return (
            <View style={styles.searchGroup}>
              <Typography variant="micro" tone="textSecondary" accessibilityRole="header" style={{ paddingHorizontal: spacing.xl }}>
                {item.title.toUpperCase()}
              </Typography>
            </View>
          );
        case 'searchTemplate':
          return (
            <SearchResultRow
              icon={LayoutTemplate}
              title={item.template.name}
              subtitle={`Template · ${item.template.category}`}
              {...item.pos}
              onPress={() => handleOpenTemplate(item.template)}
            />
          );
        case 'searchContact':
          return (
            <SearchResultRow
              avatarName={item.contact.name}
              title={item.contact.name}
              subtitle={[item.contact.company, item.contact.email].filter(Boolean).join(' · ')}
              {...item.pos}
              onPress={() => handleOpenContact(item.contact)}
            />
          );
        case 'footer':
          return <View style={{ height: spacing.huge }} />;
      }
    },
    [
      runCreateAction, handleHeaderAction, filterPill, resources.stats, resources.actionRequired, resources.templates,
      resources.invoices, filter, handleFilter, retry, handleOpenDocument, now, handleMore, clearFilter, handleOpenTemplate,
      activityNow, handleOpenActivity, search.term, search.retry, spacing, handleOpenContact,
    ],
  );

  const user = resources.user.data;
  const firstName = profile?.firstName || user?.firstName;
  const greeting = resources.user.fetchedAt ? greetingFor(resources.user.fetchedAt) : 'Welcome back';

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <DashboardHeader
        greeting={greeting}
        name={firstName}
        avatarUrl={user?.avatarUrl}
        unreadCount={user?.unreadNotifications ?? 0}
        onPressAvatar={() => router.push('/(tabs)/three')}
        onPressNotifications={() => router.push('/notifications')}
        query={query}
        onChangeQuery={setQuery}
        searchFocused={searchFocused}
        onSearchFocusChange={setSearchFocused}
        onCancelSearch={cancelSearch}
      />
      <FlatList
        ref={listRef}
        data={rows}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={{ paddingTop: spacing.sm }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onScrollToIndexFailed={handleScrollToIndexFailed}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={11}
        refreshControl={
          searching ? undefined : (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
              progressBackgroundColor={colors.surface}
            />
          )
        }
      />
      <DocumentActionsSheet
        doc={menuDoc}
        visible={menuVisible}
        onRequestClose={closeMenu}
        onDismissed={handleMenuDismissed}
        onAction={handleDocAction}
      />
    </SafeAreaView>
  );
}

const keyExtractor = (row: Row) => row.key;

const styles = StyleSheet.create({
  screen: { flex: 1 },
  sectionGap: { paddingTop: 28 },
  searchGroup: { paddingTop: 20, paddingBottom: 8 },
  filterPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, minHeight: 32, borderRadius: 999 },
});
