import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/context/AuthContext';
import { dashboardFetchers } from '@/lib/dashboard/api';
import type { DashboardData, DashboardSection, Resource } from '@/types/dashboard';

export type DashboardResources = { [K in DashboardSection]: Resource<DashboardData[K]> };

const SECTIONS = Object.keys(dashboardFetchers) as DashboardSection[];

const INITIAL: DashboardResources = {
  user: { status: 'loading' },
  stats: { status: 'loading' },
  actionRequired: { status: 'loading' },
  documents: { status: 'loading' },
  templates: { status: 'loading' },
  invoices: { status: 'loading' },
  activity: { status: 'loading' },
};

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong';
}

/**
 * Loads every dashboard section independently so one slow or failing
 * endpoint never blocks the rest of the screen.
 */
export function useDashboard() {
  const { user } = useAuth();
  const uid = user?.uid;
  const [resources, setResources] = useState<DashboardResources>(INITIAL);
  const [refreshing, setRefreshing] = useState(false);

  // Reload everything when the signed-in account changes.
  const load = useCallback(
    async <K extends DashboardSection>(section: K) => {
      if (!uid) return;
      try {
        const data = await dashboardFetchers[section]();
        const next: Resource<DashboardData[K]> = { status: 'success', data, fetchedAt: Date.now() };
        setResources((prev) => ({ ...prev, [section]: next }));
      } catch (error) {
        setResources((prev) => ({
          ...prev,
          [section]: { ...prev[section], status: 'error', error: errorMessage(error) },
        }));
      }
    },
    [uid],
  );

  const loadAll = useCallback(() => Promise.all(SECTIONS.map((section) => load(section))), [load]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  /** Pull-to-refresh: keeps current data visible while revalidating. */
  const refresh = useCallback(async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }, [loadAll]);

  /** Retry a single failed section, showing its skeleton again. */
  const retry = useCallback(
    (section: DashboardSection) => {
      setResources((prev) => ({ ...prev, [section]: { status: 'loading' } }));
      load(section);
    },
    [load],
  );

  /** Silent background reload (no spinner), e.g. when the screen regains focus. */
  const revalidate = loadAll;

  return useMemo(
    () => ({ resources, refreshing, refresh, retry, revalidate }),
    [resources, refreshing, refresh, retry, revalidate],
  );
}
