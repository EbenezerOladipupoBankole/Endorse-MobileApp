import { useEffect, useState } from 'react';

import { useAuth } from '@/context/AuthContext';
import { searchDashboard } from '@/lib/dashboard/api';
import type { SearchResults } from '@/types/dashboard';

export type SearchStatus = 'idle' | 'loading' | 'success' | 'error';

interface Settled {
  key: string;
  data?: SearchResults;
  error?: string;
}

const DEBOUNCE_MS = 250;

/** Debounced search over documents, templates and contacts. */
export function useDashboardSearch(rawQuery: string) {
  const { user } = useAuth();
  const uid = user?.uid;
  const term = rawQuery.trim();
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState<Settled>({ key: '' });
  const key = `${attempt}:${term}`;

  useEffect(() => {
    if (!term) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      searchDashboard(term)
        .then((data) => !cancelled && setSettled({ key, data }))
        .catch((e: unknown) => !cancelled && setSettled({ key, error: e instanceof Error ? e.message : 'Search failed' }));
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [term, key, uid]);

  let status: SearchStatus = 'idle';
  if (term) status = settled.key !== key ? 'loading' : settled.error ? 'error' : 'success';

  return {
    term,
    status,
    results: status === 'success' ? settled.data : undefined,
    retry: () => setAttempt((n) => n + 1),
  };
}
