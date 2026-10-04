/**
 * Currencies offered on invoices and receipts — African currencies first,
 * then common international ones. Symbols come from this list rather than
 * Intl, because many devices don't know symbols such as ₦, ₵ or CFA.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  /** Minor-unit digits; 0 for currencies without cents in everyday use. */
  decimals: number;
}

export const DEFAULT_CURRENCY = 'NGN';

export const CURRENCIES: Currency[] = [
  { code: 'NGN', name: 'Nigerian naira', symbol: '₦', flag: '🇳🇬', decimals: 2 },
  { code: 'GHS', name: 'Ghanaian cedi', symbol: 'GH₵', flag: '🇬🇭', decimals: 2 },
  { code: 'KES', name: 'Kenyan shilling', symbol: 'KSh', flag: '🇰🇪', decimals: 2 },
  { code: 'ZAR', name: 'South African rand', symbol: 'R', flag: '🇿🇦', decimals: 2 },
  { code: 'EGP', name: 'Egyptian pound', symbol: 'E£', flag: '🇪🇬', decimals: 2 },
  { code: 'MAD', name: 'Moroccan dirham', symbol: 'DH', flag: '🇲🇦', decimals: 2 },
  { code: 'XOF', name: 'West African CFA franc', symbol: 'CFA', flag: '🌍', decimals: 0 },
  { code: 'XAF', name: 'Central African CFA franc', symbol: 'FCFA', flag: '🌍', decimals: 0 },
  { code: 'UGX', name: 'Ugandan shilling', symbol: 'USh', flag: '🇺🇬', decimals: 0 },
  { code: 'TZS', name: 'Tanzanian shilling', symbol: 'TSh', flag: '🇹🇿', decimals: 2 },
  { code: 'RWF', name: 'Rwandan franc', symbol: 'FRw', flag: '🇷🇼', decimals: 0 },
  { code: 'ETB', name: 'Ethiopian birr', symbol: 'Br', flag: '🇪🇹', decimals: 2 },
  { code: 'ZMW', name: 'Zambian kwacha', symbol: 'ZK', flag: '🇿🇲', decimals: 2 },
  { code: 'BWP', name: 'Botswana pula', symbol: 'P', flag: '🇧🇼', decimals: 2 },
  { code: 'MUR', name: 'Mauritian rupee', symbol: 'Rs', flag: '🇲🇺', decimals: 2 },
  { code: 'NAD', name: 'Namibian dollar', symbol: 'N$', flag: '🇳🇦', decimals: 2 },
  { code: 'DZD', name: 'Algerian dinar', symbol: 'DA', flag: '🇩🇿', decimals: 2 },
  { code: 'TND', name: 'Tunisian dinar', symbol: 'DT', flag: '🇹🇳', decimals: 3 },
  { code: 'AOA', name: 'Angolan kwanza', symbol: 'Kz', flag: '🇦🇴', decimals: 2 },
  { code: 'MWK', name: 'Malawian kwacha', symbol: 'MK', flag: '🇲🇼', decimals: 2 },
  { code: 'GMD', name: 'Gambian dalasi', symbol: 'D', flag: '🇬🇲', decimals: 2 },
  { code: 'LRD', name: 'Liberian dollar', symbol: 'L$', flag: '🇱🇷', decimals: 2 },
  { code: 'CDF', name: 'Congolese franc', symbol: 'FC', flag: '🇨🇩', decimals: 2 },
  { code: 'MZN', name: 'Mozambican metical', symbol: 'MT', flag: '🇲🇿', decimals: 2 },
  { code: 'SLE', name: 'Sierra Leonean leone', symbol: 'Le', flag: '🇸🇱', decimals: 2 },
  { code: 'USD', name: 'US dollar', symbol: '$', flag: '🇺🇸', decimals: 2 },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', decimals: 2 },
  { code: 'GBP', name: 'British pound', symbol: '£', flag: '🇬🇧', decimals: 2 },
  { code: 'CAD', name: 'Canadian dollar', symbol: 'CA$', flag: '🇨🇦', decimals: 2 },
  { code: 'AED', name: 'UAE dirham', symbol: 'AED', flag: '🇦🇪', decimals: 2 },
  { code: 'CNY', name: 'Chinese yuan', symbol: '¥', flag: '🇨🇳', decimals: 2 },
  { code: 'INR', name: 'Indian rupee', symbol: '₹', flag: '🇮🇳', decimals: 2 },
];

const BY_CODE = new Map(CURRENCIES.map((c) => [c.code, c]));

/** Unknown codes fall back to the code itself as the symbol. */
export function getCurrency(code: string): Currency {
  return BY_CODE.get(code) ?? { code, name: code, symbol: code, flag: '🏳️', decimals: 2 };
}

function groupDigits(amount: number, decimals: number, compact: boolean): string {
  try {
    return new Intl.NumberFormat('en-US', {
      notation: compact ? 'compact' : 'standard',
      minimumFractionDigits: compact ? 0 : decimals,
      maximumFractionDigits: compact ? 1 : decimals,
    }).format(amount);
  } catch {
    const fixed = amount.toFixed(compact ? 0 : decimals);
    const [whole, frac] = fixed.split('.');
    return whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (frac ? `.${frac}` : '');
  }
}

/**
 * "₦12,500.00", "KSh 3,200.00", "CFA 15,000", "$1.2K" (compact).
 * Single-character symbols attach directly; letter symbols get a space.
 */
export function formatMoney(amount: number, code: string, compact = false): string {
  const currency = getCurrency(code);
  const negative = amount < 0;
  const digits = groupDigits(Math.abs(amount), currency.decimals, compact);
  const joiner = /[A-Za-z]$/.test(currency.symbol) ? ' ' : '';
  return `${negative ? '−' : ''}${currency.symbol}${joiner}${digits}`;
}

const LAST_CURRENCY_KEY = 'endorse.invoices.lastCurrency';

/** The currency the user picked last time, or NGN. Never throws. */
export async function loadLastCurrency(): Promise<string> {
  try {
    const code = await AsyncStorage.getItem(LAST_CURRENCY_KEY);
    return code && BY_CODE.has(code) ? code : DEFAULT_CURRENCY;
  } catch {
    return DEFAULT_CURRENCY;
  }
}

export async function rememberCurrency(code: string): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_CURRENCY_KEY, code);
  } catch {
    // Remembering is a convenience only.
  }
}
