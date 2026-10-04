import { router } from 'expo-router';
import { Plus, Receipt, Send } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { ClientPicker } from '@/components/invoice/ClientPicker';
import { CurrencyPicker } from '@/components/invoice/CurrencyPicker';
import { DateField } from '@/components/invoice/DateField';
import { DAY_MS, PAYMENT_TERMS, parseAmount, sanitizeAmountInput } from '@/components/invoice/format';
import { InvoiceSuccess, type InvoiceResult } from '@/components/invoice/InvoiceSuccess';
import { KindToggle } from '@/components/invoice/KindToggle';
import { LineItemRow, type LineItemErrors } from '@/components/invoice/LineItemRow';
import { Button } from '@/components/ui/Button';
import { CalendarSheet } from '@/components/ui/CalendarSheet';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { StatusChip } from '@/components/ui/StatusChip';
import { StickyFooter } from '@/components/ui/StickyFooter';
import { TextField } from '@/components/ui/TextField';
import { Typography } from '@/components/ui/Typography';
import { useAuth } from '@/context/AuthContext';
import { triggerHaptic } from '@/lib/haptics';
import { makeId } from '@/lib/ids';
import { computeInvoiceTotals, newInvoiceDraft, numberForKind, saveInvoice } from '@/lib/invoices/api';
import { formatMoney, getCurrency, loadLastCurrency, rememberCurrency } from '@/lib/invoices/currencies';
import { invoicePdf, PAYMENT_METHOD_LABELS, printInvoiceOnWeb, type InvoicePdfInput } from '@/lib/pdf/invoicePdf';
import { useTheme } from '@/theme';
import type { InvoiceClient, InvoiceDraft, InvoiceKind, InvoiceLineItem, PaymentMethod } from '@/types/workflows';

const INVOICE_NOTE = 'Thank you for your business. Payment is due within 14 days.';
const RECEIPT_NOTE = 'Thank you for your payment.';
const PAYMENT_METHODS = Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[];

type CalendarTarget = 'issue' | 'due' | 'paid';

/** Module-level so `Date.now()` runs in a state initializer, not during render. */
function createInitialDraft(): InvoiceDraft {
  return newInvoiceDraft(Date.now());
}

function finish() {
  if (router.canGoBack()) router.back();
  else router.replace('/(tabs)/home');
}

interface Validation {
  client?: string;
  items: Record<string, LineItemErrors>;
  count: number;
}

/** Sending an invoice needs a client; every saved receipt / sent invoice needs priced items. */
function validate(draft: InvoiceDraft, requireClient: boolean): Validation {
  const items: Record<string, LineItemErrors> = {};
  let count = 0;
  for (const item of draft.items) {
    const errors: LineItemErrors = {};
    if (!item.description.trim()) errors.description = 'Add a description';
    if (item.quantity * item.unitPrice <= 0) errors.amount = 'Enter a price';
    if (errors.description || errors.amount) {
      items[item.id] = errors;
      count += Number(!!errors.description) + Number(!!errors.amount);
    }
  }
  const client = requireClient && !draft.client ? 'Choose a client to send this invoice to' : undefined;
  return { client, items, count: count + (client ? 1 : 0) };
}

