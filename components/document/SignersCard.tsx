import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Typography } from '@/components/ui/Typography';
import { formatRelative } from '@/lib/dashboard/format';
import { useTheme, type ColorTokens } from '@/theme';
import type { DocumentRecipient, RecipientStatus, SignerRole } from '@/types/workflows';

const RECIPIENT_META: Record<RecipientStatus, { label: string; tone: keyof ColorTokens['status'] }> = {
  signed: { label: 'Signed', tone: 'success' },
  viewed: { label: 'Viewed', tone: 'awaiting' },
  sent: { label: 'Sent', tone: 'waiting' },
  waiting: { label: 'Not sent', tone: 'draft' },
  declined: { label: 'Declined', tone: 'declined' },
};

const ROLE_LABEL: Record<SignerRole, string> = { signer: 'Signer', approver: 'Approver', viewer: 'Viewer' };

const RecipientPill = memo(function RecipientPill({ status }: { status: RecipientStatus }) {
  const { colors } = useTheme();
  const meta = RECIPIENT_META[status];
  const tone = colors.status[meta.tone];
  return (
    <View style={[styles.pill, { backgroundColor: tone.soft }]}>
      <View style={[styles.dot, { backgroundColor: tone.fg }]} />
      <Typography variant="micro" color={tone.fg} maxFontSizeMultiplier={1.3}>
        {meta.label}
      </Typography>
    </View>
  );
});

const SignerRow = memo(function SignerRow({ signer, now, isLast }: { signer: DocumentRecipient; now: number; isLast: boolean }) {
  const { colors } = useTheme();
  const meta = RECIPIENT_META[signer.status];
  const when = signer.actedAt ? formatRelative(signer.actedAt, now) : null;
  return (
    <View
      accessible
      accessibilityLabel={`${signer.order}. ${signer.name}, ${ROLE_LABEL[signer.role]}, ${meta.label}${when ? `, ${when}` : ''}`}
      style={[styles.row, !isLast && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
      <View style={[styles.order, { backgroundColor: colors.surfaceMuted }]}>
        <Typography variant="micro" tone="textSecondary" maxFontSizeMultiplier={1.2}>
          {signer.order}
        </Typography>
      </View>
      <Avatar name={signer.name} size={40} />
      <View style={styles.text}>
        <Typography variant="headline" numberOfLines={1}>
          {signer.name}
        </Typography>
        <Typography variant="caption" tone="textSecondary" numberOfLines={1}>
          {[signer.email, ROLE_LABEL[signer.role]].filter(Boolean).join(' · ')}
        </Typography>
      </View>
      <View style={styles.right}>
        <RecipientPill status={signer.status} />
        {when ? (
          <Typography variant="caption" tone="textTertiary" maxFontSizeMultiplier={1.3}>
            {when}
          </Typography>
        ) : null}
      </View>
    </View>
  );
});

/** Signing progress + per-recipient status, in signing order. */
export const SignersCard = memo(function SignersCard({ signers, now }: { signers: DocumentRecipient[]; now: number }) {
  const { colors, spacing } = useTheme();
  const ordered = [...signers].sort((a, b) => a.order - b.order);
  const signed = ordered.filter((s) => s.status === 'signed').length;
  const pct = ordered.length ? signed / ordered.length : 0;

  return (
    <Card style={{ marginHorizontal: spacing.xl }}>
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={`${signed} of ${ordered.length} signed`}
        accessibilityValue={{ min: 0, max: ordered.length, now: signed }}
        style={styles.progress}>
        <View style={styles.progressText}>
          <Typography variant="headline">Signers</Typography>
          <Typography variant="captionStrong" tone="textSecondary">
            {signed} of {ordered.length} signed
          </Typography>
        </View>
        <View style={[styles.track, { backgroundColor: colors.surfaceMuted }]}>
          <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: colors.status.success.fg }]} />
        </View>
      </View>
      {ordered.length === 0 ? (
        <Typography variant="callout" tone="textSecondary" style={{ marginTop: spacing.md }}>
          No recipients added yet.
        </Typography>
      ) : (
        ordered.map((signer, i) => <SignerRow key={signer.id} signer={signer} now={now} isLast={i === ordered.length - 1} />)
      )}
    </Card>
  );
});

const styles = StyleSheet.create({
  progress: { gap: 10, marginBottom: 4 },
  progressText: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, minHeight: 64 },
  order: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 2 },
  right: { alignItems: 'flex-end', gap: 4 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
