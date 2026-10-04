/**
 * Models for the document viewer, send-for-signature flow, template editor
 * and invoice builder. Mapped from backend payloads in the `lib/{documents,templates,invoices}/api.ts` modules.
 */
import type { ActivityEvent, AgreementTemplate, DocumentSummary, Person, TemplateCategory } from './dashboard';

/* ----------------------------- Documents ----------------------------- */

export type SignerRole = 'signer' | 'approver' | 'viewer';

export type RecipientStatus = 'waiting' | 'sent' | 'viewed' | 'signed' | 'declined';

export interface DocumentRecipient extends Person {
  role: SignerRole;
  /** 1-based signing order. */
  order: number;
  status: RecipientStatus;
  /** Epoch ms of the recipient's last action. */
  actedAt?: number;
}

export interface DocumentDetail extends DocumentSummary {
  createdAt: number;
  sizeLabel: string;
  message?: string;
  /** Per-recipient progress, in signing order. */
  signers: DocumentRecipient[];
  history: ActivityEvent[];
  /** Remote or local file to preview, when available. */
  fileUri?: string;
  /** Agreement text when the document was created from a template (see lib/pdf/agreement.ts). */
  agreementBody?: string;
}

/* ------------------------- Send for signature ------------------------ */

export interface DraftRecipient {
  id: string;
  name: string;
  email: string;
  role: SignerRole;
}

export interface EnvelopeDocument {
  name: string;
  uri?: string;
  templateId?: string;
  pageCount?: number;
}

export interface EnvelopeDraft {
  document: EnvelopeDocument;
  recipients: DraftRecipient[];
  subject: string;
  message: string;
  /** Recipients sign one after another instead of in parallel. */
  signingOrder: boolean;
  expiresInDays: number;
  autoReminders: boolean;
}

/* ----------------------------- Templates ----------------------------- */

export type FieldType = 'signature' | 'initials' | 'name' | 'date' | 'text' | 'checkbox';

export interface TemplateField {
  id: string;
  type: FieldType;
  label: string;
  /** Which role fills this field, e.g. "Client". */
  role: string;
  required: boolean;
}

export interface TemplateDetail extends AgreementTemplate {
  description: string;
  /** Readable agreement text with {{Field label}} placeholders (lib/pdf/agreement.ts). */
  body?: string;
  roles: string[];
  fields: TemplateField[];
  updatedAt: number;
}

export type TemplateDraft = Omit<TemplateDetail, 'id' | 'usageCount' | 'updatedAt' | 'fieldCount'> & { id?: string };

export const TEMPLATE_CATEGORIES: TemplateCategory[] = ['Legal', 'Sales', 'HR', 'Real estate', 'Services'];

/* ------------------------------ Invoices ----------------------------- */

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';

export interface InvoiceClient {
  id: string;
  name: string;
  email: string;
  company?: string;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  /** Unit price in major currency units. */
  unitPrice: number;
}

/** Invoice = request for payment; receipt = record of a payment already received. */
export type InvoiceKind = 'invoice' | 'receipt';

export type PaymentMethod = 'cash' | 'bank_transfer' | 'card' | 'mobile_money' | 'pos' | 'cheque' | 'other';

export interface InvoiceDraft {
  /** Missing on records saved before receipts existed — treat as 'invoice'. */
  kind?: InvoiceKind;
  number: string;
  /** ISO 4217 code, e.g. "NGN" (see lib/invoices/currencies.ts). */
  currency: string;
  client: InvoiceClient | null;
  issueDate: number;
  dueDate: number;
  items: InvoiceLineItem[];
  /** Percent, e.g. 7.5 */
  taxRate: number;
  /** Flat discount in major units. */
  discount: number;
  notes: string;
  /** Receipts: how the payment was made. */
  paymentMethod?: PaymentMethod;
  /** Receipts: transaction / teller / transfer reference. */
  paymentReference?: string;
  /** Receipts: when the payment was received (epoch ms). */
  paidAt?: number;
}

export interface InvoiceTotals {
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
}
