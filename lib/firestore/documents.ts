/**
 * Firestore repository for signature documents.
 *
 * Collection `mobile_documents/{id}` (see firestore.rules) — separate from the
 * web app's `documents` collection so the two data models never collide:
 *   ownerId          sender's uid (ownership key)
 *   ownerEmail       sender's email (informational)
 *   recipientEmails  lower-cased emails of everyone on the envelope (for "sent to me" queries)
 *   signers[]        per-recipient progress, in signing order
 *   history[]        audit trail rendered as the activity feed
 *
 * The stored `status` is the envelope's overall state. What a given user sees
 * ("Sign now" vs "Waiting") is derived per viewer in `toSummary`.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  setDoc,
  where,
  type DocumentData,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import { db, functions } from '@/lib/firebase';
import { isLocalFileUri, isSignatureDataUrl, trustedFileUri } from '@/lib/fileUri';
import { makeId } from '@/lib/ids';
import { requireUser, type SessionUser } from '@/lib/session';
import type { ActivityEvent, ActivityType, DocumentStatus, DocumentSummary, Person } from '@/types/dashboard';
import type { DocumentDetail, DocumentRecipient, RecipientStatus, SignerRole } from '@/types/workflows';

/** Mobile-only collection, kept separate from the web app's `documents`. */
const COLLECTION = 'mobile_documents';
/** Legacy single-signer records written by older app versions. */
const LEGACY_COLLECTION = 'endorsements';
const LEGACY_PREFIX = 'legacy_';
const DAY = 86_400_000;
const EXPIRING_WINDOW = 3 * DAY;

export type StoredStatus = 'draft' | 'waiting_on_others' | 'completed' | 'declined' | 'voided';

export interface StoredSigner {
  id: string;
  name: string;
  email: string;
  role: SignerRole;
  order: number;
  status: RecipientStatus;
  actedAt?: number;
  /** PNG data URL captured on the signing pad. */
  signatureDataUrl?: string;
}

export interface StoredEvent {
  id: string;
  type: ActivityType;
  actorName: string;
  timestamp: number;
}

export interface DocumentRecord {
  id: string;
  ownerId: string;
  ownerEmail: string;
  title: string;
  status: StoredStatus;
  sender: Person;
  signers: StoredSigner[];
  recipientEmails: string[];
  signingOrder: boolean;
  subject?: string;
  message?: string;
  fileUri?: string;
  fileType: 'pdf' | 'docx' | 'image';
  pageCount: number;
  fileSize?: number;
  templateId?: string;
  /** Agreement text snapshot for template-based documents, so any recipient can read it. */
  agreementBody?: string;
  expiresAt?: number;
  createdAt: number;
  updatedAt: number;
  history: StoredEvent[];
  /** Set server-side when the envelope is sent; signatures are only trustworthy after this. */
  sealedAt?: number;
  /** SHA-256 of the stored file / agreement text, taken when the envelope was sent. */
  fileSha256?: string;
  bodySha256?: string;
}

/* ------------------------------------------------------------------ */
/* Mapping                                                             */
/* ------------------------------------------------------------------ */

function fromSnapshot(id: string, data: DocumentData): DocumentRecord {
  return {
    id,
    ownerId: String(data.ownerId ?? ''),
    ownerEmail: String(data.ownerEmail ?? ''),
    title: String(data.title ?? 'Untitled document'),
    status: (data.status as StoredStatus) ?? 'draft',
    sender: data.sender ?? { id: '', name: 'Unknown', email: '' },
    signers: Array.isArray(data.signers) ? data.signers : [],
    recipientEmails: Array.isArray(data.recipientEmails) ? data.recipientEmails : [],
    signingOrder: !!data.signingOrder,
    subject: data.subject,
    message: data.message,
    fileUri: data.fileUri,
    fileType: data.fileType ?? 'pdf',
    pageCount: Number(data.pageCount ?? 1),
    fileSize: data.fileSize,
    templateId: data.templateId,
    agreementBody: typeof data.agreementBody === 'string' ? data.agreementBody : undefined,
    expiresAt: data.expiresAt,
    createdAt: Number(data.createdAt ?? Date.now()),
    updatedAt: Number(data.updatedAt ?? data.createdAt ?? Date.now()),
    history: Array.isArray(data.history) ? data.history : [],
    sealedAt: typeof data.sealedAt === 'number' ? data.sealedAt : undefined,
    fileSha256: typeof data.fileSha256 === 'string' ? data.fileSha256 : undefined,
    bodySha256: typeof data.bodySha256 === 'string' ? data.bodySha256 : undefined,
  };
}

