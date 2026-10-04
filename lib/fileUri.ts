/**
 * Which file links the app is willing to load, open or download.
 *
 * `fileUri` on a document is written by its sender, so it is untrusted input:
 * only our own Storage bucket's `documents/` folder (and files already on this
 * device) are accepted. firestore.rules enforces the same shape on write.
 */

const BUCKET = process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '';
const STORAGE_PREFIX = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/documents%2F`;

/** A download URL for a file under `documents/{ownerId}/` in our bucket. */
export function isStorageFileUrl(uri: string, ownerId?: string): boolean {
  if (!BUCKET || !uri.startsWith(STORAGE_PREFIX)) return false;
  return ownerId ? uri.startsWith(`${STORAGE_PREFIX}${encodeURIComponent(ownerId)}%2F`) : true;
}

/** A file on this device (picker, camera or generated output). */
export function isLocalFileUri(uri: string): boolean {
  return /^(file|content):\/\//i.test(uri);
}

/** `uri` if it's safe to load for a document owned by `ownerId`, otherwise undefined. */
export function trustedFileUri(uri: string | undefined, ownerId?: string): string | undefined {
  if (!uri) return undefined;
  return isStorageFileUrl(uri, ownerId) || isLocalFileUri(uri) ? uri : undefined;
}

const SIGNATURE_DATA_URL = /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/]+=*$/;

/** Signature images must be plain base64 PNG/JPEG data URLs (they are interpolated into HTML). */
export function isSignatureDataUrl(value: unknown): value is string {
  return typeof value === 'string' && SIGNATURE_DATA_URL.test(value);
}
