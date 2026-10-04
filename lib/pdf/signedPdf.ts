/**
 * Signed-copy PDFs for sharing (WhatsApp, email, files).
 *
 * - PDF originals: the signature is stamped onto the last page with pdf-lib,
 *   then a "Signature certificate" page is appended.
 * - Image originals: rendered into an HTML page with the signature overlaid.
 * - Template-based documents: the agreement text plus a signature block.
 * If the original can't be read on this device, a certificate-only PDF is
 * produced (and says so) rather than failing the share.
 */
import * as FileSystem from 'expo-file-system/legacy';
import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from 'pdf-lib';
import { Platform } from 'react-native';

import { isSignatureDataUrl, trustedFileUri } from '@/lib/fileUri';
import { documentFingerprint, getDocumentRecord, recordFileUri, trustedSignatures } from '@/lib/firestore/documents';
import { requireUser } from '@/lib/session';
import { agreementPdf } from './agreement';
import { BRAND, brandedPage, escapeHtml, htmlToPdf } from './html';

/** Where a signature sits on the page, as fractions of the visible page box (top-left origin). */
export interface SignaturePlacement {
  xRatio: number;
  yRatio: number;
  widthRatio: number;
}

export interface PdfSignature {
  name: string;
  email: string;
  signedAt: number;
  /** PNG data URL from the signing pad. */
  signatureDataUrl: string;
  reference?: string;
  /** When known, the signature is also stamped onto the document itself. */
  placement?: SignaturePlacement;
}

export interface SignedPdfInput {
  title: string;
  fileUri?: string;
  fileType: 'pdf' | 'docx' | 'image';
  agreementBody?: string;
  signatures: PdfSignature[];
  /** Shown on the certificate (e.g. the document id). */
  reference?: string;
  /** SHA-256 of the original, taken by the server when the envelope was sent. */
  fingerprint?: string;
}

/** The signature box on the signing screen is 2:1. */
const SIGNATURE_ASPECT = 2;
const NOT_AVAILABLE = 'Original file not available on this device — this certificate records the signatures.';

export const PDF_UNSUPPORTED_ON_WEB = 'Signed PDFs can be created and shared from the Endorse mobile app.';

const formatDateTime = (ts: number) =>
  new Date(ts).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

function cachePath(name: string) {
  const safe = (name.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '_') || 'document').slice(0, 60);
  return `${FileSystem.cacheDirectory}${safe}`;
}

/** Brings a local or remote file into the cache and returns its base64 contents. */
async function readAsBase64(uri: string): Promise<string> {
  let localUri = uri;
  if (/^https?:\/\//.test(uri)) {
    const { uri: downloaded, status } = await FileSystem.downloadAsync(uri, `${cachePath('source')}_${uri.length}.bin`);
    if (status >= 400) throw new Error(`Download failed (${status})`);
    localUri = downloaded;
  }
  return FileSystem.readAsStringAsync(localUri, { encoding: FileSystem.EncodingType.Base64 });
}

/** Standard PDF fonts only cover Latin-1; replace anything else so drawing never throws. */
function latin1(text: string): string {
  return text
    .replace(/[–—]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/·|•/g, '-')
    .replace(/[^\x00-\xFF]/g, '?');
}

/* ------------------------------------------------------------------ */
/* HTML pieces (image + agreement + certificate-only paths)            */
/* ------------------------------------------------------------------ */

function certificateHtml(input: SignedPdfInput, note?: string): string {
  const rows = input.signatures
    .map(
      (s) => `<tr>
        <td style="width:170px"><img src="${escapeHtml(s.signatureDataUrl)}" style="max-width:160px;max-height:70px" alt="Signature of ${escapeHtml(s.name)}" /></td>
        <td><strong>${escapeHtml(s.name)}</strong><br/><span class="muted">${escapeHtml(s.email)}</span></td>
        <td>${escapeHtml(formatDateTime(s.signedAt))}${s.reference ? `<br/><span class="muted">${escapeHtml(s.reference)}</span>` : ''}</td>
      </tr>`,
    )
    .join('');
  return `<h2>Signature certificate</h2>
    <p class="muted">${escapeHtml(input.title)}${input.reference ? ` · Ref ${escapeHtml(input.reference)}` : ''}</p>
    ${input.fingerprint ? `<p class="muted">Document fingerprint (SHA-256): ${escapeHtml(input.fingerprint)}</p>` : ''}
    ${note ? `<p style="background:${BRAND.muted};padding:10px;border-radius:6px">${escapeHtml(note)}</p>` : ''}
    <table><thead><tr><th>Signature</th><th>Signer</th><th>Signed</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="footer">Electronically signed with Endorse. Generated ${escapeHtml(formatDateTime(Date.now()))}.</div>`;
}