/** Older app versions stored one-person signing records in `endorsements`. */
function fromLegacy(id: string, data: DocumentData, me: SessionUser): DocumentRecord {
  const completed = data.status === 'Completed';
  const createdAt = Number(data.createdAt ?? Date.now());
  const self: Person = { id: me.uid, name: me.name, email: me.email };
  return {
    id: `${LEGACY_PREFIX}${id}`,
    ownerId: me.uid,
    ownerEmail: me.authEmail,
    title: String(data.documentName ?? 'Untitled document'),
    status: completed ? 'completed' : 'waiting_on_others',
    sender: self,
    signers: [
      {
        ...self,
        role: 'signer',
        order: 1,
        status: completed ? 'signed' : 'sent',
        actedAt: data.signedAt,
      },
    ],
    recipientEmails: [me.email],
    signingOrder: false,
    fileUri: data.fileUri ?? data.localUri,
    fileType: String(data.documentName ?? '').toLowerCase().endsWith('.pdf') ? 'pdf' : 'image',
    pageCount: 1,
    createdAt,
    updatedAt: Number(data.signedAt ?? createdAt),
    history: [],
  };
}

export function isOwnedBy(record: DocumentRecord, me: SessionUser): boolean {
  return record.ownerId === me.uid;
}

const actsOnDocument = (s: StoredSigner) => s.role !== 'viewer';

function pendingSignerFor(record: DocumentRecord, email: string): StoredSigner | undefined {
  return record.signers.find((s) => s.email === email && actsOnDocument(s) && s.status !== 'signed' && s.status !== 'declined');
}

function isTurnOf(record: DocumentRecord, signer: StoredSigner): boolean {
  if (!record.signingOrder) return true;
  return record.signers.filter((s) => actsOnDocument(s) && s.order < signer.order).every((s) => s.status === 'signed');
}

/**
 * The document's file link, if it is safe for this viewer to load: our Storage
 * bucket under the owner's folder, or (for the owner only) a file on this device.
 */
export function recordFileUri(record: DocumentRecord, me: SessionUser): string | undefined {
  const uri = trustedFileUri(record.fileUri, record.ownerId);
  if (uri && isLocalFileUri(uri) && !isOwnedBy(record, me)) return undefined;
  return uri;
}

/**
 * Signatures that can go on a signed copy. Until the server seals an envelope,
 * anything in it was written by the sender's device, so nothing counts as signed.
 */
export function trustedSignatures(record: DocumentRecord): StoredSigner[] {
  if (!record.sealedAt && !record.id.startsWith(LEGACY_PREFIX)) return [];
  return record.signers.filter((s) => s.status === 'signed' && isSignatureDataUrl(s.signatureDataUrl));
}

/** Short fingerprint shown on certificates, e.g. "3F2A 9C10 ...". */
export function documentFingerprint(record: DocumentRecord): string | undefined {
  const hash = record.fileSha256 ?? record.bodySha256;
  return hash ? hash.toUpperCase().match(/.{1,4}/g)!.join(' ') : undefined;
}

/** The status this particular viewer should see. */
export function viewerStatus(record: DocumentRecord, me: SessionUser, now: number): DocumentStatus {
  if (record.status !== 'waiting_on_others') return record.status;
  if (record.expiresAt && record.expiresAt < now) return 'expired';
  const mine = pendingSignerFor(record, me.email);
  if (mine && isTurnOf(record, mine)) return 'awaiting_me';
  return 'waiting_on_others';
}

const person = ({ id, name, email }: Person): Person => ({ id, name, email });

