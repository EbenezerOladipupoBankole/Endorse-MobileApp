import { ExternalLink, FileText } from 'lucide-react-native';
import React, { memo, useMemo, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Typography } from '@/components/ui/Typography';
import { trustedFileUri } from '@/lib/fileUri';
import { agreementPlainText } from '@/lib/pdf/agreement';
import { useTheme } from '@/theme';

const COLLAPSED_BLOCKS = 4;

interface Block {
  heading: boolean;
  text: string;
}

/** Agreement body → readable blocks; placeholders become [Label]. */
function toBlocks(body: string): Block[] {
  // Mark headings before agreementPlainText strips their "## " prefix.
  return agreementPlainText(body.replace(/^## /gm, '\u0000'))
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((b) => (b.startsWith('\u0000') ? { heading: true, text: b.slice(1).trim() } : { heading: false, text: b }));
}

interface DocumentContentCardProps {
  agreementBody?: string;
  fileUri?: string;
}

/** The document itself: readable agreement text, or a link to open the stored file. */
export const DocumentContentCard = memo(function DocumentContentCard({ agreementBody, fileUri }: DocumentContentCardProps) {
  const { colors, spacing } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const blocks = useMemo(() => (agreementBody ? toBlocks(agreementBody) : []), [agreementBody]);
  const visible = expanded ? blocks : blocks.slice(0, COLLAPSED_BLOCKS);

  if (!agreementBody && !fileUri) return null;

  const openFile = () => {
    const safe = trustedFileUri(fileUri);
    if (!safe) return;
    Linking.openURL(safe).catch(() => Alert.alert('Can’t open file', 'This file isn’t available on this device.'));
  };

  return (
    <View>
      <SectionHeader title="Document" />
      <Card style={{ marginHorizontal: spacing.xl, gap: spacing.md }}>
        {agreementBody ? (
          <View style={{ gap: spacing.sm }} accessibilityLabel="Agreement text">
            {visible.map((block, i) =>
              block.heading ? (
                <Typography key={i} variant="headline" style={styles.heading}>
                  {block.text}
                </Typography>
              ) : (
                <Typography key={i} variant="callout" tone="textSecondary">
                  {block.text}
                </Typography>
              ),
            )}
            {blocks.length > COLLAPSED_BLOCKS ? (
              <Pressable
                onPress={() => setExpanded((v) => !v)}
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                hitSlop={8}
                style={styles.toggle}>
                <Typography variant="calloutStrong" color={colors.primary}>
                  {expanded ? 'Collapse' : `Read full agreement (${blocks.length - COLLAPSED_BLOCKS} more sections)`}
                </Typography>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <View style={styles.fileRow}>
            <View style={[styles.fileIcon, { backgroundColor: colors.primarySoft }]}>
              <FileText size={20} color={colors.primary} />
            </View>
            <Typography variant="callout" tone="textSecondary" style={styles.flex}>
              The original file attached to this document.
            </Typography>
          </View>
        )}
        {fileUri ? <Button label="Open file" icon={ExternalLink} variant="secondary" size="sm" onPress={openFile} /> : null}
      </Card>
    </View>
  );
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  heading: { marginTop: 4 },
  toggle: { minHeight: 44, justifyContent: 'center' },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  fileIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