async function certificateOnlyPdf(input: SignedPdfInput, note?: string): Promise<string> {
  const html = await brandedPage(`<h1>${escapeHtml(input.title)}</h1>${certificateHtml(input, note)}`, { title: input.title });
  return htmlToPdf(html, `${input.title} (signed)`);
}

async function imagePdf(input: SignedPdfInput & { fileUri: string }): Promise<string> {
  const src = /^https?:\/\//.test(input.fileUri)
    ? escapeHtml(input.fileUri)
    : `data:image/${input.fileUri.toLowerCase().endsWith('.png') ? 'png' : 'jpeg'};base64,${await readAsBase64(input.fileUri)}`;
  const overlays = input.signatures
    .filter((s) => s.placement)
    .map(({ placement: p, signatureDataUrl }) => {
      const pl = p!;
      return `<img src="${escapeHtml(signatureDataUrl)}" style="position:absolute;left:${pl.xRatio * 100}%;top:${pl.yRatio * 100}%;width:${pl.widthRatio * 100}%" />`;
    })
    .join('');
  const body = `<div style="position:relative;width:100%"><img src="${src}" style="width:100%;display:block" />${overlays}</div>
    <div class="page-break"></div>${certificateHtml(input)}`;
  return htmlToPdf(await brandedPage(body, { title: input.title }), `${input.title} (signed)`);
}

async function templatePdf(input: SignedPdfInput & { agreementBody: string }): Promise<string> {
  const block = input.signatures
    .map(
      (s) => `<div style="display:inline-block;width:46%;margin:14px 2% 0 0;vertical-align:top">
        <img src="${escapeHtml(s.signatureDataUrl)}" style="max-width:180px;max-height:70px;display:block" />
        <div style="border-top:1px solid ${BRAND.ink};padding-top:4px"><strong>${escapeHtml(s.name)}</strong><br/>
        <span class="muted">${escapeHtml(s.email)} · ${escapeHtml(formatDateTime(s.signedAt))}</span></div></div>`,
    )
    .join('');
  return agreementPdf({
    title: input.title,
    body: input.agreementBody,
    appendixHtml: `<h2>Signatures</h2>${block}<div class="page-break"></div>${certificateHtml(input)}`,
  });
}

/* ------------------------------------------------------------------ */
/* pdf-lib path (PDF originals)                                        */
/* ------------------------------------------------------------------ */

function drawImageFit(page: PDFPage, png: Awaited<ReturnType<PDFDocument['embedPng']>>, x: number, y: number, w: number, h: number) {
  const scaled = png.scaleToFit(w, h);
  page.drawImage(png, { x: x + (w - scaled.width) / 2, y: y + (h - scaled.height) / 2, width: scaled.width, height: scaled.height });
}

function drawText(page: PDFPage, text: string, x: number, y: number, size: number, font: PDFFont, color = rgb(0.08, 0.13, 0.24)) {
  page.drawText(latin1(text), { x, y, size, font, color });
}

