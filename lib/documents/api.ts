/**
 * Document detail + send-for-signature, backed by the `mobile_documents` collection
 * (lib/firestore/documents.ts).
 */
import { createDocument, getDocumentRecord, isOwnedBy, markViewed, toDetail } from '@/lib/firestore/documents';
import { requireUser } from '@/lib/session';
import { uploadUserFile } from '@/lib/storage';
import { fetchTemplateDetail } from '@/lib/templates/api';
import type { DocumentDetail, EnvelopeDraft } from '@/types/workflows';

const DAY = 86_400_000;

export function fileTypeFor(name: string): 'pdf' | 'docx' | 'image' {
  const lower = name.toLowerCase();
  if (lower.endsWith('.pdf')) return 'pdf';
  if (lower.endsWith('.doc') || lower.endsWith('.docx')) return 'docx';
  return /\.(png|jpe?g|heic|webp)$/.test(lower) ? 'image' : 'pdf';
}

export async function fetchDocumentDetail(id: string): Promise<DocumentDetail> {
  const me = requireUser();
  let record = await getDocumentRecord(id);
  // Opening a document you were asked to sign marks it "viewed" for the sender.
  const mine = record.signers.find((s) => s.email === me.email);
  if (!isOwnedBy(record, me) && mine?.status === 'sent') {
    try {
      await markViewed(id);
      record = await getDocumentRecord(id);
    } catch (error) {
      console.warn('Could not record view', error);
    }
  }
  return toDetail(record, me, Date.now());
}

/** Uploads the file (when there is one) and creates the envelope. TODO(api): email recipients. */
export async function sendEnvelope(draft: EnvelopeDraft): Promise<{ id: string }> {
  const me = requireUser();
  if (draft.recipients.length === 0) throw new Error('Add at least one recipient');

  const fileUri = draft.document.uri ? await uploadUserFile(me.uid, draft.document.uri, draft.document.name) : undefined;
  // Snapshot the template's agreement text so every recipient can read it, even if the template changes later.
  const template = draft.document.templateId ? await fetchTemplateDetail(draft.document.templateId) : undefined;

  const id = await createDocument({
    title: draft.document.name.replace(/\.(pdf|docx?|png|jpe?g)$/i, ''),
    status: 'waiting_on_others',
    signers: draft.recipients.map((r) => ({ id: r.id, name: r.name, email: r.email, role: r.role })),
    signingOrder: draft.signingOrder,
    subject: draft.subject,
    message: draft.message || undefined,
    fileUri: fileUri ?? draft.document.uri,
    fileType: fileTypeFor(draft.document.name),
    pageCount: draft.document.pageCount,
    templateId: draft.document.templateId,
    agreementBody: template?.body?.trim() ? template.body : undefined,
    expiresAt: Date.now() + draft.expiresInDays * DAY,
    firstEvent: 'sent',
  });
  return { id };
}
