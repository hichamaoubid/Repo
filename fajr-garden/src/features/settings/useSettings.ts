import { useSyncExternalStore } from 'react';
import type { AppSettings } from '../../lib/settings';
import { storage } from './storage';
import { createSettingsStore } from './store';

export const settingsStore = createSettingsStore(storage);

export function useSettings(): AppSettings {
  return useSyncExternalStore(settingsStore.subscribe, settingsStore.get, settingsStore.get);
}
