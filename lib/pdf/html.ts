/**
 * Shared HTML → PDF helpers for generated documents (signed copies,
 * agreements from templates, invoices and receipts).
 */
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import { Platform } from 'react-native';

export const BRAND = {
  blue: '#0E68B4',
  yellow: '#F8D12D',
  ink: '#14213D',
  inkSoft: '#5C6B84',
  border: '#E3EAF3',
  muted: '#F5F8FC',
};

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

let logoDataUri: Promise<string | null> | null = null;

/** The Endorse logo as a data URI so it renders inside generated PDFs (cached). */
export function getLogoDataUri(): Promise<string | null> {
  logoDataUri ??= (async () => {
    try {
      const asset = Asset.fromModule(require('../../assets/images/logo_main.jpg'));
      await asset.downloadAsync();
      if (!asset.localUri || Platform.OS === 'web') return asset.uri ?? null;
      const base64 = await FileSystem.readAsStringAsync(asset.localUri, { encoding: FileSystem.EncodingType.Base64 });
      return `data:image/jpeg;base64,${base64}`;
    } catch {
      return null;
    }
  })();
  return logoDataUri;
}

/** Wraps body HTML in a branded A4 page with shared typography. */
export async function brandedPage(bodyHtml: string, { title }: { title: string }): Promise<string> {
  const logo = await getLogoDataUri();
  return `<!doctype html>
<html><head><meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>
  @page { size: A4; margin: 22mm 18mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: ${BRAND.ink}; font-size: 12px; line-height: 1.55; margin: 0; }
  .brand { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid ${BRAND.yellow}; padding-bottom: 10px; margin-bottom: 22px; }
  .brand img { height: 46px; }
  .brand .tag { color: ${BRAND.inkSoft}; font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; }
  h1 { font-size: 22px; margin: 0 0 6px; color: ${BRAND.ink}; }
  h2 { font-size: 14px; margin: 22px 0 8px; color: ${BRAND.blue}; }
  p { margin: 0 0 10px; }
  .muted { color: ${BRAND.inkSoft}; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: .8px; color: ${BRAND.inkSoft}; border-bottom: 1px solid ${BRAND.border}; padding: 8px 6px; }
  td { border-bottom: 1px solid ${BRAND.border}; padding: 9px 6px; vertical-align: top; }
  .right { text-align: right; }
  .footer { margin-top: 28px; padding-top: 10px; border-top: 1px solid ${BRAND.border}; color: ${BRAND.inkSoft}; font-size: 10px; }
  .page-break { page-break-before: always; }
</style></head>
<body>
  <div class="brand">${logo ? `<img src="${logo}" alt="Endorse" />` : `<strong style="color:${BRAND.blue};font-size:20px">Endorse</strong>`}<span class="tag">Verifiable trust platform</span></div>
  ${bodyHtml}
</body></html>`;
}

function safeFileName(name: string): string {
  return (name.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '_') || 'document').slice(0, 60);
}

/** Renders HTML to a PDF in the cache directory with a readable file name. */
export async function htmlToPdf(html: string, fileName: string): Promise<string> {
  const { uri } = await Print.printToFileAsync({ html });
  if (Platform.OS === 'web' || !FileSystem.cacheDirectory) return uri;
  const target = `${FileSystem.cacheDirectory}${safeFileName(fileName)}.pdf`;
  await FileSystem.deleteAsync(target, { idempotent: true });
  await FileSystem.moveAsync({ from: uri, to: target });
  return target;
}
