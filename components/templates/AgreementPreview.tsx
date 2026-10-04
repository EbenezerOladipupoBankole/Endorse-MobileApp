import { FileText } from 'lucide-react-native';
import React, { memo, useCallback, useMemo, useRef } from 'react';
import { Modal, ScrollView, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ShareActions } from '@/components/ui/ShareActions';
import { EmptyState } from '@/components/ui/StateViews';
import { StickyFooter } from '@/components/ui/StickyFooter';
import { Typography } from '@/components/ui/Typography';
import { agreementPdf } from '@/lib/pdf/agreement';
import { useTheme } from '@/theme';

const PLACEHOLDER = /\{\{\s*([^}]+?)\s*\}\}/g;

type Block = { kind: 'heading' | 'paragraph'; text: string };

function toBlocks(body: string): Block[] {
  return body
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((b) => (b.startsWith('## ') ? { kind: 'heading', text: b.slice(3) } : { kind: 'paragraph', text: b }));
}

/** Text with {{placeholders}} shown as highlighted field labels. */
export const AgreementText = memo(function AgreementText({ text, variant = 'body' }: { text: string; variant?: 'body' | 'title3' | 'callout' }) {
  const { colors } = useTheme();
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(PLACEHOLDER)) {
    const index = match.index ?? 0;
    if (index > last) parts.push(text.slice(last, index));
    parts.push(
      <Typography
        key={`${index}-${match[1]}`}
        variant={variant === 'title3' ? 'title3' : 'calloutStrong'}
        color={colors.primary}
        style={{ backgroundColor: colors.primarySoft }}>
        {` ${match[1]} `}
      </Typography>,
    );
    last = index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <Typography variant={variant}>{parts}</Typography>;
});

interface AgreementPreviewProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  /** Agreement text; empty/undefined shows a friendly empty state. */
  body?: string;
}

/** Full-screen, readable agreement with WhatsApp / Email PDF sharing. */
export function AgreementPreview({ visible, onClose, title, body }: AgreementPreviewProps) {
  const { colors, spacing, radius } = useTheme();
  const blocks = useMemo(() => (body ? toBlocks(body) : []), [body]);
  const cache = useRef<{ key: string; uri: string } | null>(null);
  const name = title.trim() || 'Agreement';

  const getFile = useCallback(async () => {
    const key = `${name}\u0000${body ?? ''}`;
    if (cache.current?.key === key) return cache.current.uri;
    const uri = await agreementPdf({ title: name, body: body ?? '' });
    cache.current = { key, uri };
    return uri;
  }, [name, body]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <Screen edges={['top']}>
        <ScreenHeader title={name} subtitle="Agreement preview" leading="close" onLeadingPress={onClose} />
        {blocks.length === 0 ? (
          <EmptyState icon={FileText} title="No agreement text yet" message="Add the agreement wording in the template editor so recipients can read it." />
        ) : (
          <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.huge }}>
            <View
              style={[
                styles.page,
                { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.xl, gap: spacing.md },
              ]}>
              <Typography variant="title1" accessibilityRole="header">
                {name}
              </Typography>
              {blocks.map((block, i) =>
                block.kind === 'heading' ? (
                  <View key={i} style={{ paddingTop: spacing.sm }} accessibilityRole="header">
                    <AgreementText text={block.text} variant="title3" />
                  </View>
                ) : (
                  <AgreementText key={i} text={block.text} />
                ),
              )}
            </View>
            <Typography variant="caption" tone="textTertiary" style={{ marginTop: spacing.md }}>
              Highlighted items are filled in by the people who sign.
            </Typography>
          </ScrollView>
        )}
        {blocks.length > 0 ? (
          <StickyFooter
            summary={
              <Typography variant="captionStrong" tone="textSecondary">
                Share as PDF
              </Typography>
            }>
            <View style={styles.flex}>
              <ShareActions getFile={getFile} title={name} message={`Please review “${name}”.`} />
            </View>
          </StickyFooter>
        ) : null}
      </Screen>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  page: { borderWidth: StyleSheet.hairlineWidth },
});
