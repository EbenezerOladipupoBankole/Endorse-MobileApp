/**
 * Template gallery + editor data access.
 * Collection `templates/{id}` holds each user's own templates (ownerId);
 * the starter library ships with the app (lib/templates/starters.ts).
 */
import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { makeId } from '@/lib/ids';
import { requireUser } from '@/lib/session';
import type { AgreementTemplate } from '@/types/dashboard';
import type { TemplateDetail, TemplateDraft } from '@/types/workflows';
import { isStarterTemplate, STARTER_TEMPLATES } from './starters';

const COLLECTION = 'templates';

const summary = (t: TemplateDetail): AgreementTemplate => ({
  id: t.id,
  name: t.name,
  category: t.category,
  fieldCount: t.fields.length,
  estimatedMinutes: t.estimatedMinutes,
  usageCount: t.usageCount,
  builtIn: t.builtIn,
});

async function listMine(): Promise<TemplateDetail[]> {
  const me = requireUser();
  const snap = await getDocs(query(collection(db, COLLECTION), where('ownerId', '==', me.uid)));
  return snap.docs
    .map((d) => ({ ...(d.data() as Omit<TemplateDetail, 'id'>), id: d.id }))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

/** The user's own templates first, then the starter library. */
export async function fetchTemplateList(): Promise<AgreementTemplate[]> {
  const mine = await listMine();
  return [...mine, ...STARTER_TEMPLATES].map(summary);
}

export async function fetchTemplateDetail(id: string): Promise<TemplateDetail> {
  const starter = STARTER_TEMPLATES.find((t) => t.id === id);
  if (starter) return structuredClone(starter);
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) throw new Error('Template not found');
  return { ...(snap.data() as Omit<TemplateDetail, 'id'>), id: snap.id };
}

/** A blank template for the editor's "new" route. */
export function emptyTemplateDraft(): TemplateDraft {
  return {
    name: '',
    category: 'Legal',
    description: '',
    estimatedMinutes: 3,
    roles: ['Sender', 'Client'],
    fields: [
      { id: makeId('f'), type: 'name', label: 'Client full name', role: 'Client', required: true },
      { id: makeId('f'), type: 'signature', label: 'Client signature', role: 'Client', required: true },
      { id: makeId('f'), type: 'date', label: 'Date signed', role: 'Client', required: true },
    ],
    body: [
      'This agreement is between us and {{Client full name}}.',
      '## 1. Terms',
      'Describe what each party agrees to do. Use "## " at the start of a line for a heading, and insert fields with the chips below.',
      '## Signatures',
      'Client: {{Client signature}}  Date: {{Date signed}}',
    ].join('\n\n'),
  };
}

/** Creates or updates a template. Saving a starter creates the user's own copy. */
export async function saveTemplate(draft: TemplateDraft): Promise<TemplateDetail> {
  const me = requireUser();
  if (!draft.name.trim()) throw new Error('Template name is required');
  const isNew = !draft.id || isStarterTemplate(draft.id);
  const id = isNew ? doc(collection(db, COLLECTION)).id : draft.id!;
  const existing = isNew ? null : await fetchTemplateDetail(id);
  const saved: TemplateDetail = {
    ...draft,
    id,
    name: draft.name.trim(),
    fieldCount: draft.fields.length,
    usageCount: existing?.usageCount ?? 0,
    builtIn: false,
    updatedAt: Date.now(),
  };
  const { id: _omit, builtIn: _builtIn, ...data } = saved;
  await setDoc(doc(db, COLLECTION, id), { ...data, ownerId: me.uid });
  return saved;
}

export async function duplicateTemplate(id: string): Promise<AgreementTemplate> {
  const source = await fetchTemplateDetail(id);
  const copy = await saveTemplate({ ...source, id: undefined, name: `${source.name} (copy)` });
  return summary(copy);
}

export async function deleteTemplate(id: string): Promise<void> {
  if (isStarterTemplate(id)) throw new Error('Starter templates can’t be deleted.');
  await deleteDoc(doc(db, COLLECTION, id));
}
