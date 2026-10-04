/**
 * Server-side signing for the mobile app's `mobile_documents` envelopes.
 *
 * Once an envelope leaves draft, clients can no longer write to it (see
 * firestore.rules); every change goes through these functions, which use the
 * Admin SDK, the caller's verified auth token and the server clock:
 *
 *   mobileSignDocument     the caller signs their own entry; completes the envelope when everyone has
 *   mobileDeclineDocument  the caller declines
 *   mobileMarkViewed       the caller opened the document
 *   mobileRemindSigners    owner records a reminder
 *   mobileVoidDocument     owner voids an in-progress envelope
 *   mobileSealDocument     (trigger) when an envelope is sent: clears anything the sender pre-filled for
 *                          other signers, stamps server time and fingerprints the file + agreement text
 *
 * Deployed as its own codebase ("mobile" in firebase.json) so it never touches the web app's functions.
 */
import { createHash, randomBytes } from 'node:crypto';

import { initializeApp } from 'firebase-admin/app';
import { getFirestore, type DocumentReference, type Transaction } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { setGlobalOptions } from 'firebase-functions/v2';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { HttpsError, onCall, type CallableRequest } from 'firebase-functions/v2/https';

initializeApp();
setGlobalOptions({ region: 'us-central1', maxInstances: 10 });

const db = getFirestore();
const COLLECTION = 'mobile_documents';
const SIGNATURE_DATA_URL = /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/]+=*$/;
const MAX_SIGNATURE_LENGTH = 300_000;

type SignerStatus = 'waiting' | 'sent' | 'viewed' | 'signed' | 'declined';
type EventType = 'sent' | 'viewed' | 'signed' | 'declined' | 'reminder_sent' | 'completed' | 'voided';

interface Signer {
  id: string;
  name: string;
  email: string;
  role: 'signer' | 'approver' | 'viewer' | string;
  order: number;
  status: SignerStatus;
  actedAt?: number;
  signatureDataUrl?: string;
}

interface Envelope {
  ownerId: string;
  ownerEmail: string;
  status: 'draft' | 'waiting_on_others' | 'completed' | 'declined' | 'voided';
  sender: { id: string; name: string; email: string };
  signers: Signer[];
  signingOrder?: boolean;
  fileUri?: string;
  agreementBody?: string;
  expiresAt?: number;
  history: { id: string; type: EventType; actorName: string; timestamp: number }[];
  sealedAt?: number;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const event = (type: EventType, actorName: string, timestamp: number) => ({
  id: `ev_${randomBytes(6).toString('hex')}`,
  type,
  actorName,
  timestamp,
});

const actsOnDocument = (s: Signer) => s.role !== 'viewer';

interface Caller {
  uid: string;
  email: string;
  name: string;
}

/** The signed-in caller; envelope actions need a verified email because recipients are matched by email. */
function caller(request: CallableRequest): Caller {
  const token = request.auth?.token;
  if (!request.auth || !token) throw new HttpsError('unauthenticated', 'You need to be signed in.');
  if (!token.email || token.email_verified !== true) {
    throw new HttpsError('permission-denied', 'Verify your email address first.');
  }
  const email = token.email.toLowerCase();
  return { uid: request.auth.uid, email, name: (token.name as string | undefined) || email.split('@')[0] };
}

function documentId(data: unknown): string {
  const id = (data as { id?: unknown } | null)?.id;
  if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(id)) throw new HttpsError('invalid-argument', 'Missing document id.');
  return id;
}

/** Runs `change` in a transaction against a live (sealed, in-progress, unexpired) envelope. */
async function withEnvelope<T>(
  id: string,
  change: (env: Envelope, tx: Transaction, ref: DocumentReference, now: number) => T,
  { requireOpen = true } = {},
): Promise<T> {
  const ref = db.collection(COLLECTION).doc(id);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new HttpsError('not-found', 'Document not found.');
    const env = snap.data() as Envelope;
    const now = Date.now();
    if (requireOpen) {
      if (env.status !== 'waiting_on_others') throw new HttpsError('failed-precondition', 'This document is no longer open for signing.');
      if (env.expiresAt && env.expiresAt < now) throw new HttpsError('failed-precondition', 'This document has expired.');
      if (!env.sealedAt) throw new HttpsError('unavailable', 'This document is still being prepared. Try again in a moment.');
    }
    return change(env, tx, ref, now);
  });
}

function pendingSignerFor(env: Envelope, email: string): Signer | undefined {
  return env.signers.find((s) => s.email === email && actsOnDocument(s) && s.status !== 'signed' && s.status !== 'declined');
}

function isTurnOf(env: Envelope, signer: Signer): boolean {
  if (!env.signingOrder) return true;
  return env.signers.filter((s) => actsOnDocument(s) && s.order < signer.order).every((s) => s.status === 'signed');
}

function requireOwner(env: Envelope, me: Caller) {
  if (env.ownerId !== me.uid) throw new HttpsError('permission-denied', 'Only the sender can do this.');
}

/* ------------------------------------------------------------------ */
/* Callables                                                           */
/* ------------------------------------------------------------------ */

