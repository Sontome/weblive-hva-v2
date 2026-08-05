import { useCallback, useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { searchCacheDB } from './db';
import { cleanupCache, loadSnapshotDetail } from './cache';
import { SIDEBAR_MAX_ITEMS, type SnapshotDetail, type SnapshotSummary } from './types';

/** Run cleanup once when the app mounts. */
export function useCacheCleanupOnMount(): void {
  useEffect(() => {
    void cleanupCache();
  }, []);
}

/** Live sidebar list (summaries only). */
export function useSnapshotSummaries(enabled: boolean): SnapshotSummary[] {
  const rows = useLiveQuery(
    async (): Promise<SnapshotSummary[]> => {
      if (!enabled) return [];
      await cleanupCache();
      return searchCacheDB.summaries.orderBy('createdAt').reverse().limit(SIDEBAR_MAX_ITEMS).toArray();
    },
    [enabled],
  );
  return rows ?? [];
}

/** Loads one snapshot detail on demand. */
export function useSnapshotLoader() {
  const [detail, setDetail] = useState<SnapshotDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async (id: string): Promise<SnapshotDetail | null> => {
    setIsLoading(true);
    try {
      const result = await loadSnapshotDetail(id);
      setDetail(result);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clear = useCallback(() => setDetail(null), []);

  return { detail, isLoading, load, clear };
}
