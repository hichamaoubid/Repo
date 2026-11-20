import type { FajrEvent } from '../../lib/streak';
import { addEvent, parseEvents, serializeEvents } from '../../lib/streak/events';
import type { KeyValueStorage } from '../settings/store';

export const EVENTS_KEY = 'fajr.events.v1';

/** Observable private Fajr log over key-value storage (same pattern as the settings store). */
export function createEventStore(storage: KeyValueStorage) {
  let events: FajrEvent[] = [];
  try {
    events = parseEvents(storage.getItem(EVENTS_KEY));
  } catch {
    // storage unavailable: start empty in memory
  }
  const listeners = new Set<() => void>();
  return {
    get: (): readonly FajrEvent[] => events,
    record(event: FajrEvent) {
      events = addEvent(events, event);
      try {
        storage.setItem(EVENTS_KEY, serializeEvents(events));
      } catch {
        // kept in memory; written on the next successful record
      }
      listeners.forEach((l) => l());
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export type EventStore = ReturnType<typeof createEventStore>;
