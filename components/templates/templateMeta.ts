import type { LucideIcon } from 'lucide-react-native';
import { Calendar, CaseSensitive, Signature, SquareCheck, Type, UserRound } from 'lucide-react-native';

import type { ColorTokens } from '@/theme';
import type { TemplateCategory } from '@/types/dashboard';
import type { FieldType } from '@/types/workflows';

export const CATEGORY_TONE: Record<TemplateCategory, keyof ColorTokens['status']> = {
  Legal: 'awaiting',
  Services: 'success',
  HR: 'waiting',
  'Real estate': 'expiring',
  Sales: 'declined',
};

export const FIELD_META: Record<FieldType, { icon: LucideIcon; label: string; description: string }> = {
  signature: { icon: Signature, label: 'Signature', description: 'Full legal signature' },
  initials: { icon: CaseSensitive, label: 'Initials', description: 'Initials on each page or clause' },
  name: { icon: UserRound, label: 'Full name', description: 'Signer’s printed name' },
  date: { icon: Calendar, label: 'Date signed', description: 'Filled automatically on signing' },
  text: { icon: Type, label: 'Text', description: 'Free text such as company or title' },
  checkbox: { icon: SquareCheck, label: 'Checkbox', description: 'Agree / acknowledge option' },
};

export const FIELD_TYPES = Object.keys(FIELD_META) as FieldType[];
