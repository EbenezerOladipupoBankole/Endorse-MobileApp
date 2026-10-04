/**
 * The user's contacts: everyone they've exchanged documents with, plus
 * saved invoice clients. Derived, so there's nothing extra to keep in sync.
 */
import { collection, getDocs, query, where } from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { listDocumentRecords } from '@/lib/firestore/documents';
import { requireUser } from '@/lib/session';
import type { Contact } from '@/types/dashboard';

export const CLIENTS_COLLECTION = 'clients';

export async function fetchSavedClients(): Promise<Contact[]> {
  const me = requireUser();
  const snap = await getDocs(query(collection(db, CLIENTS_COLLECTION), where('ownerId', '==', me.uid)));
  return snap.docs.map((d) => {
    const data = d.data();
    return { id: d.id, name: String(data.name ?? ''), email: String(data.email ?? ''), company: data.company };
  });
}

export async function fetchContacts(): Promise<Contact[]> {
  const me = requireUser();
  const [records, clients] = await Promise.all([listDocumentRecords(), fetchSavedClients().catch(() => [])]);
  const byEmail = new Map<string, Contact>();
  const add = (c: Contact) => {
    const email = c.email.trim().toLowerCase();
    if (!email || email === me.email || byEmail.has(email)) return;
    byEmail.set(email, { ...c, email });
  };
  clients.forEach(add);
  for (const record of records) {
    add(record.sender);
    record.signers.forEach((s) => add({ id: s.id, name: s.name, email: s.email }));
  }
  return [...byEmail.values()].sort((a, b) => a.name.localeCompare(b.name));
}
