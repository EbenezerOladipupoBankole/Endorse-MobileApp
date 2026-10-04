/**
 * Invoice & receipt data access.
 * Collection `invoices/{id}` (ownerId) holds both kinds; `clients/{id}` (ownerId).
 */
import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';

import { CLIENTS_COLLECTION, fetchContacts } from '@/lib/contacts';
import { db } from '@/lib/firebase';
import { makeId } from '@/lib/ids';
import { requireUser } from '@/lib/session';
import type { InvoiceSummary } from '@/types/dashboard';
import type { InvoiceClient, InvoiceDraft, InvoiceKind, InvoiceStatus, InvoiceTotals } from '@/types/workflows';
import { DEFAULT_CURRENCY } from './currencies';

const COLLECTION = 'invoices';
const DAY = 86_400_000;
const WEEK = 7 * DAY;
const TREND_WEEKS = 8;

interface InvoiceRecord extends InvoiceDraft {
  id: string;
  ownerId: string;
  status: InvoiceStatus;
  totals: InvoiceTotals;
  createdAt: number;
  sentAt?: number;
  paidAt?: number;
}

/** Pure: totals are always derived, never trusted from input. */
export function computeInvoiceTotals(draft: Pick<InvoiceDraft, 'items' | 'taxRate' | 'discount'>): InvoiceTotals {
  const subtotal = draft.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discount = Math.min(Math.max(draft.discount, 0), subtotal);
  const tax = ((subtotal - discount) * Math.max(draft.taxRate, 0)) / 100;
  return { subtotal, tax, discount, total: subtotal - discount + tax };
}

/** Saved clients plus people from the user's documents. */
export async function fetchInvoiceClients(): Promise<InvoiceClient[]> {
  return (await fetchContacts()).map(({ id, name, email, company }) => ({ id, name, email, company }));
}

const NUMBER_PREFIX: Record<InvoiceKind, string> = { invoice: 'INV', receipt: 'RCT' };

/** Swaps the INV-/RCT- prefix when the user switches between invoice and receipt. */
export function numberForKind(number: string, kind: InvoiceKind): string {
  return number.replace(/^(INV|RCT)-/, `${NUMBER_PREFIX[kind]}-`);
}

/** Starting point for a new invoice. `now` is passed in to keep callers pure. */
export function newInvoiceDraft(now: number, currency: string = DEFAULT_CURRENCY): InvoiceDraft {
  const d = new Date(now);
  const stamp = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}`;
  return {
    kind: 'invoice',
    // TODO(api): reserve sequential numbers server-side (e.g. a Cloud Function counter).
    number: `INV-${stamp}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    currency,
    client: null,
    issueDate: now,
    dueDate: now + 14 * DAY,
    items: [{ id: makeId('li'), description: '', quantity: 1, unitPrice: 0 }],
    taxRate: 0,
    discount: 0,
    notes: 'Thank you for your business. Payment is due within 14 days.',
    paymentMethod: 'bank_transfer',
    paidAt: now,
  };
}

async function rememberClient(ownerId: string, client: InvoiceClient) {
  const email = client.email.trim().toLowerCase();
  if (!email) return;
  // One client record per email address, keyed deterministically.
  const id = `${ownerId}_${email.replace(/[^a-z0-9]/g, '_')}`;
  await setDoc(doc(db, CLIENTS_COLLECTION, id), { ownerId, name: client.name, email, company: client.company }, { merge: true });
}

/**
 * Saves an invoice (draft or sent) or a receipt (always 'paid').
 * TODO(api): email the invoice to the client when sent.
 */
export async function saveInvoice(
  draft: InvoiceDraft,
  status: Extract<InvoiceStatus, 'draft' | 'sent' | 'paid'>,
): Promise<{ id: string; number: string }> {
  const me = requireUser();
  const kind = draft.kind ?? 'invoice';
  if (status === 'sent' && !draft.client) throw new Error('Choose a client before sending');
  if (kind === 'receipt' && status !== 'paid') throw new Error('Receipts are always saved as paid');
  const now = Date.now();
  const ref = doc(collection(db, COLLECTION));
  const isReceipt = kind === 'receipt';
  const record: Omit<InvoiceRecord, 'id'> = {
    ...draft,
    kind,
    // Invoice-only / receipt-only fields are dropped for the other kind.
    paymentMethod: isReceipt ? draft.paymentMethod : undefined,
    paymentReference: isReceipt ? draft.paymentReference?.trim() || undefined : undefined,
    paidAt: status === 'paid' ? (draft.paidAt ?? now) : undefined,
    ownerId: me.uid,
    status,
    totals: computeInvoiceTotals(draft),
    createdAt: now,
    sentAt: status === 'sent' ? now : undefined,
  };
  await setDoc(ref, record);
  if (draft.client) await rememberClient(me.uid, draft.client).catch(() => {});
  return { id: ref.id, number: draft.number };
}

/**
 * Paid / outstanding / overdue totals and an 8-week trend for the dashboard card.
 * Amounts are never mixed across currencies: the summary uses the currency of the
 * most recently created record and only counts records in that currency.
 */
export async function fetchInvoiceSummary(): Promise<InvoiceSummary> {
  const me = requireUser();
  const snap = await getDocs(query(collection(db, COLLECTION), where('ownerId', '==', me.uid)));
  const all = snap.docs.map((d) => ({ ...(d.data() as Omit<InvoiceRecord, 'id'>), id: d.id }));
  const now = Date.now();
  const latest = all.reduce<(typeof all)[number] | undefined>((a, b) => (!a || (b.createdAt ?? 0) > (a.createdAt ?? 0) ? b : a), undefined);
  const currency = latest?.currency || DEFAULT_CURRENCY;
  // Records saved before currencies were selectable were USD.
  const invoices = all.filter((inv) => (inv.currency || 'USD') === currency);

  let paid = 0;
  let unpaid = 0;
  let overdue = 0;
  let overdueCount = 0;
  const trend = Array.from({ length: TREND_WEEKS }, () => 0);

  for (const inv of invoices) {
    const total = inv.totals?.total ?? computeInvoiceTotals(inv).total;
    if (inv.status === 'paid') paid += total;
    else if (inv.status === 'sent') {
      if (inv.dueDate < now) {
        overdue += total;
        overdueCount += 1;
      } else unpaid += total;
    }
    if (inv.status !== 'draft') {
      // Payments count on the day the money arrived.
      const when = inv.status === 'paid' ? (inv.paidAt ?? inv.issueDate) : inv.issueDate;
      const weeksAgo = Math.floor((now - when) / WEEK);
      if (weeksAgo >= 0 && weeksAgo < TREND_WEEKS) trend[TREND_WEEKS - 1 - weeksAgo] += total;
    }
  }

  const last = trend[TREND_WEEKS - 1];
  const prev = trend[TREND_WEEKS - 2];
  return {
    currency,
    paid,
    unpaid,
    overdue,
    overdueCount,
    trend,
    trendLabel: `Billed & received (${currency}), last 8 weeks`,
    changePct: prev > 0 ? ((last - prev) / prev) * 100 : 0,
    invoiceCount: all.length,
  };
}
