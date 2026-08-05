import { searchCacheDB } from './db';
import {
  MAX_SNAPSHOTS,
  SIDEBAR_MAX_ITEMS,
  SNAPSHOT_TTL_MS,
  type SearchKeyParts,
  type SnapshotDetail,
  type SnapshotInput,
  type SnapshotSummary,
} from './types';

/** Deterministic key covering every condition that affects results. */
export const buildSearchKey = (p: SearchKeyParts): string =>
  [
    p.origin.toUpperCase(),
    p.destination.toUpperCase(),
    p.depart,
    p.tripType === 'RT' ? p.return : '',
    p.tripType,
    `A${p.adult}`,
    `C${p.child}`,
    `I${p.infant}`,
    p.cabin || 'ANY',
  ].join('|');

const newId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

/** Remove expired snapshots and enforce the max-count limit. */
export async function cleanupCache(): Promise<void> {
  try {
    const cutoff = Date.now() - SNAPSHOT_TTL_MS;
    const expired = await searchCacheDB.summaries.where('createdAt').below(cutoff).toArray();
    if (expired.length) await removeSnapshots(expired.map((s) => s.id));

    const remaining = await searchCacheDB.summaries.orderBy('createdAt').toArray();
    if (remaining.length > MAX_SNAPSHOTS) {
      const overflow = remaining.slice(0, remaining.length - MAX_SNAPSHOTS);
      await removeSnapshots(overflow.map((s) => s.id));
    }
  } catch (err) {
    console.warn('[searchCache] cleanup failed', err);
  }
}

async function removeSnapshots(ids: string[]): Promise<void> {
  await searchCacheDB.transaction('rw', searchCacheDB.summaries, searchCacheDB.details, async () => {
    await searchCacheDB.summaries.bulkDelete(ids);
    await searchCacheDB.details.bulkDelete(ids);
  });
}

/** Persist a completed, already-rendered search result. */
export async function saveSnapshot(input: SnapshotInput): Promise<string | null> {
  try {
    const searchKey = buildSearchKey(input.keyParts);
    const now = Date.now();
    const id = newId();

    const summary: SnapshotSummary = {
      id,
      searchKey,
      origin: input.keyParts.origin,
      destination: input.keyParts.destination,
      departDate: input.keyParts.depart,
      returnDate: input.keyParts.return,
      adult: input.keyParts.adult,
      child: input.keyParts.child,
      infant: input.keyParts.infant,
      createdAt: now,
      lastUsed: now,
      cheapestVN: input.cheapestVN,
      cheapestVJ: input.cheapestVJ,
      cheapestSUN: input.cheapestSUN,
      statusVN: input.statusVN,
      statusVJ: input.statusVJ,
      statusSUN: input.statusSUN,
    };

    const detail: SnapshotDetail = {
      id,
      searchKey,
      createdAt: now,
      fullSearchRequest: input.fullSearchRequest,
      vnResult: input.vnResult,
      vjResult: input.vjResult,
      sunResult: input.sunResult,
      extra: input.extra,
    };

    // one snapshot per searchKey: replace older entries for the same key
    const previous = await searchCacheDB.summaries.where('searchKey').equals(searchKey).toArray();
    if (previous.length) await removeSnapshots(previous.map((s) => s.id));

    await searchCacheDB.transaction('rw', searchCacheDB.summaries, searchCacheDB.details, async () => {
      await searchCacheDB.summaries.put(summary);
      await searchCacheDB.details.put(detail);
    });

    await cleanupCache();
    return id;
  } catch (err) {
    console.warn('[searchCache] saveSnapshot failed', err);
    return null;
  }
}

/** Sidebar data: summaries only, newest first. */
export async function listSummaries(limit = SIDEBAR_MAX_ITEMS): Promise<SnapshotSummary[]> {
  try {
    const rows = await searchCacheDB.summaries.orderBy('createdAt').reverse().limit(limit).toArray();
    return rows;
  } catch {
    return [];
  }
}

/** Returns a still-valid summary for the given key, if any. */
export async function findValidSummaryByKey(searchKey: string): Promise<SnapshotSummary | null> {
  try {
    const rows = await searchCacheDB.summaries.where('searchKey').equals(searchKey).toArray();
    const cutoff = Date.now() - SNAPSHOT_TTL_MS;
    const valid = rows.filter((r) => r.createdAt >= cutoff).sort((a, b) => b.createdAt - a.createdAt);
    return valid[0] ?? null;
  } catch {
    return null;
  }
}

/** Heavy read, only on explicit user action. */
export async function loadSnapshotDetail(id: string): Promise<SnapshotDetail | null> {
  try {
    const detail = await searchCacheDB.details.get(id);
    if (detail) await searchCacheDB.summaries.update(id, { lastUsed: Date.now() });
    return detail ?? null;
  } catch {
    return null;
  }
}

export async function deleteSnapshot(id: string): Promise<void> {
  await removeSnapshots([id]);
}

export async function clearCache(): Promise<void> {
  await searchCacheDB.transaction('rw', searchCacheDB.summaries, searchCacheDB.details, async () => {
    await searchCacheDB.summaries.clear();
    await searchCacheDB.details.clear();
  });
}

export const minutesAgo = (ts: number): number => Math.max(0, Math.round((Date.now() - ts) / 60000));

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const digits = value.replace(/[^\d]/g, '');
    if (digits) return Number(digits);
  }
  return null;
};

/** Best-effort cheapest-price extraction from a heterogeneous result list. */
export function extractCheapest(list: unknown, keys: string[]): number | null {
  if (!Array.isArray(list) || list.length === 0) return null;
  let min: number | null = null;
  for (const item of list as Record<string, unknown>[]) {
    const container = (item?.['thông_tin_chung'] as Record<string, unknown> | undefined) ?? item;
    for (const key of keys) {
      const price = toNumber(container?.[key] ?? item?.[key]);
      if (price !== null && price > 0 && (min === null || price < min)) min = price;
    }
  }
  return min;
}