async function stampedPdf(input: SignedPdfInput & { fileUri: string }): Promise<string> {
  const pdf = await PDFDocument.load(await readAsBase64(input.fileUri), { ignoreEncryption: true });
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pages = pdf.getPages();
  const last = pages[pages.length - 1];
  const images = await Promise.all(input.signatures.map((s) => pdf.embedPng(s.signatureDataUrl)));

  // Stamp placed signatures on the last page (pdf-lib's origin is bottom-left).
  input.signatures.forEach((s, i) => {
    if (!s.placement || !last) return;
    const { width, height } = last.getSize();
    const w = width * s.placement.widthRatio;
    const h = w / SIGNATURE_ASPECT;
    const x = width * s.placement.xRatio;
    const y = height - height * s.placement.yRatio - h;
    drawImageFit(last, images[i], x, Math.max(0, y), w, h);
  });

  // Certificate page.
  const page = pdf.addPage([595, 842]); // A4 portrait in points
  const margin = 50;
  let y = 842 - margin;
  drawText(page, 'Signature certificate', margin, y, 20, bold);
  y -= 22;
  drawText(page, input.title + (input.reference ? `  -  Ref ${input.reference}` : ''), margin, y, 11, font, rgb(0.36, 0.42, 0.52));
  y -= 14;
  if (input.fingerprint) {
    drawText(page, `Document fingerprint (SHA-256): ${input.fingerprint}`, margin, y, 7, font, rgb(0.36, 0.42, 0.52));
    y -= 12;
  }
  page.drawLine({ start: { x: margin, y }, end: { x: 595 - margin, y }, thickness: 2, color: rgb(0.97, 0.82, 0.18) });
  y -= 26;
  input.signatures.forEach((s, i) => {
    if (y < 140) return; // keep within one page; very large envelopes list the first signers
    drawImageFit(page, images[i], margin, y - 60, 160, 60);
    drawText(page, s.name, margin + 180, y - 14, 12, bold);
    drawText(page, s.email, margin + 180, y - 30, 10, font, rgb(0.36, 0.42, 0.52));
    drawText(page, `Signed ${formatDateTime(s.signedAt)}`, margin + 180, y - 46, 10, font, rgb(0.36, 0.42, 0.52));
    if (s.reference) drawText(page, s.reference, margin + 180, y - 60, 9, font, rgb(0.36, 0.42, 0.52));
    y -= 90;
    page.drawLine({ start: { x: margin, y: y + 12 }, end: { x: 595 - margin, y: y + 12 }, thickness: 0.5, color: rgb(0.89, 0.92, 0.95) });
  });
  drawText(page, `Electronically signed with Endorse. Generated ${formatDateTime(Date.now())}.`, margin, 40, 9, font, rgb(0.36, 0.42, 0.52));

  const target = `${cachePath(`${input.title} (signed)`)}.pdf`;
  await FileSystem.writeAsStringAsync(target, await pdf.saveAsBase64(), { encoding: FileSystem.EncodingType.Base64 });
  return target;
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

/** Builds a shareable signed PDF in the cache directory and returns its local uri. */
export async function createSignedPdf(input: SignedPdfInput): Promise<string> {
  if (Platform.OS === 'web') throw new Error(PDF_UNSUPPORTED_ON_WEB);
  // Signatures and file links come from Firestore: drop anything that isn't a plain image / trusted file.
  input = { ...input, fileUri: trustedFileUri(input.fileUri), signatures: input.signatures.filter((s) => isSignatureDataUrl(s.signatureDataUrl)) };
  const { fileUri, fileType, agreementBody } = input;
  try {
    if (fileUri && fileType === 'pdf') return await stampedPdf({ ...input, fileUri });
    if (fileUri && fileType === 'image') return await imagePdf({ ...input, fileUri });
  } catch (error) {
    console.warn('Could not read the original file; sharing the certificate only.', error);
    return certificateOnlyPdf(input, NOT_AVAILABLE);
  }
  if (agreementBody) return templatePdf({ ...input, agreementBody });
  // Word files can't be rendered on-device; the certificate still proves the signatures.
  return certificateOnlyPdf(input, fileUri ? NOT_AVAILABLE : undefined);
}

/** Signed PDF for a stored document (viewer + overflow-menu sharing). */
export async function buildDocumentPdf(documentId: string): Promise<string> {
  if (Platform.OS === 'web') throw new Error(PDF_UNSUPPORTED_ON_WEB);
  const record = await getDocumentRecord(documentId);
  const reference = record.id.toUpperCase();
  const signatures: PdfSignature[] = trustedSignatures(record).map((s) => ({
    name: s.name,
    email: s.email,
    signedAt: s.actedAt ?? record.updatedAt,
    signatureDataUrl: s.signatureDataUrl!,
    reference,
  }));
  return createSignedPdf({
    title: record.title,
    fileUri: recordFileUri(record, requireUser()),
    fileType: record.fileType,
    agreementBody: record.agreementBody,
    signatures,
    reference,
    fingerprint: documentFingerprint(record),
  });
}
