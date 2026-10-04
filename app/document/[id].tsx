import { router, useLocalSearchParams } from 'expo-router';
import { Activity, Ban, Download, FileX, Ellipsis, PenLine, SquarePen, RotateCcw, Send, Share2 } from 'lucide-react-native';
import React, { useCallback, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { ActivityItem } from '@/components/dashboard/ActivityItem';
import { DocumentActionsSheet } from '@/components/dashboard/DocumentActionsSheet';
import { DetailsCard, DocumentDetailSkeleton, ExpiryBanner, MessageCard } from '@/components/document/DocumentCards';
import { DocumentContentCard } from '@/components/document/DocumentContentCard';
import { DocumentPreview } from '@/components/document/DocumentPreview';
import { SignersCard } from '@/components/document/SignersCard';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ShareActions } from '@/components/ui/ShareActions';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { EmptyState, ErrorState } from '@/components/ui/StateViews';
import { StatusChip } from '@/components/ui/StatusChip';
import { StickyFooter } from '@/components/ui/StickyFooter';
import { Typography } from '@/components/ui/Typography';
import { useResource } from '@/hooks/useResource';
import { performDocumentAction } from '@/lib/dashboard/api';
import { formatDue, formatRelative } from '@/lib/dashboard/format';
import { fetchDocumentDetail } from '@/lib/documents/api';
import { triggerHaptic } from '@/lib/haptics';
import { buildDocumentPdf } from '@/lib/pdf/signedPdf';
import { shareFile } from '@/lib/share';
import { useTheme } from '@/theme';
import type { DocumentAction } from '@/types/dashboard';
import type { DocumentDetail } from '@/types/workflows';

type RunnableAction = Exclude<DocumentAction, 'share'>;

const ACTION_MESSAGES: Record<RunnableAction, string> = {
  resend: 'Reminder sent to pending recipients.',
  download: 'Download started.',
  void: 'Document voided.',
};

const FILE_TYPE_LABEL: Record<DocumentDetail['fileType'], string> = { pdf: 'PDF', docx: 'Word document', image: 'Image' };

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const noop = () => {};

