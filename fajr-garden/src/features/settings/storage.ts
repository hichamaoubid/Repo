import type { KeyValueStorage } from './store';

/** Web (and type-checking default): localStorage, which may be unavailable or blocked. */
export const storage: KeyValueStorage = {
  getItem: (key) => (typeof localStorage === 'undefined' ? null : localStorage.getItem(key)),
  setItem: (key, value) => {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
  },
};
