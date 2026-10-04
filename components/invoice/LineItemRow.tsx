import { Minus, Plus, Trash2 } from 'lucide-react-native';
import React, { memo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { TextField } from '@/components/ui/TextField';
import { Typography } from '@/components/ui/Typography';
import { formatMoney, getCurrency } from '@/lib/invoices/currencies';
import { triggerHaptic } from '@/lib/haptics';
import { useTheme } from '@/theme';
import type { InvoiceLineItem } from '@/types/workflows';
import { parseAmount, sanitizeAmountInput } from './format';

const MAX_QTY = 999;

export interface LineItemErrors {
  description?: string;
  amount?: string;
}

interface LineItemRowProps {
  item: InvoiceLineItem;
  index: number;
  currency: string;
  canRemove: boolean;
  errors?: LineItemErrors;
  onChange: (id: string, patch: Partial<InvoiceLineItem>) => void;
  onRemove: (id: string) => void;
}

/** One editable invoice line: description, quantity stepper, unit price and line total. */
export const LineItemRow = memo(function LineItemRow({ item, index, currency, canRemove, errors, onChange, onRemove }: LineItemRowProps) {
  const { colors, radius, spacing } = useTheme();
  // Raw text keeps partial input like "12." intact while the draft stores a number.
  const [priceText, setPriceText] = useState(item.unitPrice ? String(item.unitPrice) : '');

  const setQuantity = (quantity: number) => {
    const next = Math.min(MAX_QTY, Math.max(1, quantity));
    if (next === item.quantity) return;
    triggerHaptic('selection');
    onChange(item.id, { quantity: next });
  };

  return (
    <Card style={{ gap: spacing.md }}>
      <View style={styles.titleRow}>
        <Typography variant="captionStrong" tone="textSecondary" style={styles.flex}>
          Item {index + 1}
        </Typography>
        {canRemove ? (
          <Pressable
            onPress={() => onRemove(item.id)}
            accessibilityRole="button"
            accessibilityLabel={`Remove item ${index + 1}`}
            hitSlop={4}
            style={({ pressed }) => [styles.iconButton, pressed && { backgroundColor: colors.status.declined.soft }]}>
            <Trash2 size={18} color={colors.status.declined.fg} />
          </Pressable>
        ) : null}
      </View>

      <TextField
        label="Description"
        value={item.description}
        onChangeText={(description) => onChange(item.id, { description })}
        placeholder="e.g. Brand strategy workshop"
        error={errors?.description}
        returnKeyType="next"
      />

      <View style={[styles.row, { gap: spacing.md }]}>
        <View style={styles.qtyWrap}>
          <Typography variant="captionStrong" tone="textSecondary">
            Quantity
          </Typography>
          <View style={[styles.stepper, { borderColor: colors.borderStrong, borderRadius: radius.md }]}>
            <Pressable
              onPress={() => setQuantity(item.quantity - 1)}
              disabled={item.quantity <= 1}
              accessibilityRole="button"
              accessibilityLabel={`Quantity ${item.quantity}, decrease`}
              accessibilityState={{ disabled: item.quantity <= 1 }}
              style={({ pressed }) => [styles.stepButton, pressed && { backgroundColor: colors.surfaceMuted }, item.quantity <= 1 && styles.dim]}>
              <Minus size={18} color={colors.text} />
            </Pressable>
            <Typography variant="headline" style={styles.qty} maxFontSizeMultiplier={1.3} accessibilityLiveRegion="polite">
              {item.quantity}
            </Typography>
            <Pressable
              onPress={() => setQuantity(item.quantity + 1)}
              disabled={item.quantity >= MAX_QTY}
              accessibilityRole="button"
              accessibilityLabel={`Quantity ${item.quantity}, increase`}
              style={({ pressed }) => [styles.stepButton, pressed && { backgroundColor: colors.surfaceMuted }]}>
              <Plus size={18} color={colors.text} />
            </Pressable>
          </View>
        </View>
        <TextField
          label="Unit price"
          value={priceText}
          onChangeText={(text) => {
            const clean = sanitizeAmountInput(text);
            setPriceText(clean);
            onChange(item.id, { unitPrice: parseAmount(clean) });
          }}
          placeholder={getCurrency(currency).decimals ? '0.00' : '0'}
          keyboardType="decimal-pad"
          error={errors?.amount}
          containerStyle={styles.flex}
          trailing={
            <Typography variant="caption" tone="textTertiary">
              {getCurrency(currency).symbol}
            </Typography>
          }
        />
      </View>

      <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
        <Typography variant="caption" tone="textSecondary">
          Line total
        </Typography>
        <Typography variant="headline">{formatMoney(item.quantity * item.unitPrice, currency)}</Typography>
      </View>
    </Card>
  );
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: -4 },
  iconButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: -10 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  qtyWrap: { gap: 6 },
  stepper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, minHeight: 50 },
  stepButton: { width: 44, height: 48, alignItems: 'center', justifyContent: 'center' },
  dim: { opacity: 0.4 },
  qty: { minWidth: 32, textAlign: 'center' },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12 },
});
