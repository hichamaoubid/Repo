import { DEFAULT_SETTINGS, serializeSettings } from '../../../lib/settings';
import { createSettingsStore, SETTINGS_KEY, type KeyValueStorage } from '../store';

const memory = (initial: Record<string, string> = {}): KeyValueStorage & { data: Record<string, string> } => {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => data[k] ?? null,
    setItem: (k, v) => {
      data[k] = v;
    },
  };
};

describe('createSettingsStore', () => {
  it('starts from defaults when nothing is stored', () => {
    expect(createSettingsStore(memory()).get()).toEqual(DEFAULT_SETTINGS);
  });

  it('loads and validates what is stored', () => {
    const stored = { ...DEFAULT_SETTINGS, methodIsAuto: false };
    expect(createSettingsStore(memory({ [SETTINGS_KEY]: serializeSettings(stored) })).get()).toEqual(stored);
    expect(createSettingsStore(memory({ [SETTINGS_KEY]: '{corrupt' })).get()).toEqual(DEFAULT_SETTINGS);
  });

  it('persists updates and notifies subscribers', () => {
    const storage = memory();
    const store = createSettingsStore(storage);
    const seen: boolean[] = [];
    const unsubscribe = store.subscribe(() => seen.push(store.get().alarm.enabled));
    store.update((s) => ({ ...s, alarm: { ...s.alarm, enabled: true } }));
    expect(seen).toEqual([true]);
    expect(JSON.parse(storage.data[SETTINGS_KEY] as string).alarm.enabled).toBe(true);
    unsubscribe();
    store.update((s) => ({ ...s, alarm: { ...s.alarm, enabled: false } }));
    expect(seen).toEqual([true]);
  });

  it('accepts a valid update whatever the key order', () => {
    const store = createSettingsStore(memory());
    store.update((s) => ({ alarm: { fixedTime: '05:10', ...s.alarm, mode: 'fixed' }, location: null, methodIsAuto: s.methodIsAuto, prayer: s.prayer, version: 1 }));
    expect(store.get().alarm).toMatchObject({ mode: 'fixed', fixedTime: '05:10' });
  });

  it('refuses an invalid update and keeps the previous state', () => {
    const store = createSettingsStore(memory());
    expect(() => store.update((s) => ({ ...s, alarm: { ...s.alarm, offsetMin: 500 } }))).toThrow(/invalid settings/);
    expect(store.get()).toEqual(DEFAULT_SETTINGS);
  });

  it('keeps working in memory when storage throws (private mode, full disk)', () => {
    const broken: KeyValueStorage = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('quota');
      },
    };
    const store = createSettingsStore(broken);
    expect(store.get()).toEqual(DEFAULT_SETTINGS);
    store.update((s) => ({ ...s, methodIsAuto: false }));
    expect(store.get().methodIsAuto).toBe(false);
  });
});
