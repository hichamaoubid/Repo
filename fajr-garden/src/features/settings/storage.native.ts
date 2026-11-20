import Storage from 'expo-sqlite/kv-store';
import type { KeyValueStorage } from './store';

/** iOS / Android: SQLite-backed key-value store, synchronous API. */
export const storage: KeyValueStorage = {
  getItem: (key) => Storage.getItemSync(key),
  setItem: (key, value) => Storage.setItemSync(key, value),
};
