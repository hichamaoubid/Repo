import type { KeyValueStorage } from '../../settings/store';
import { createEventStore, EVENTS_KEY } from '../eventStore';

const memory = (): KeyValueStorage & { data: Record<string, string> } => {
  const data: Record<string, string> = {};
  return { data, getItem: (k) => data[k] ?? null, setItem: (k, v) => void (data[k] = v) };
};
const at = new Date('2026-05-10T05:00:00Z');

describe('createEventStore', () => {
  it('starts empty, records events, persists and notifies', () => {
    const storage = memory();
    const store = createEventStore(storage);
    let calls = 0;
    store.subscribe(() => calls++);
    store.record({ kind: 'mission_completed', day: '2026-05-10', recordedAt: at });
    expect(store.get()).toHaveLength(1);
    expect(calls).toBe(1);
    expect(createEventStore(storage).get()).toHaveLength(1); // reloaded from storage
    expect(storage.data[EVENTS_KEY]).toContain('2026-05-10');
  });

  it('returns a stable snapshot between changes (for useSyncExternalStore)', () => {
    const store = createEventStore(memory());
    expect(store.get()).toBe(store.get());
  });

  it('keeps working in memory when storage fails', () => {
    const broken: KeyValueStorage = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('full');
      },
    };
    const store = createEventStore(broken);
    store.record({ kind: 'checkin', day: '2026-05-10', state: 'late', recordedAt: at });
    expect(store.get()).toHaveLength(1);
  });
});