export function toSummary(record: DocumentRecord, me: SessionUser, now: number): DocumentSummary {
  const status = viewerStatus(record, me, now);
  const pending = status === 'awaiting_me' || status === 'waiting_on_others';
  return {
    id: record.id,
    title: record.title,
    status,
    sender: person(record.sender),
    recipients: record.signers.map(person),
    updatedAt: record.updatedAt,
    expiresAt: record.expiresAt,
    isExpiringSoon: pending && !!record.expiresAt && record.expiresAt > now && record.expiresAt - now < EXPIRING_WINDOW,
    pageCount: record.pageCount,
    fileType: record.fileType,
  };
}

export function toActivity(record: DocumentRecord): ActivityEvent[] {
  return record.history.map((event) => ({
    id: `${record.id}:${event.id}`,
    type: event.type,
    actorName: event.actorName,
    documentId: record.id,
    documentTitle: record.title,
    timestamp: event.timestamp,
  }));
}

function formatSize(bytes?: number): string {
  if (!bytes) return '—';
  return bytes > 1_000_000 ? `${(bytes / 1_000_000).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1000))} KB`;
}

export function toDetail(record: DocumentRecord, me: SessionUser, now: number): DocumentDetail {
  const signers: DocumentRecipient[] = record.signers.map((s) => ({
    id: s.id,
    name: s.name,
    email: s.email,
    role: s.role,
    order: s.order,
    status: s.status,
    actedAt: s.actedAt,
  }));
  return {
    ...toSummary(record, me, now),
    createdAt: record.createdAt,
    sizeLabel: formatSize(record.fileSize),
    message: record.message,
    signers,
    history: toActivity(record).sort((a, b) => b.timestamp - a.timestamp),
    fileUri: recordFileUri(record, me),
    agreementBody: record.agreementBody,
  };
}

/* ------------------------------------------------------------------ */
/* Reads                                                               */
/* ------------------------------------------------------------------ */

async function queryDocuments(me: SessionUser): Promise<DocumentRecord[]> {
  const owned = getDocs(query(collection(db, COLLECTION), where('ownerId', '==', me.uid)));
  // Rules only allow "sent to me" reads once the email address is verified.
  const incoming = me.emailVerified && me.email
    ? getDocs(query(collection(db, COLLECTION), where('recipientEmails', 'array-contains', me.email)))
    : Promise.resolve(null);
  const legacy = getDocs(query(collection(db, LEGACY_COLLECTION), where('signerId', '==', me.uid))).catch(() => null);

  const [ownedSnap, incomingSnap, legacySnap] = await Promise.all([owned, incoming, legacy]);
  const byId = new Map<string, DocumentRecord>();
  for (const snap of [ownedSnap, incomingSnap]) {
    snap?.docs.forEach((d) => byId.set(d.id, fromSnapshot(d.id, d.data())));
  }
  legacySnap?.docs.forEach((d) => {
    const record = fromLegacy(d.id, d.data(), me);
    byId.set(record.id, record);
  });
  return [...byId.values()].sort((a, b) => b.updatedAt - a.updatedAt);
}

let cache: { uid: string; at: number; promise: Promise<DocumentRecord[]> } | null = null;

/**
 * All documents the signed-in user owns or was sent. Concurrent callers
 * (the dashboard loads several sections at once) share one round-trip.
 */
export function listDocumentRecords(maxAgeMs = 1500): Promise<DocumentRecord[]> {
  const me = requireUser();
  const now = Date.now();
  if (cache && cache.uid === me.uid && now - cache.at < maxAgeMs) return cache.promise;
  const promise = queryDocuments(me);
  cache = { uid: me.uid, at: now, promise };
  promise.catch(() => {
    cache = null;
  });
  return promise;
}

export function invalidateDocumentCache() {
  cache = null;
}

export async function listDocumentSummaries(): Promise<DocumentSummary[]> {
  const me = requireUser();
  const now = Date.now();
  return (await listDocumentRecords()).map((r) => toSummary(r, me, now));
}

export async function getDocumentRecord(id: string): Promise<DocumentRecord> {
  const me = requireUser();
  if (id.startsWith(LEGACY_PREFIX)) {
    const snap = await getDoc(doc(db, LEGACY_COLLECTION, id.slice(LEGACY_PREFIX.length)));
    if (!snap.exists()) throw new Error('Document not found');
    return fromLegacy(snap.id, snap.data(), me);
  }
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) throw new Error('Document not found');
  return fromSnapshot(snap.id, snap.data());
}