export default function DocumentViewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { spacing } = useTheme();
  const fetcher = useCallback(() => fetchDocumentDetail(String(id)), [id]);
  const { resource, reload } = useResource(fetcher);
  const doc = resource.data;
  const now = resource.fetchedAt ?? 0;

  const [menuVisible, setMenuVisible] = useState(false);
  const [busy, setBusy] = useState<RunnableAction | 'share' | null>(null);
  const pendingAction = useRef<DocumentAction | null>(null);

  /** Signed PDF (original + signatures + certificate), built on demand. */
  const getPdf = useCallback(() => buildDocumentPdf(String(id)), [id]);

  // System share sheet with the PDF (WhatsApp, email, Files, …).
  const share = useCallback(async () => {
    if (!doc) return;
    setBusy('share');
    try {
      await shareFile(await getPdf(), 'any', { title: doc.title, message: `${doc.title} — shared from Endorse` });
    } catch (error) {
      Alert.alert('Couldn’t share', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setBusy(null);
    }
  }, [doc, getPdf]);

  const run = useCallback(
    async (action: RunnableAction) => {
      if (!doc) return;
      setBusy(action);
      try {
        await performDocumentAction(doc.id, action);
        triggerHaptic('success');
        Alert.alert(doc.title, ACTION_MESSAGES[action]);
        if (action === 'void') reload();
      } catch {
        Alert.alert('Something went wrong', 'Please try again.');
      } finally {
        setBusy(null);
      }
    },
    [doc, reload],
  );

  const handleAction = useCallback(
    (action: DocumentAction) => {
      if (action === 'share') {
        share();
      } else if (action === 'void') {
        Alert.alert('Void this document?', 'All recipients will be notified and can no longer sign.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Void', style: 'destructive', onPress: () => void run('void') },
        ]);
      } else {
        run(action);
      }
    },
    [run, share],
  );

  const selectMenuAction = useCallback((action: DocumentAction) => {
    pendingAction.current = action;
    setMenuVisible(false);
  }, []);

  // Runs once the actions sheet has animated away.
  const handleMenuDismissed = useCallback(() => {
    const action = pendingAction.current;
    pendingAction.current = null;
    if (action) handleAction(action);
  }, [handleAction]);

  const header = (
    <ScreenHeader
      title="Document"
      subtitle={doc?.title}
      actions={
        doc
          ? [
              { icon: Share2, label: 'Share document', onPress: share },
              { icon: Ellipsis, label: 'More actions', onPress: () => setMenuVisible(true) },
            ]
          : []
      }
    />
  );

  if (!doc) {
    return (
      <Screen>
        {header}
        {resource.status === 'error' ? (
          resource.error === 'Document not found' ? (
            <EmptyState
              icon={FileX}
              title="Document not found"
              message="It may have been deleted, or you no longer have access."
              actionLabel="Back to dashboard"
              onAction={() => router.replace('/(tabs)/home')}
            />
          ) : (
            <View style={{ paddingTop: spacing.lg }}>
              <ErrorState title="Couldn't load this document" message={resource.error} onRetry={reload} />
            </View>
          )
        ) : (
          <DocumentDetailSkeleton />
        )}
      </Screen>
    );
  }

  const details = [
    { label: 'Created', value: formatDate(doc.createdAt) },
    { label: 'Sender', value: doc.sender.name },
    { label: 'File type', value: `${FILE_TYPE_LABEL[doc.fileType]} · ${doc.sizeLabel}` },
    { label: 'Document ID', value: doc.id.toUpperCase() },
  ];

  return (
    <Screen>
      {header}
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxxl, gap: spacing.xl }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md, paddingTop: spacing.sm }}>
          <DocumentPreview status={doc.status} fileType={doc.fileType} fileUri={doc.fileUri} />
          <Typography variant="title1">{doc.title}</Typography>
          <StatusChip status={doc.status} />
          <Typography variant="callout" tone="textSecondary">
            {doc.pageCount} {doc.pageCount === 1 ? 'page' : 'pages'} · {doc.sizeLabel} · Updated {formatRelative(doc.updatedAt, now)}
          </Typography>
        </View>

        <DocumentContentCard agreementBody={doc.agreementBody} fileUri={doc.fileUri} />

        {doc.isExpiringSoon && doc.expiresAt ? <ExpiryBanner label={formatDue(doc.expiresAt, now)} /> : null}

        <SignersCard signers={doc.signers} now={now} />

        {doc.message ? <MessageCard sender={doc.sender} message={doc.message} /> : null}

        <View>
          <SectionHeader title="History" />
          {doc.history.length === 0 ? (
            <EmptyState compact icon={Activity} title="No activity yet" message="Views, signatures and reminders will appear here." />
          ) : (
            doc.history.map((event, i) => (
              <ActivityItem key={event.id} event={event} now={now} isFirst={i === 0} isLast={i === doc.history.length - 1} onPress={noop} />
            ))
          )}
        </View>

        <View>
          <SectionHeader title="Details" />
          <DetailsCard rows={details} />
        </View>
      </ScrollView>

      <StickyFooter
        summary={
          doc.status === 'completed' ? (
            <ShareActions
              getFile={getPdf}
              title={`Signed: ${doc.title}`}
              message={`Here's the signed copy of ${doc.title}, signed with Endorse.`}
              showMore={false}
            />
          ) : undefined
        }>
        {renderFooter(doc, busy, run, handleAction, share)}
      </StickyFooter>

      <DocumentActionsSheet
        doc={doc}
        visible={menuVisible}
        onRequestClose={() => setMenuVisible(false)}
        onDismissed={handleMenuDismissed}
        onAction={selectMenuAction}
      />
    </Screen>
  );
}

/** Status-aware primary actions. */
function renderFooter(
  doc: DocumentDetail,
  busy: RunnableAction | 'share' | null,
  run: (action: RunnableAction) => void,
  handleAction: (action: DocumentAction) => void,
  share: () => void,
) {
  switch (doc.status) {
    case 'awaiting_me':
      return (
        <Button
          label="Sign now"
          icon={PenLine}
          variant="accent"
          haptic="medium"
          style={styles.flex}
          accessibilityLabel={`Sign now: ${doc.title}`}
          onPress={() => router.push({ pathname: '/sign/[id]', params: { id: doc.id, name: doc.title } })}
        />
      );
    case 'waiting_on_others':
      return (
        <>
          <Button label="Void" icon={Ban} variant="secondary" disabled={!!busy} onPress={() => handleAction('void')} />
          <Button label="Send reminder" icon={Send} style={styles.flex} loading={busy === 'resend'} onPress={() => run('resend')} />
        </>
      );
    case 'completed':
      return (
        // WhatsApp / Email live in the footer summary; this opens the share sheet ("Save to Files", Drive, …).
        <Button label="Download PDF" icon={Download} style={styles.flex} loading={busy === 'share'} onPress={share} />
      );
    case 'draft':
      return (
        <Button
          label="Continue editing"
          icon={SquarePen}
          style={styles.flex}
          onPress={() => router.push({ pathname: '/send', params: { name: doc.title } })}
        />
      );
    default:
      return <Button label="Resend" icon={RotateCcw} style={styles.flex} loading={busy === 'resend'} onPress={() => run('resend')} />;
  }
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
