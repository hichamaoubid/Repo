/**
 * Settings store: a tiny observable over a key-value storage. Every write is validated
 * by round-tripping through the same parser used on read, so invalid state can never be
 * persisted. No React or native imports, so it is unit-tested in Node.
 */
import { parseSettings, serializeSettings, type AppSettings } from '../../lib/settings';

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const SETTINGS_KEY = 'settings.v1';

export interface SettingsStore {
  get(): AppSettings;
  update(fn: (current: AppSettings) => AppSettings): void;
  subscribe(listener: () => void): () => void;
}

/** JSON with object keys sorted, so key order never matters when comparing. */
function canonical(value: unknown): string {
  return JSON.stringify(value, (_key, v: unknown) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)))
      : v,
  );
}

export function createSettingsStore(storage: KeyValueStorage): SettingsStore {
  let stored: string | null = null;
  try {
    stored = storage.getItem(SETTINGS_KEY);
  } catch {
    // Storage unavailable: run on defaults in memory.
  }
  let current = parseSettings(stored);
  const listeners = new Set<() => void>();

  return {
    get: () => current,
    update(fn) {
      const next = fn(current);
      const serialized = serializeSettings(next);
      const reparsed = parseSettings(serialized);
      // Anything the parser drops or replaces with a default means the update was invalid.
      if (canonical(reparsed) !== canonical(JSON.parse(serialized))) {
        throw new Error('invalid settings update rejected');
      }
      current = reparsed;
      try {
        storage.setItem(SETTINGS_KEY, serialized);
      } catch {
        // Keep the in-memory value; it will be written on the next successful update.
      }
      listeners.forEach((l) => l());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
