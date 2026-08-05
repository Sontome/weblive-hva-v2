import Dexie, { type Table } from 'dexie';
import type { SnapshotDetail, SnapshotSummary } from './types';

export class FlightSearchCacheDB extends Dexie {
  summaries!: Table<SnapshotSummary, string>;
  details!: Table<SnapshotDetail, string>;

  constructor() {
    super('flight-search-cache');
    this.version(1).stores({
      summaries: 'id, searchKey, createdAt, lastUsed',
      details: 'id, searchKey, createdAt',
    });
  }
}

export const searchCacheDB = new FlightSearchCacheDB();
