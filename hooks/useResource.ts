import { useCallback, useEffect, useState } from 'react';

import type { Resource } from '@/types/dashboard';

/**
 * Loads a single async resource for a detail screen.
 * `fetcher` must be stable (wrap it in useCallback) — it re-runs when it changes.
 */
export function useResource<T>(fetcher: () => Promise<T>) {
  const [resource, setResource] = useState<Resource<T>>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetcher()
      .then((data) => !cancelled && setResource({ status: 'success', data, fetchedAt: Date.now() }))
      .catch((error: unknown) => {
        if (cancelled) return;
        setResource((prev) => ({
          ...prev,
          status: 'error',
          error: error instanceof Error ? error.message : 'Something went wrong',
        }));
      });
    return () => {
      cancelled = true;
    };
  }, [fetcher, attempt]);

  const reload = useCallback(() => {
    setResource({ status: 'loading' });
    setAttempt((n) => n + 1);
  }, []);

  return { resource, reload };
}
