/** Parses user-typed amounts ("1,250.5", "12.") safely; invalid input becomes 0. */
export function parseAmount(text: string): number {
  const value = Number.parseFloat(text.replace(/[^0-9.]/g, ''));
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

/** Keeps only digits and the first decimal point, so the field never shows junk. */
export function sanitizeAmountInput(text: string): string {
  const cleaned = text.replace(/[^0-9.]/g, '');
  const [whole, ...rest] = cleaned.split('.');
  return rest.length ? `${whole}.${rest.join('').slice(0, 2)}` : whole;
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export const DAY_MS = 86_400_000;

export const PAYMENT_TERMS = [
  { label: 'On receipt', days: 0 },
  { label: 'Net 7', days: 7 },
  { label: 'Net 14', days: 14 },
  { label: 'Net 30', days: 30 },
] as const;