/* ------------------------------------------------------------------ */
/* Writes                                                              */
/* ------------------------------------------------------------------ */

const event = (type: ActivityType, actorName: string, timestamp: number): StoredEvent => ({
  id: makeId('ev'),
  type,
  actorName,
  timestamp,
});

export interface NewDocumentInput {
  title: string;
  status: StoredStatus;
  signers: Omit<StoredSigner, 'order' | 'status'>[];
  signingOrder?: boolean;
  subject?: string;
  message?: string;
  fileUri?: string;
  fileType?: DocumentRecord['fileType'];
  pageCount?: number;
  fileSize?: number;
  templateId?: string;
  agreementBody?: string;
  expiresAt?: number;
  /** Initial signer status; defaults to "sent" for waiting documents. */
  signerStatus?: RecipientStatus;
  firstEvent?: ActivityType;
}

export async function createDocument(input: NewDocumentInput): Promise<string> {
  const me = requireUser();
  const now = Date.now();
  const ref = doc(collection(db, COLLECTION));
  const signers: StoredSigner[] = input.signers.map((s, i) => ({
    ...s,
    email: s.email.trim().toLowerCase(),
    order: i + 1,
    status: input.signerStatus ?? (input.status === 'draft' ? 'waiting' : 'sent'),
  }));
  const record: Omit<DocumentRecord, 'id'> = {
    ownerId: me.uid,
    ownerEmail: me.authEmail,
    title: input.title,
    status: input.status,
    sender: { id: me.uid, name: me.name, email: me.email },
    signers,
    recipientEmails: [...new Set(signers.map((s) => s.email))],
    signingOrder: !!input.signingOrder,
    subject: input.subject,
    message: input.message,
    fileUri: trustedFileUri(input.fileUri, me.uid),
    fileType: input.fileType ?? 'pdf',
    pageCount: input.pageCount ?? 1,
    fileSize: input.fileSize,
    templateId: input.templateId,
    agreementBody: input.agreementBody,
    expiresAt: input.expiresAt,
    createdAt: now,
    updatedAt: now,
    history: input.firstEvent ? [event(input.firstEvent, me.name, now)] : [],
  };
  await setDoc(ref, record);
  invalidateDocumentCache();
  return ref.id;
}

/**
 * Once sent, envelopes are only changed server-side (functions/src/index.ts), which
 * checks the caller's verified email, signing order and expiry and uses the server clock.
 */
async function callEnvelopeFunction(name: string, data: Record<string, unknown>) {
  try {
    await httpsCallable(functions, name)(data);
  } finally {
    invalidateDocumentCache();
  }
}

/** Records that the current user opened a document they were asked to sign. */
export function markViewed(id: string) {
  if (id.startsWith(LEGACY_PREFIX)) return Promise.resolve();
  return callEnvelopeFunction('mobileMarkViewed', { id });
}

/** Applies the current user's signature; the server completes the envelope when everyone has signed. */
export async function signDocument(id: string, signatureDataUrl: string) {
  if (!isSignatureDataUrl(signatureDataUrl)) throw new Error('That signature could not be read. Please sign again.');
  if (id.startsWith(LEGACY_PREFIX)) {
    const ref = doc(db, LEGACY_COLLECTION, id.slice(LEGACY_PREFIX.length));
    await runTransaction(db, async (tx) => {
      tx.update(ref, { status: 'Completed', signedAt: Date.now(), signatureUri: signatureDataUrl });
    });
    invalidateDocumentCache();
    return;
  }
  await callEnvelopeFunction('mobileSignDocument', { id, signatureDataUrl });
}

export function remindSigners(id: string) {
  // TODO(api): the function records the reminder; emailing signers is still to do.
  return callEnvelopeFunction('mobileRemindSigners', { id });
}

export function voidDocument(id: string) {
  return callEnvelopeFunction('mobileVoidDocument', { id });
}

export function declineDocument(id: string) {
  return callEnvelopeFunction('mobileDeclineDocument', { id });
}
