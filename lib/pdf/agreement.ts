/**
 * Agreement text format shared by templates and the documents sent from them.
 *
 * Plain text, one paragraph per blank-line-separated block:
 *   - a line starting with "## " is a section heading
 *   - {{Field label}} is a placeholder, rendered as a labelled blank line
 *     (or the value, when `values[label]` is provided)
 */
import { brandedPage, escapeHtml, htmlToPdf } from './html';

const PLACEHOLDER = /\{\{\s*([^}]+?)\s*\}\}/g;

/** Field labels referenced in an agreement body, in order of appearance. */
export function placeholdersIn(body: string): string[] {
  return [...new Set([...body.matchAll(PLACEHOLDER)].map((m) => m[1]))];
}

function renderInline(text: string, values: Record<string, string>): string {
  let out = '';
  let last = 0;
  for (const match of text.matchAll(PLACEHOLDER)) {
    out += escapeHtml(text.slice(last, match.index));
    const label = match[1];
    const value = values[label];
    out += value
      ? `<strong>${escapeHtml(value)}</strong>`
      : `<span style="display:inline-block;min-width:150px;border-bottom:1px solid #8794A8;color:#8794A8;font-size:9px;vertical-align:bottom">${escapeHtml(label)}</span>`;
    last = (match.index ?? 0) + match[0].length;
  }
  return out + escapeHtml(text.slice(last));
}

/** Agreement body → HTML fragment (no page shell). */
export function agreementBodyHtml(body: string, values: Record<string, string> = {}): string {
  return body
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) =>
      block.startsWith('## ')
        ? `<h2>${renderInline(block.slice(3), values)}</h2>`
        : `<p>${renderInline(block, values).replace(/\n/g, '<br/>')}</p>`,
    )
    .join('\n');
}

/** Body → plain readable text (placeholders as "[Label]") for in-app reading. */
export function agreementPlainText(body: string, values: Record<string, string> = {}): string {
  return body.replace(PLACEHOLDER, (_, label: string) => values[label] || `[${label}]`).replace(/^## /gm, '');
}

export interface AgreementPdfOptions {
  title: string;
  body: string;
  values?: Record<string, string>;
  /** Extra HTML appended after the agreement (e.g. a signature certificate). */
  appendixHtml?: string;
}

export async function agreementPdf({ title, body, values, appendixHtml = '' }: AgreementPdfOptions): Promise<string> {
  const html = await brandedPage(`<h1>${escapeHtml(title)}</h1>${agreementBodyHtml(body, values)}${appendixHtml}`, { title });
  return htmlToPdf(html, title);
}
