/**
 * Dashboard data access. Each section has its own fetcher so one failure
 * never blocks the rest; the document-based sections share a single
 * Firestore round-trip via `listDocumentRecords()`.
 */
import { doc, getDoc } from 'firebase/firestore';
import { Linking } from 'react-native';

import { fetchContacts } from '@/lib/contacts';
import { db } from '@/lib/firebase';
import {
  getDocumentRecord,
  listDocumentRecords,
  recordFileUri,
  remindSigners,
  toActivity,
  toSummary,
  voidDocument,
} from '@/lib/firestore/documents';
import { fetchInvoiceSummary } from '@/lib/invoices/api';
import { requireUser } from '@/lib/session';
import { fetchTemplateList } from '@/lib/templates/api';
import type {
  ActivityEvent,
  AgreementTemplate,
  DashboardData,
  DashboardSection,
  DashboardUser,
  DocumentAction,
  DocumentSummary,
  SearchResults,
  StatusCount,
  StatusFilter,
} from '@/types/dashboard';
import { matchesFilter } from './format';

const FILTERS: StatusFilter[] = ['awaiting_me', 'waiting_on_others', 'expiring_soon', 'completed', 'draft'];
const ACTIVITY_LIMIT = 20;
const FEATURED_TEMPLATES = 8;

async function summaries(): Promise<DocumentSummary[]> {
  const me = requireUser();
  const now = Date.now();
  return (await listDocumentRecords()).map((r) => toSummary(r, me, now));
}

export async function fetchUser(): Promise<DashboardUser> {
  const me = requireUser();
  const [profileSnap, docs] = await Promise.all([getDoc(doc(db, 'users', me.uid)), summaries()]);
  const profile = profileSnap.data();
  const [first, ...rest] = me.name.split(' ');
  return {
    firstName: profile?.firstName || first,
    lastName: profile?.lastName || rest.join(' '),
    email: me.email,
    // TODO(api): replace with a real notifications inbox; for now, things waiting on you.
    unreadNotifications: docs.filter((d) => d.status === 'awaiting_me').length,
  };
}

export async function fetchStatusCounts(): Promise<StatusCount[]> {
  const docs = await summaries();
  return FILTERS.map((filter) => ({ filter, count: docs.filter((d) => matchesFilter(d, filter)).length }));
}

export async function fetchActionRequired(): Promise<DocumentSummary[]> {
  return (await summaries())
    .filter((d) => d.status === 'awaiting_me')
    .sort((a, b) => (a.expiresAt ?? Infinity) - (b.expiresAt ?? Infinity));
}

export function fetchRecentDocuments(): Promise<DocumentSummary[]> {
  return summaries();
}

export async function fetchTemplates(): Promise<AgreementTemplate[]> {
  return (await fetchTemplateList()).slice(0, FEATURED_TEMPLATES);
}

export async function fetchActivity(): Promise<ActivityEvent[]> {
  const records = await listDocumentRecords();
  return records
    .flatMap(toActivity)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, ACTIVITY_LIMIT);
}

export const dashboardFetchers: { [K in DashboardSection]: () => Promise<DashboardData[K]> } = {
  user: fetchUser,
  stats: fetchStatusCounts,
  actionRequired: fetchActionRequired,
  documents: fetchRecentDocuments,
  templates: fetchTemplates,
  invoices: fetchInvoiceSummary,
  activity: fetchActivity,
};

/** Client-side search across the user's documents, templates and contacts. */
export async function searchDashboard(term: string): Promise<SearchResults> {
  const q = term.toLowerCase();
  const has = (...values: (string | undefined)[]) => values.some((v) => v?.toLowerCase().includes(q));
  const [docs, templates, contacts] = await Promise.all([summaries(), fetchTemplateList(), fetchContacts()]);
  return {
    documents: docs.filter((d) => has(d.title, d.sender.name, ...d.recipients.map((r) => r.name))),
    templates: templates.filter((t) => has(t.name, t.category)),
    contacts: contacts.filter((c) => has(c.name, c.email, c.company)),
  };
}

/** Overflow-menu actions. Share is handled by the caller with the system share sheet. */
export async function performDocumentAction(documentId: string, action: DocumentAction): Promise<void> {
  switch (action) {
    case 'resend':
      return remindSigners(documentId);
    case 'void':
      return voidDocument(documentId);
    case 'download': {
      const record = await getDocumentRecord(documentId);
      const fileUri = recordFileUri(record, requireUser());
      if (!fileUri) throw new Error('This document has no stored file to download.');
      await Linking.openURL(fileUri);
      return;
    }
    case 'share':
      return;
  }
}