export default function NewInvoiceScreen() {
  const { colors, spacing } = useTheme();
  const { profile, user } = useAuth();
  const scrollRef = useRef<ScrollView>(null);
  const currencyTouched = useRef(false);
  const pdfCache = useRef<Promise<string> | null>(null);

  const [draft, setDraft] = useState<InvoiceDraft>(createInitialDraft);
  const [taxText, setTaxText] = useState('');
  const [discountText, setDiscountText] = useState('');
  const [dirty, setDirty] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState<'draft' | 'sent' | 'paid' | null>(null);
  const [calendar, setCalendar] = useState<CalendarTarget | null>(null);
  const [result, setResult] = useState<InvoiceResult | null>(null);
  const [pdfInput, setPdfInput] = useState<InvoicePdfInput | null>(null);

  const kind: InvoiceKind = draft.kind ?? 'invoice';
  const isReceipt = kind === 'receipt';
  const senderEmail = user?.email ?? undefined;
  const senderName = profile ? `${profile.firstName} ${profile.lastName}`.trim() : user?.displayName || user?.email || 'Endorse user';

  // Start in the currency used last time (unless the user already picked one).
  useEffect(() => {
    let cancelled = false;
    loadLastCurrency().then((code) => {
      if (!cancelled && !currencyTouched.current) setDraft((prev) => ({ ...prev, currency: code }));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const update = useCallback((patch: Partial<InvoiceDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
    setDirty(true);
  }, []);

  const changeItem = useCallback((id: string, patch: Partial<InvoiceLineItem>) => {
    setDraft((prev) => ({ ...prev, items: prev.items.map((item) => (item.id === id ? { ...item, ...patch } : item)) }));
    setDirty(true);
  }, []);

  const removeItem = useCallback((id: string) => {
    triggerHaptic('light');
    setDraft((prev) => (prev.items.length > 1 ? { ...prev, items: prev.items.filter((item) => item.id !== id) } : prev));
    setDirty(true);
  }, []);

  const addItem = useCallback(() => {
    setDraft((prev) => ({ ...prev, items: [...prev.items, { id: makeId('li'), description: '', quantity: 1, unitPrice: 0 }] }));
    setDirty(true);
  }, []);

  const setClient = useCallback((client: InvoiceClient) => update({ client }), [update]);

  const setCurrency = useCallback(
    (currency: string) => {
      currencyTouched.current = true;
      rememberCurrency(currency);
      update({ currency });
    },
    [update],
  );

  const setKind = useCallback((next: InvoiceKind) => {
    setDraft((prev) => {
      // Swap the default note too, but never overwrite one the user wrote.
      const defaultNote = next === 'receipt' ? INVOICE_NOTE : RECEIPT_NOTE;
      const notes = prev.notes === defaultNote ? (next === 'receipt' ? RECEIPT_NOTE : INVOICE_NOTE) : prev.notes;
      return { ...prev, kind: next, number: numberForKind(prev.number, next), notes };
    });
    setShowErrors(false);
  }, []);

  /** Moving the issue date keeps the same payment terms. */
  const setIssueDate = useCallback((issueDate: number) => {
    setDraft((prev) => ({ ...prev, issueDate, dueDate: Math.max(issueDate, prev.dueDate + (issueDate - prev.issueDate)) }));
    setDirty(true);
  }, []);

  const totals = useMemo(() => computeInvoiceTotals(draft), [draft]);
  const validation = useMemo(() => validate(draft, !isReceipt), [draft, isReceipt]);
  const errors = showErrors ? validation : undefined;
  const termDays = Math.round((draft.dueDate - draft.issueDate) / DAY_MS);
  const customTerm = !PAYMENT_TERMS.some((t) => t.days === termDays);
  const currency = getCurrency(draft.currency);

  const handleClose = useCallback(() => {
    if (!dirty || result) {
      finish();
      return;
    }
    Alert.alert(`Discard this ${isReceipt ? 'receipt' : 'invoice'}?`, 'Your changes will be lost.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: finish },
    ]);
  }, [dirty, result, isReceipt]);

  const handleSave = useCallback(
    async (status: 'draft' | 'sent' | 'paid') => {
      if (status !== 'draft' && validation.count > 0) {
        setShowErrors(true);
        triggerHaptic('warning');
        if (validation.client) scrollRef.current?.scrollTo({ y: 0, animated: true });
        return;
      }
      // A receipt's dates are the day the money arrived.
      const final: InvoiceDraft = isReceipt
        ? { ...draft, issueDate: draft.paidAt ?? draft.issueDate, dueDate: draft.paidAt ?? draft.issueDate }
        : draft;
      setSaving(status);
      try {
        const saved = await saveInvoice(final, status);
        triggerHaptic('success');
        pdfCache.current = null;
        setPdfInput({ draft: final, totals, status, sender: { name: senderName, email: senderEmail } });
        setResult({
          kind,
          number: saved.number,
          status,
          clientName: final.client?.name,
          clientEmail: final.client?.email || undefined,
          total: totals.total,
          currency: final.currency,
          senderName,
        });
      } catch (error) {
        Alert.alert(`Could not save ${isReceipt ? 'receipt' : 'invoice'}`, error instanceof Error ? error.message : 'Please try again.');
      } finally {
        setSaving(null);
      }
    },
    [draft, isReceipt, kind, senderEmail, senderName, totals, validation],
  );

  // Built once on first share, then reused for WhatsApp / email / more.
  const getPdf = useCallback(() => {
    if (!pdfInput) return Promise.reject(new Error('Nothing to share yet'));
    pdfCache.current ??= invoicePdf(pdfInput).catch((error: unknown) => {
      pdfCache.current = null;
      throw error;
    });
    return pdfCache.current;
  }, [pdfInput]);

  const printOnWeb = useCallback(() => {
    if (!pdfInput) return;
    printInvoiceOnWeb(pdfInput).catch((error: unknown) =>
      Alert.alert('Couldn’t open the print view', error instanceof Error ? error.message : 'Please try again.'),
    );
  }, [pdfInput]);

  const reset = useCallback(() => {
    const keepKind = kind;
    const next = createInitialDraft();
    setDraft({
      ...next,
      currency: draft.currency,
      kind: keepKind,
      number: numberForKind(next.number, keepKind),
      notes: keepKind === 'receipt' ? RECEIPT_NOTE : INVOICE_NOTE,
    });
    setTaxText('');
    setDiscountText('');
    setDirty(false);
    setShowErrors(false);
    setResult(null);
    setPdfInput(null);
    pdfCache.current = null;
  }, [draft.currency, kind]);

  if (result) {
    return (
      <Screen edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.grow}>
          <InvoiceSuccess result={result} getPdf={getPdf} onPrintWeb={printOnWeb} onDone={finish} onCreateAnother={reset} />
        </ScrollView>
      </Screen>
    );
  }

  const calendarValue = calendar === 'due' ? draft.dueDate : calendar === 'paid' ? (draft.paidAt ?? draft.issueDate) : draft.issueDate;

  return (
    <Screen>
      <ScreenHeader title={isReceipt ? 'New receipt' : 'New invoice'} subtitle={draft.number} leading="close" onLeadingPress={handleClose} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={{ padding: spacing.xl, paddingTop: spacing.sm, gap: spacing.xxl }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive">
          <View style={{ gap: spacing.md }}>
            <KindToggle value={kind} onChange={setKind} />
            <View style={[styles.metaRow, { gap: spacing.sm }]}>
              {isReceipt ? <StatusChip status="completed" label="Paid" /> : <StatusChip status="draft" />}
              <Typography variant="caption" tone="textTertiary" style={styles.flex} numberOfLines={1}>
                {draft.number}
              </Typography>
              <CurrencyPicker value={draft.currency} onChange={setCurrency} />
            </View>
          </View>

          <Section title={isReceipt ? 'Received from' : 'Bill to'} subtitle={isReceipt ? 'Optional' : undefined}>
            <ClientPicker client={draft.client} error={errors?.client} onChange={setClient} />
          </Section>

          {isReceipt ? (
            <Section title="Payment">
              <Card style={{ gap: spacing.lg }}>
                <DateField
                  label="Payment date"
                  value={draft.paidAt ?? draft.issueDate}
                  onPress={() => setCalendar('paid')}
                  hint="When the money was received"
                />
                <View style={{ gap: spacing.sm }}>
                  <Typography variant="captionStrong" tone="textSecondary">
                    Payment method
                  </Typography>
                  <View style={[styles.wrapRow, { gap: spacing.sm }]}>
                    {PAYMENT_METHODS.map((method) => (
                      <Chip
                        key={method}
                        label={PAYMENT_METHOD_LABELS[method]}
                        selected={draft.paymentMethod === method}
                        onPress={() => update({ paymentMethod: method })}
                      />
                    ))}
                  </View>
                </View>
                <TextField
                  label="Reference (optional)"
                  value={draft.paymentReference ?? ''}
                  onChangeText={(paymentReference) => update({ paymentReference })}
                  placeholder="Transfer or teller reference"
                  autoCapitalize="characters"
                />
              </Card>
            </Section>
          ) : (
            <Section title="Dates">
              <Card style={{ gap: spacing.lg }}>
                <DateField label="Issue date" value={draft.issueDate} onPress={() => setCalendar('issue')} />
                <DateField label="Due date" value={draft.dueDate} onPress={() => setCalendar('due')} />
                <View style={[styles.wrapRow, { gap: spacing.sm }]}>
                  {PAYMENT_TERMS.map((term) => (
                    <Chip
                      key={term.label}
                      label={term.label}
                      selected={termDays === term.days}
                      onPress={() => update({ dueDate: draft.issueDate + term.days * DAY_MS })}
                    />
                  ))}
                  <Chip label="Pick date" selected={customTerm} onPress={() => setCalendar('due')} />
                </View>
              </Card>
            </Section>
          )}

          <Section title="Line items" subtitle={`${draft.items.length} ${draft.items.length === 1 ? 'item' : 'items'}`}>
            <View style={{ gap: spacing.md }}>
              {draft.items.map((item, index) => (
                <LineItemRow
                  key={item.id}
                  item={item}
                  index={index}
                  currency={draft.currency}
                  canRemove={draft.items.length > 1}
                  errors={errors?.items[item.id]}
                  onChange={changeItem}
                  onRemove={removeItem}
                />
              ))}
              <Button label="Add line item" icon={Plus} variant="secondary" onPress={addItem} />
            </View>
          </Section>

          <Section title="Adjustments">
            <View style={[styles.row, { gap: spacing.md }]}>
              <TextField
                label="Tax rate"
                value={taxText}
                onChangeText={(text) => {
                  const clean = sanitizeAmountInput(text);
                  setTaxText(clean);
                  update({ taxRate: Math.min(parseAmount(clean), 100) });
                }}
                placeholder="0"
                keyboardType="decimal-pad"
                containerStyle={styles.flex}
                trailing={<Typography variant="caption" tone="textTertiary">%</Typography>}
              />
              <TextField
                label="Discount"
                value={discountText}
                onChangeText={(text) => {
                  const clean = sanitizeAmountInput(text);
                  setDiscountText(clean);
                  update({ discount: parseAmount(clean) });
                }}
                placeholder={currency.decimals ? '0.00' : '0'}
                keyboardType="decimal-pad"
                containerStyle={styles.flex}
                trailing={<Typography variant="caption" tone="textTertiary">{currency.symbol}</Typography>}
              />
            </View>
          </Section>

          <Section title="Notes">
            <TextField
              label={isReceipt ? 'Note to customer' : 'Message to client'}
              value={draft.notes}
              onChangeText={(notes) => update({ notes })}
              placeholder={isReceipt ? 'Thank-you note…' : 'Payment instructions, thank-you note…'}
              multiline
            />
          </Section>

          <Card style={{ gap: spacing.md }} accessible accessibilityLabel={`Total ${formatMoney(totals.total, draft.currency)}`}>
            <SummaryRow label="Subtotal" value={formatMoney(totals.subtotal, draft.currency)} />
            {totals.discount > 0 ? <SummaryRow label="Discount" value={`−${formatMoney(totals.discount, draft.currency)}`} /> : null}
            <SummaryRow label={`Tax${draft.taxRate ? ` (${draft.taxRate}%)` : ''}`} value={formatMoney(totals.tax, draft.currency)} />
            <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
              <Typography variant="title3">{isReceipt ? 'Amount paid' : 'Total'}</Typography>
              <Typography variant="title1">{formatMoney(totals.total, draft.currency)}</Typography>
            </View>
          </Card>
        </ScrollView>

        <StickyFooter
          summary={
            <View style={styles.footerSummary}>
              <View style={styles.flex}>
                <Typography variant="caption" tone="textSecondary">
                  {isReceipt ? 'Amount received' : 'Total due'}
                </Typography>
                {errors && validation.count > 0 ? (
                  <Typography variant="caption" color={colors.status.declined.fg} accessibilityLiveRegion="polite">
                    Fix {validation.count} {validation.count === 1 ? 'issue' : 'issues'} above to {isReceipt ? 'save' : 'send'}
                  </Typography>
                ) : null}
              </View>
              <Typography variant="title2">{formatMoney(totals.total, draft.currency)}</Typography>
            </View>
          }>
          {isReceipt ? (
            <Button
              label="Save receipt"
              icon={Receipt}
              onPress={() => handleSave('paid')}
              loading={saving === 'paid'}
              disabled={saving !== null}
              haptic="medium"
              style={styles.flex}
            />
          ) : (
            <>
              <Button
                label="Save draft"
                variant="secondary"
                onPress={() => handleSave('draft')}
                loading={saving === 'draft'}
                disabled={saving !== null}
                style={styles.flex}
              />
              <Button
                label="Send invoice"
                icon={Send}
                onPress={() => handleSave('sent')}
                loading={saving === 'sent'}
                disabled={saving !== null}
                haptic="medium"
                style={styles.flex}
              />
            </>
          )}
        </StickyFooter>
      </KeyboardAvoidingView>

      <CalendarSheet
        visible={calendar !== null}
        title={calendar === 'due' ? 'Due date' : calendar === 'paid' ? 'Payment date' : 'Issue date'}
        value={calendarValue}
        minDate={calendar === 'due' ? draft.issueDate : undefined}
        onRequestClose={() => setCalendar(null)}
        onSelect={(value) => {
          if (calendar === 'issue') setIssueDate(value);
          else if (calendar === 'due') update({ dueDate: value });
          else if (calendar === 'paid') update({ paidAt: value });
        }}
      />
    </Screen>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionTitle}>
        <Typography variant="title3" accessibilityRole="header" style={styles.flex}>
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="caption" tone="textTertiary">
            {subtitle}
          </Typography>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Typography variant="callout" tone="textSecondary">
        {label}
      </Typography>
      <Typography variant="calloutStrong">{value}</Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  grow: { flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap' },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  section: { gap: 10 },
  sectionTitle: { flexDirection: 'row', alignItems: 'center' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12 },
  footerSummary: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
