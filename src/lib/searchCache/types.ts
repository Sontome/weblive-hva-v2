/** Types for the Flight Search Snapshot Cache (IndexedDB). Independent of search flow. */

export type AirlineKey = 'VN' | 'VJ' | 'SUN';

export type AirlineStatus = 'pending' | 'success' | 'no_flights' | 'error' | 'domestic_error';

/** Everything that influences a search result. */
export interface SearchKeyParts {
  origin: string;
  destination: string;
  depart: string;
  return: string;
  adult: number;
  child: number;
  infant: number;
  cabin: string;
  tripType: 'OW' | 'RT';
}

/** Lightweight row used by the sidebar. Never contains flight lists. */
export interface SnapshotSummary {
  id: string;
  searchKey: string;
  origin: string;
  destination: string;
  departDate: string;
  returnDate: string;
  adult: number;
  child: number;
  infant: number;
  createdAt: number;
  lastUsed: number;
  cheapestVN: number | null;
  cheapestVJ: number | null;
  cheapestSUN: number | null;
  statusVN: AirlineStatus;
  statusVJ: AirlineStatus;
  statusSUN: AirlineStatus;
  /** reserved for future features (pin / favorite) */
  pinned?: boolean;
}

/** Heavy row, loaded only on demand. */
export interface SnapshotDetail<TRequest = unknown, TVN = unknown, TVJ = unknown, TSUN = unknown> {
  id: string;
  searchKey: string;
  createdAt: number;
  fullSearchRequest: TRequest;
  vnResult: TVN;
  vjResult: TVJ;
  sunResult: TSUN;
  /** extra payload preserved so rendering matches the live UI exactly */
  extra?: Record<string, unknown>;
}

export interface SnapshotInput {
  keyParts: SearchKeyParts;
  fullSearchRequest: unknown;
  vnResult: unknown;
  vjResult: unknown;
  sunResult: unknown;
  extra?: Record<string, unknown>;
  statusVN: AirlineStatus;
  statusVJ: AirlineStatus;
  statusSUN: AirlineStatus;
  cheapestVN: number | null;
  cheapestVJ: number | null;
  cheapestSUN: number | null;
}

export const MAX_SNAPSHOTS = 30;
export const SNAPSHOT_TTL_MS = 120 * 60 * 1000;
export const SIDEBAR_MAX_ITEMS = 20;
