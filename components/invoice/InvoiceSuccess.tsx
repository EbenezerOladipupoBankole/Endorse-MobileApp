import { Check, Printer } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ShareActions } from '@/components/ui/ShareActions';
import { Typography } from '@/components/ui/Typography';
import { formatMoney } from '@/lib/invoices/currencies';
import { useTheme } from '@/theme';
import type { InvoiceKind } from '@/types/workflows';

export interface InvoiceResult {
  kind: InvoiceKind;
  number: string;
  status: 'draft' | 'sent' | 'paid';
  clientName?: string;
  clientEmail?: string;
  total: number;
  currency: string;
  senderName: string;
}

interface InvoiceSuccessProps {
  result: InvoiceResult;
  /** Builds (or returns the cached) PDF on native. */
  getPdf: () => Promise<string>;
  /** Web: open the browser print dialog (Save as PDF). */
  onPrintWeb: () => void;
  onDone: () => void;
  onCreateAnother: () => void;
}

function copyFor(result: InvoiceResult) {
  const who = result.clientName ?? 'your client';
  if (result.kind === 'receipt') {
    return {
      title: 'Receipt saved',
      message: `Receipt ${result.number} for ${who} is recorded as paid. Share it as a PDF below.`,
      amountLabel: 'Amount received',
    };
  }
  if (result.status === 'sent') {
    return {
      title: 'Invoice ready to send',
      message: `Invoice ${result.number} for ${who} is saved. Share the PDF by WhatsApp or email below.`,
      amountLabel: 'Amount due',
    };
  }
  return {
    title: 'Draft saved',
    message: `Invoice ${result.number} is saved as a draft. You can still share the PDF now.`,
    amountLabel: 'Draft total',
  };
}

/** Confirmation after saving, with PDF sharing (WhatsApp / email / more). */
export function InvoiceSuccess({ result, getPdf, onPrintWeb, onDone, onCreateAnother }: InvoiceSuccessProps) {
  const { colors, spacing } = useTheme();
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(reduceMotion ? 1 : 0.5);

  useEffect(() => {
    scale.set(withSpring(1, { damping: 12, stiffness: 180 }));
  }, [scale]);

  const badgeStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  const tone = colors.status.success;
  const copy = copyFor(result);
  const amount = formatMoney(result.total, result.currency);
  const docLabel = `${result.kind === 'receipt' ? 'Receipt' : 'Invoice'} ${result.number}`;

  return (
    <View style={[styles.wrap, { padding: spacing.xl, gap: spacing.xl }]}>
      <View style={styles.center}>
        <Animated.View style={[styles.ring, { backgroundColor: tone.soft }, badgeStyle]}>
          <View style={[styles.badge, { backgroundColor: tone.fg }]}>
            <Check size={34} color={colors.surface} strokeWidth={3} />
          </View>
        </Animated.View>
        <Typography variant="title1" style={styles.text} accessibilityRole="header">
          {copy.title}
        </Typography>
        <Typography variant="body" tone="textSecondary" style={styles.text} accessibilityLiveRegion="polite">
          {copy.message}
        </Typography>
      </View>

      <Card style={styles.totalCard}>
        <Typography variant="caption" tone="textSecondary">
          {copy.amountLabel}
        </Typography>
        <Typography variant="stat">{amount}</Typography>
      </Card>

      <View style={{ gap: spacing.sm }}>
        <Typography variant="captionStrong" tone="textSecondary">
          Share as PDF
        </Typography>
        {Platform.OS === 'web' ? (
          <Button label="Print / save as PDF" icon={Printer} variant="secondary" onPress={onPrintWeb} />
        ) : (
          <ShareActions
            getFile={getPdf}
            title={`${docLabel} from ${result.senderName}`}
            message={
              result.kind === 'receipt'
                ? `Hello${result.clientName ? ` ${result.clientName}` : ''}, please find attached receipt ${result.number} for ${amount}. Thank you for your payment.`
                : `Hello${result.clientName ? ` ${result.clientName}` : ''}, please find attached invoice ${result.number} for ${amount}.`
            }
            recipients={result.clientEmail ? [result.clientEmail] : undefined}
          />
        )}
      </View>

      <View style={{ gap: spacing.md }}>
        <Button label="Done" onPress={onDone} haptic="medium" />
        <Button label={result.kind === 'receipt' ? 'Record another' : 'Create another'} variant="secondary" onPress={onCreateAnother} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center' },
  center: { alignItems: 'center', gap: 10 },
  ring: { width: 112, height: 112, borderRadius: 56, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  badge: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  text: { textAlign: 'center', maxWidth: 320 },
  totalCard: { alignItems: 'center', gap: 4 },
});
