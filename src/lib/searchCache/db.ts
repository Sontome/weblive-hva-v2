import Dexie, { type Table } from 'dexie';
import type { SnapshotDetail, SnapshotSummary } from './types';

export class FlightSearchCacheDB extends Dexie {
  declare summaries: Table<SnapshotSummary, string>;
  declare details: Table<SnapshotDetail, string>;

  constructor() {
    super('flight-search-cache');
    this.version(1).stores({
      summaries: 'id, searchKey, createdAt, lastUsed',
      details: 'id, searchKey, createdAt',
    });
    // V4 snapshots cannot be booked using the V5 array contract.
    this.version(2).stores({
      summaries: 'id, searchKey, createdAt, lastUsed',
      details: 'id, searchKey, createdAt',
    }).upgrade(async (transaction) => {
      await transaction.table('summaries').clear();
      await transaction.table('details').clear();
    });
  }
}

export const searchCacheDB = new FlightSearchCacheDB();
