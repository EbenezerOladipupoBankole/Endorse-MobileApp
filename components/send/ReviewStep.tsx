import React, { memo } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { TextField } from '@/components/ui/TextField';
import { Typography } from '@/components/ui/Typography';
import { formatPeople } from '@/lib/dashboard/format';
import { useTheme } from '@/theme';
import { TemplateAgreementCard } from './TemplateAgreementCard';
import type { DraftRecipient, EnvelopeDocument } from '@/types/workflows';

const EXPIRY_OPTIONS = [7, 14, 30];

interface ReviewStepProps {
  document: EnvelopeDocument;
  recipients: DraftRecipient[];
  signingOrder: boolean;
  subject: string;
  onSubjectChange: (value: string) => void;
  message: string;
  onMessageChange: (value: string) => void;
  expiresInDays: number;
  onExpiresChange: (days: number) => void;
  autoReminders: boolean;
  onRemindersChange: (value: boolean) => void;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow} accessible accessibilityLabel={`${label}: ${value}`}>
      <Typography variant="caption" tone="textSecondary" style={styles.summaryLabel}>
        {label}
      </Typography>
      <Typography variant="calloutStrong" style={styles.summaryValue} numberOfLines={2}>
        {value}
      </Typography>
    </View>
  );
}

export const ReviewStep = memo(function ReviewStep({
  document,
  recipients,
  signingOrder,
  subject,
  onSubjectChange,
  message,
  onMessageChange,
  expiresInDays,
  onExpiresChange,
  autoReminders,
  onRemindersChange,
}: ReviewStepProps) {
  const { colors, spacing } = useTheme();
  const subjectError = subject.trim() ? undefined : 'Add a subject so recipients recognise the request';

  return (
    <View style={{ gap: spacing.lg, paddingHorizontal: spacing.xl }}>
      <View style={{ gap: 4 }}>
        <Typography variant="title2">Review & send</Typography>
        <Typography variant="callout" tone="textSecondary">
          Recipients get an email with a secure link to sign.
        </Typography>
      </View>

      <Card style={{ gap: spacing.md }}>
        <SummaryRow label="Document" value={document.name} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <SummaryRow
          label={`Recipients (${recipients.length})`}
          value={signingOrder ? recipients.map((r, i) => `${i + 1}. ${r.name}`).join('\n') : formatPeople(recipients)}
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <SummaryRow label="Signing order" value={signingOrder ? 'In sequence' : 'Everyone at once'} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <SummaryRow label="Expires" value={`In ${expiresInDays} days`} />
      </Card>

      {document.templateId ? <TemplateAgreementCard templateId={document.templateId} showExcerpt /> : null}

      <TextField label="Email subject" value={subject} onChangeText={onSubjectChange} error={subjectError} returnKeyType="next" />
      <TextField
        label="Message (optional)"
        value={message}
        onChangeText={onMessageChange}
        placeholder="Add a short note for your recipients"
        multiline
        maxLength={1000}
      />

      <View style={{ gap: spacing.sm }}>
        <Typography variant="captionStrong" tone="textSecondary">
          Expires in
        </Typography>
        <View style={styles.chips}>
          {EXPIRY_OPTIONS.map((days) => (
            <Chip key={days} label={`${days} days`} selected={expiresInDays === days} onPress={() => onExpiresChange(days)} />
          ))}
        </View>
      </View>

      <View style={styles.switchRow}>
        <View style={styles.flex}>
          <Typography variant="bodyStrong">Automatic reminders</Typography>
          <Typography variant="caption" tone="textSecondary">
            Nudge recipients every 3 days until they sign.
          </Typography>
        </View>
        <Switch
          value={autoReminders}
          onValueChange={onRemindersChange}
          accessibilityLabel="Automatic reminders"
          trackColor={{ true: colors.primary, false: colors.borderStrong }}
          thumbColor={colors.surface}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 2 },
  summaryRow: { flexDirection: 'row', gap: 12 },
  summaryLabel: { width: 110, paddingTop: 1 },
  summaryValue: { flex: 1, textAlign: 'right' },
  divider: { height: StyleSheet.hairlineWidth },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
