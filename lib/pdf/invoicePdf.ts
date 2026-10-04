/**
 * Branded invoice / receipt PDF for sharing via WhatsApp or email.
 */
import { formatMoney } from '@/lib/invoices/currencies';
import type { InvoiceDraft, InvoiceTotals, PaymentMethod } from '@/types/workflows';
import { BRAND, brandedPage, escapeHtml, htmlToPdf } from './html';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank transfer',
  card: 'Card',
  mobile_money: 'Mobile money',
  pos: 'POS',
  cheque: 'Cheque',
  other: 'Other',
};

export interface InvoicePdfInput {
  draft: InvoiceDraft;
  totals: InvoiceTotals;
  /** Saved status, shown on invoices ("Draft" / "Sent"). */
  status: 'draft' | 'sent' | 'paid';
  sender: { name: string; email?: string };
}

const fmtDate = (ms: number) => new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

export function invoiceTitle({ draft }: Pick<InvoicePdfInput, 'draft'>): string {
  return `${draft.kind === 'receipt' ? 'Receipt' : 'Invoice'} ${draft.number}`;
}

export async function invoicePdfHtml({ draft, totals, status, sender }: InvoicePdfInput): Promise<string> {
  const receipt = draft.kind === 'receipt';
  const money = (n: number) => escapeHtml(formatMoney(n, draft.currency));
  const client = draft.client;

  const party = (label: string, lines: (string | undefined)[]) => `
    <div style="flex:1">
      <div class="muted" style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;margin-bottom:4px">${label}</div>
      ${lines.filter(Boolean).map((l, i) => `<div style="${i === 0 ? 'font-weight:700;font-size:13px' : ''}">${escapeHtml(l!)}</div>`).join('')}
    </div>`;

  const meta: [string, string][] = receipt
    ? [
        ['Receipt no.', draft.number],
        ['Payment date', fmtDate(draft.paidAt ?? draft.issueDate)],
        ['Payment method', draft.paymentMethod ? PAYMENT_METHOD_LABELS[draft.paymentMethod] : '—'],
        ...(draft.paymentReference ? [['Reference', draft.paymentReference] as [string, string]] : []),
      ]
    : [
        ['Invoice no.', draft.number],
        ['Issue date', fmtDate(draft.issueDate)],
        ['Due date', fmtDate(draft.dueDate)],
        ['Status', status === 'sent' ? 'Awaiting payment' : 'Draft'],
      ];

  const rows = draft.items
    .filter((item) => item.description.trim() || item.unitPrice > 0)
    .map(
      (item) => `<tr>
        <td>${escapeHtml(item.description || '—')}</td>
        <td class="right">${item.quantity}</td>
        <td class="right">${money(item.unitPrice)}</td>
        <td class="right">${money(item.quantity * item.unitPrice)}</td>
      </tr>`,
    )
    .join('');

  const stamp = receipt
    ? `<div style="position:absolute;top:0;right:0;transform:rotate(-8deg);border:3px solid #1A7A4C;color:#1A7A4C;border-radius:8px;padding:4px 14px;font-weight:800;font-size:22px;letter-spacing:3px">PAID</div>`
    : '';

  const body = `
    <div style="position:relative">
      ${stamp}
      <h1 style="font-size:28px;letter-spacing:2px">${receipt ? 'RECEIPT' : 'INVOICE'}</h1>
      <div class="muted">${escapeHtml(draft.number)}</div>
    </div>

    <div style="display:flex;gap:24px;margin:22px 0">
      ${party('From', [sender.name, sender.email])}
      ${party(receipt ? 'Received from' : 'Bill to', client ? [client.name, client.company, client.email] : ['—'])}
      <div style="flex:1">
        ${meta.map(([k, v]) => `<div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:3px"><span class="muted">${escapeHtml(k)}</span><strong>${escapeHtml(v)}</strong></div>`).join('')}
      </div>
    </div>

    <table>
      <thead><tr><th>Description</th><th class="right">Qty</th><th class="right">Unit price</th><th class="right">Amount</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="4" class="muted">No line items</td></tr>'}</tbody>
    </table>

    <div style="display:flex;justify-content:flex-end;margin-top:14px">
      <table style="width:46%">
        <tr><td class="muted">Subtotal</td><td class="right">${money(totals.subtotal)}</td></tr>
        ${totals.discount > 0 ? `<tr><td class="muted">Discount</td><td class="right">−${money(totals.discount)}</td></tr>` : ''}
        <tr><td class="muted">Tax${draft.taxRate ? ` (${draft.taxRate}%)` : ''}</td><td class="right">${money(totals.tax)}</td></tr>
        <tr><td style="font-weight:800;font-size:14px;border-bottom:none;background:${BRAND.muted}">${receipt ? 'Amount paid' : 'Total due'}</td>
            <td class="right" style="font-weight:800;font-size:14px;border-bottom:none;background:${BRAND.muted};color:${BRAND.blue}">${money(totals.total)}</td></tr>
      </table>
    </div>

    ${draft.notes.trim() ? `<h2>Notes</h2><p>${escapeHtml(draft.notes).replace(/\n/g, '<br/>')}</p>` : ''}

    <div class="footer">Amounts in ${escapeHtml(draft.currency)}. Generated with Endorse on ${fmtDate(Date.now())}.</div>`;

  return brandedPage(body, { title: invoiceTitle({ draft }) });
}

interface PrintWindow {
  document: { write: (html: string) => void; close: () => void };
  focus: () => void;
  print: () => void;
}

/**
 * Web only: expo-print can't render HTML to a file in the browser, so open the
 * document in a new tab and show the print dialog ("Save as PDF").
 */
export async function printInvoiceOnWeb(input: InvoicePdfInput): Promise<void> {
  const html = await invoicePdfHtml(input);
  const open = (globalThis as unknown as { open?: (url: string, target: string) => PrintWindow | null }).open;
  const win = open?.('', '_blank');
  if (!win) throw new Error('Your browser blocked the print window. Allow pop-ups and try again.');
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}

/** Renders the invoice/receipt to a local PDF and returns its file URI. */
export async function invoicePdf(input: InvoicePdfInput): Promise<string> {
  return htmlToPdf(await invoicePdfHtml(input), invoiceTitle(input));
}
