import { useSyncExternalStore } from 'react';
import { storage } from '../settings/storage';
import { createEventStore } from './eventStore';

export const fajrLog = createEventStore(storage);

export function useFajrLog() {
  return useSyncExternalStore(fajrLog.subscribe, fajrLog.get, fajrLog.get);
}
