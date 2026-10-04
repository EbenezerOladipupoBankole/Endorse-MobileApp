import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { isStorageFileUrl } from '@/lib/fileUri';
import { storage } from '@/lib/firebase';

/** Content types storage.rules accepts, by extension. */
const CONTENT_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  heic: 'image/heic',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

function contentTypeFor(fileName: string): string {
  return CONTENT_TYPES[fileName.split('.').pop()?.toLowerCase() ?? ''] ?? 'application/pdf';
}

/**
 * Uploads a local file (file:// or content://) to Firebase Storage under the
 * user's folder and returns its download URL. Returns `undefined` if Storage
 * isn't available (e.g. not enabled on the Firebase plan) so callers can fall
 * back to the local URI instead of failing the whole action.
 */
export async function uploadUserFile(uid: string, localUri: string, fileName: string): Promise<string | undefined> {
  if (isStorageFileUrl(localUri, uid)) return localUri;
  try {
    const blob = await (await fetch(localUri)).blob();
    const safeName = fileName.replace(/[^\w.\-]+/g, '_');
    const fileRef = ref(storage, `documents/${uid}/${Date.now()}_${safeName}`);
    await uploadBytes(fileRef, blob, { contentType: contentTypeFor(safeName) });
    return await getDownloadURL(fileRef);
  } catch (error) {
    console.warn('File upload failed; keeping the local copy only.', error);
    return undefined;
  }
}
