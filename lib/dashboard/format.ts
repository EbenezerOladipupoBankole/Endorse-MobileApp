import type { ColorTokens, StatusColor } from '@/theme';
import type { DocumentStatus, StatusFilter } from '@/types/dashboard';

type StatusTone = keyof ColorTokens['status'];

export const DOCUMENT_STATUS_META: Record<DocumentStatus, { label: string; tone: StatusTone }> = {
  awaiting_me: { label: 'Sign now', tone: 'awaiting' },
  waiting_on_others: { label: 'Waiting', tone: 'waiting' },
  completed: { label: 'Completed', tone: 'success' },
  draft: { label: 'Draft', tone: 'draft' },
  declined: { label: 'Declined', tone: 'declined' },
  expired: { label: 'Expired', tone: 'expiring' },
  voided: { label: 'Voided', tone: 'draft' },
};

export const STATUS_FILTER_META: Record<StatusFilter, { label: string; shortLabel: string; tone: StatusTone }> = {
  awaiting_me: { label: 'Awaiting my signature', shortLabel: 'Awaiting me', tone: 'awaiting' },
  waiting_on_others: { label: 'Waiting on others', shortLabel: 'Waiting on others', tone: 'waiting' },
  completed: { label: 'Completed', shortLabel: 'Completed', tone: 'success' },
  draft: { label: 'Drafts', shortLabel: 'Drafts', tone: 'draft' },
  expiring_soon: { label: 'Expiring soon', shortLabel: 'Expiring soon', tone: 'expiring' },
};

export function statusColor(colors: ColorTokens, tone: StatusTone): StatusColor {
  return colors.status[tone];
}

export function matchesFilter(
  doc: { status: DocumentStatus; isExpiringSoon: boolean },
  filter: StatusFilter,
): boolean {
  return filter === 'expiring_soon' ? doc.isExpiringSoon : doc.status === filter;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Just now", "5m ago", "3h ago", "Yesterday", "Oct 2". `now` is passed in to keep rendering pure. */
export function formatRelative(timestamp: number, now: number): string {
  const diff = now - timestamp;
  if (diff < MINUTE) return 'Just now';
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  if (diff < 2 * DAY) return 'Yesterday';
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)}d ago`;
  const d = new Date(timestamp);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/** "Due today", "Due in 3 days", "Overdue". */
export function formatDue(expiresAt: number, now: number): string {
  const days = Math.ceil((expiresAt - now) / DAY);
  if (days < 0) return 'Overdue';
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due in ${days} days`;
}

export function greetingFor(timestamp: number): string {
  const hour = new Date(timestamp).getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function formatCurrency(amount: number, currency: string, compact = false): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      notation: compact ? 'compact' : 'standard',
      maximumFractionDigits: compact ? 1 : 0,
    }).format(amount);
  } catch {
    return `${currency} ${Math.round(amount).toLocaleString()}`;
  }
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

/** "Amara Okafor", "Amara Okafor +2". */
export function formatPeople(people: { name: string }[]): string {
  if (people.length === 0) return 'No recipients';
  const [first, ...rest] = people;
  return rest.length ? `${first.name} +${rest.length}` : first.name;
}
