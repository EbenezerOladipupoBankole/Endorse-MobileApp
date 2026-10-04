/**
 * Domain models for the dashboard. These describe the shape the UI expects;
 * the API layer (`lib/dashboard/api.ts`) is responsible for mapping backend
 * payloads (Firestore, REST, etc.) into these types.
 */

export type DocumentStatus =
  | 'awaiting_me' // the current user must sign
  | 'waiting_on_others' // sent, pending other signers
  | 'completed'
  | 'draft'
  | 'declined'
  | 'expired'
  | 'voided';

/** Filters exposed by the status overview cards. */
export type StatusFilter = 'awaiting_me' | 'waiting_on_others' | 'completed' | 'draft' | 'expiring_soon';

export interface Person {
  id: string;
  name: string;
  email: string;
}

export interface DocumentSummary {
  id: string;
  title: string;
  status: DocumentStatus;
  sender: Person;
  recipients: Person[];
  /** Epoch ms of the last meaningful change. */
  updatedAt: number;
  /** Epoch ms after which the envelope expires, if any. */
  expiresAt?: number;
  /** Server-computed: expires within the "expiring soon" window. */
  isExpiringSoon: boolean;
  pageCount: number;
  fileType: 'pdf' | 'docx' | 'image';
}

export interface StatusCount {
  filter: StatusFilter;
  count: number;
}

export type TemplateCategory = 'Legal' | 'Sales' | 'HR' | 'Real estate' | 'Services';

export interface AgreementTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  fieldCount: number;
  estimatedMinutes: number;
  usageCount: number;
  /** Read-only starter template shipped with the app. */
  builtIn?: boolean;
}

export interface InvoiceSummary {
  currency: string;
  paid: number;
  unpaid: number;
  overdue: number;
  overdueCount: number;
  /** Amount collected per period, oldest first. */
  trend: number[];
  trendLabel: string;
  /** Percent change of the latest period vs. the previous one. */
  changePct: number;
  /** Total invoices on the account (0 → show the empty state). */
  invoiceCount: number;
}

export type ActivityType = 'sent' | 'viewed' | 'signed' | 'declined' | 'reminder_sent' | 'completed' | 'voided';

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  actorName: string;
  documentId: string;
  documentTitle: string;
  timestamp: number;
}

export interface DashboardUser {
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  unreadNotifications: number;
}

export interface Contact extends Person {
  company?: string;
}

export interface SearchResults {
  documents: DocumentSummary[];
  templates: AgreementTemplate[];
  contacts: Contact[];
}

/** Everything the dashboard renders, keyed by section. */
export interface DashboardData {
  user: DashboardUser;
  stats: StatusCount[];
  actionRequired: DocumentSummary[];
  documents: DocumentSummary[];
  templates: AgreementTemplate[];
  invoices: InvoiceSummary;
  activity: ActivityEvent[];
}

export type DashboardSection = keyof DashboardData;

export type ResourceStatus = 'loading' | 'success' | 'error';

/** Async state for a single section. `data` is kept on error/refresh (stale-while-revalidate). */
export interface Resource<T> {
  status: ResourceStatus;
  data?: T;
  error?: string;
  /** Epoch ms when `data` was fetched; used as "now" for relative dates. */
  fetchedAt?: number;
}

export type DocumentAction = 'resend' | 'download' | 'share' | 'void';