export const mobileSignDocument = onCall(async (request) => {
  const me = caller(request);
  const id = documentId(request.data);
  const signatureDataUrl = (request.data as { signatureDataUrl?: unknown }).signatureDataUrl;
  if (typeof signatureDataUrl !== 'string' || signatureDataUrl.length > MAX_SIGNATURE_LENGTH || !SIGNATURE_DATA_URL.test(signatureDataUrl)) {
    throw new HttpsError('invalid-argument', 'That signature could not be read. Please sign again.');
  }
  return withEnvelope(id, (env, tx, ref, now) => {
    const signer = pendingSignerFor(env, me.email);
    if (!signer) throw new HttpsError('permission-denied', 'There is nothing for you to sign on this document.');
    if (!isTurnOf(env, signer)) throw new HttpsError('failed-precondition', 'It isn’t your turn to sign yet.');
    const signers = env.signers.map((s) => (s === signer ? { ...s, status: 'signed' as const, actedAt: now, signatureDataUrl } : s));
    const done = signers.filter(actsOnDocument).every((s) => s.status === 'signed');
    const history = [...env.history, event('signed', signer.name || me.name, now)];
    if (done) history.push(event('completed', signer.name || me.name, now + 1));
    tx.update(ref, { signers, history, status: done ? 'completed' : env.status, updatedAt: now, ...(done ? { completedAt: now } : {}) });
    return { status: done ? 'completed' : env.status };
  });
});

export const mobileDeclineDocument = onCall(async (request) => {
  const me = caller(request);
  const id = documentId(request.data);
  return withEnvelope(id, (env, tx, ref, now) => {
    const signer = pendingSignerFor(env, me.email);
    if (!signer) throw new HttpsError('permission-denied', 'There is nothing for you to decline.');
    tx.update(ref, {
      status: 'declined',
      signers: env.signers.map((s) => (s === signer ? { ...s, status: 'declined' as const, actedAt: now } : s)),
      history: [...env.history, event('declined', signer.name || me.name, now)],
      updatedAt: now,
    });
    return { status: 'declined' };
  });
});

export const mobileMarkViewed = onCall(async (request) => {
  const me = caller(request);
  const id = documentId(request.data);
  return withEnvelope(id, (env, tx, ref, now) => {
    const signer = env.signers.find((s) => s.email === me.email && s.status === 'sent');
    if (!signer || env.ownerId === me.uid) return { changed: false };
    tx.update(ref, {
      signers: env.signers.map((s) => (s === signer ? { ...s, status: 'viewed' as const, actedAt: now } : s)),
      history: [...env.history, event('viewed', signer.name || me.name, now)],
      updatedAt: now,
    });
    return { changed: true };
  });
});

export const mobileRemindSigners = onCall(async (request) => {
  const me = caller(request);
  const id = documentId(request.data);
  // TODO(api): email the pending signers from here.
  return withEnvelope(id, (env, tx, ref, now) => {
    requireOwner(env, me);
    tx.update(ref, { history: [...env.history, event('reminder_sent', env.sender.name || me.name, now)], updatedAt: now });
    return { ok: true };
  });
});

export const mobileVoidDocument = onCall(async (request) => {
  const me = caller(request);
  const id = documentId(request.data);
  return withEnvelope(
    id,
    (env, tx, ref, now) => {
      requireOwner(env, me);
      if (env.status !== 'waiting_on_others' && env.status !== 'draft') {
        throw new HttpsError('failed-precondition', 'Only documents still in progress can be voided.');
      }
      tx.update(ref, { status: 'voided', history: [...env.history, event('voided', env.sender.name || me.name, now)], updatedAt: now });
      return { status: 'voided' };
    },
    { requireOpen: false },
  );
});

/* ------------------------------------------------------------------ */
/* Sealing                                                             */
/* ------------------------------------------------------------------ */

const sha256 = (data: Buffer | string) => createHash('sha256').update(data).digest('hex');

/** `documents/...` object path from one of our bucket's download URLs, or null for anything else. */
function storagePath(fileUri: string | undefined, bucket: string, ownerId: string): string | null {
  if (!fileUri) return null;
  const prefix = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/`;
  if (!fileUri.startsWith(prefix)) return null;
  const path = decodeURIComponent(fileUri.slice(prefix.length).split('?')[0]);
  return path.startsWith(`documents/${ownerId}/`) ? path : null;
}

/**
 * The sender wrote this envelope from their device, so nothing in it is trusted yet.
 * When it leaves draft: reset every signer to "sent" (no pre-filled signatures),
 * except a sender signing their own upload; replace history with one server-timed event;
 * and fingerprint the file and agreement text so later tampering is detectable.
 */
export const mobileSealDocument = onDocumentWritten(`${COLLECTION}/{docId}`, async (e) => {
  const after = e.data?.after;
  if (!after?.exists) return;
  const env = after.data() as Envelope;
  if (env.status === 'draft' || env.sealedAt) return;

  const now = Date.now();
  const ownerEmail = (env.ownerEmail || '').toLowerCase();
  const selfSigned = env.status === 'completed' && env.signers.length === 1 && env.signers[0].email === ownerEmail;

  let fileSha256: string | null = null;
  const bucket = env.fileUri?.startsWith('https://') ? getStorage().bucket() : null;
  const path = bucket && storagePath(env.fileUri, bucket.name, env.ownerId);
  if (bucket && path) {
    try {
      const [bytes] = await bucket.file(path).download();
      fileSha256 = sha256(bytes);
    } catch (error) {
      console.warn(`Could not fingerprint ${path}`, error);
    }
  }

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(after.ref);
    const current = snap.data() as Envelope | undefined;
    if (!current || current.status === 'draft' || current.sealedAt) return;
    const signers = selfSigned
      ? current.signers.map((s) => ({ ...s, actedAt: now }))
      : current.signers.map(({ signatureDataUrl: _sig, actedAt: _at, ...s }) => ({ ...s, status: 'sent' as const }));
    tx.update(after.ref, {
      signers,
      status: selfSigned ? 'completed' : 'waiting_on_others',
      history: [event(selfSigned ? 'signed' : 'sent', current.sender?.name || 'Sender', now)],
      sealedAt: now,
      updatedAt: now,
      fileSha256,
      bodySha256: current.agreementBody ? sha256(current.agreementBody) : null,
    });
  });
});
