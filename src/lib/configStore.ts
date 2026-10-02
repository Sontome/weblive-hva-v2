import { useEffect, useSyncExternalStore } from 'react';
import { supabase } from '@/integrations/supabase/client';

/** Shared data layer for ticket_campaigns, ticket_rules, route_discounts, price_configs.
 *  localStorage cache with per-table TTL, in-flight dedupe, no realtime/polling. */
export const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

type TableName = 'ticket_campaigns' | 'ticket_rules' | 'route_discounts' | 'price_configs';

interface Entry<T> {
  data: T[] | null;
  error: unknown;
  loading: boolean;
  promise: Promise<T[]> | null;
  listeners: Set<() => void>;
  snapshot: { data: T[] | null; error: unknown; loading: boolean };
}

const QUERIES: Record<TableName, () => PromiseLike<{ data: any; error: any }>> = {
  ticket_campaigns: () =>
    (supabase as any).from('ticket_campaigns').select('*').order('created_at', { ascending: false }),
  ticket_rules: () =>
    (supabase as any).from('ticket_rules').select('*').order('priority', { ascending: false }),
  route_discounts: () =>
    (supabase as any)
      .from('route_discounts')
      .select('*')
      .order('airline_code', { ascending: true })
      .order('origin_code', { ascending: true }),
  price_configs: () =>
    (supabase as any).from('price_configs').select('*').order('customer_mode', { ascending: true }),
};

const entries = new Map<TableName, Entry<any>>();

const keyData = (t: TableName) => `${t}_cache`;
const keyTime = (t: TableName) => `${t}_cache_time`;

function readCache<T>(t: TableName): { data: T[]; time: number } | null {
  try {
    const raw = localStorage.getItem(keyData(t));
    const time = Number(localStorage.getItem(keyTime(t)));
    if (!raw || !time) return null;
    return { data: JSON.parse(raw) as T[], time };
  } catch {
    return null;
  }
}

function writeCache<T>(t: TableName, data: T[]) {
  try {
    localStorage.setItem(keyData(t), JSON.stringify(data));
    localStorage.setItem(keyTime(t), String(Date.now()));
  } catch (e) {
    console.warn(`[configStore] cannot write cache ${t}`, e);
  }
}

function getEntry<T>(t: TableName): Entry<T> {
  let e = entries.get(t);
  if (!e) {
    const cached = readCache<T>(t);
    e = {
      data: cached?.data ?? null,
      error: null,
      loading: false,
      promise: null,
      listeners: new Set(),
      snapshot: { data: cached?.data ?? null, error: null, loading: false },
    };
    entries.set(t, e);
  }
  return e as Entry<T>;
}

function emit(e: Entry<any>) {
  e.snapshot = { data: e.data, error: e.error, loading: e.loading };
  e.listeners.forEach((l) => l());
}

/** Load a table: uses fresh cache, dedupes concurrent calls, keeps stale cache on failure. */
export function loadTable<T>(t: TableName, force = false): Promise<T[]> {
  const e = getEntry<T>(t);
  if (e.promise) return e.promise;
  const cached = readCache<T>(t);
  if (!force && cached && Date.now() - cached.time < CACHE_TTL) {
    if (e.data !== cached.data && e.data === null) {
      e.data = cached.data;
      emit(e);
    }
    return Promise.resolve(e.data ?? cached.data);
  }

  e.loading = true;
  emit(e);
  e.promise = (async () => {
    try {
      const { data, error } = await QUERIES[t]();
      if (error) throw error;
      const rows = (data ?? []) as T[];
      writeCache(t, rows);
      e.data = rows;
      e.error = null;
      return rows;
    } catch (err) {
      console.error(`[configStore] fetch ${t} failed`, err);
      e.error = err;
      if (e.data) return e.data; // keep stale cache
      throw err;
    } finally {
      e.loading = false;
      e.promise = null;
      emit(e);
    }
  })();
  return e.promise;
}

/** Force refresh (manual action, e.g. after admin edits). */
export const refreshTable = <T,>(t: TableName) => loadTable<T>(t, true);

/** Preload all config tables in parallel at app start. */
export function preloadConfigTables() {
  return Promise.allSettled([
    loadTable('ticket_campaigns'),
    loadTable('ticket_rules'),
    loadTable('route_discounts'),
    loadTable('price_configs'),
  ]);
}

/** React hook subscribing to a shared table store. */
export function useConfigTable<T>(t: TableName) {
  const e = getEntry<T>(t);
  const snap = useSyncExternalStore(
    (cb) => {
      e.listeners.add(cb);
      return () => e.listeners.delete(cb);
    },
    () => e.snapshot,
  );
  useEffect(() => {
    loadTable<T>(t).catch(() => {});
  }, [t]);
  return {
    data: snap.data as T[] | null,
    error: snap.error,
    isLoading: snap.data === null && (snap.loading || !snap.error),
    refetch: () => refreshTable<T>(t),
  };
}
