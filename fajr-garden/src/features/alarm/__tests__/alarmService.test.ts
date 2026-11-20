import { DEFAULT_SETTINGS, type AppSettings } from '../../../lib/settings';
import { createAlarmService, type AlarmNative, type NativeAlarm } from '../alarmService';
import type { KeyValueStorage } from '../../settings/store';

const memoryStorage = (): KeyValueStorage => {
  const data: Record<string, string> = {};
  return { getItem: (k) => data[k] ?? null, setItem: (k, v) => void (data[k] = v) };
};

function fakeNative(): AlarmNative & { alarms: Map<string, NativeAlarm>; stopped: number } {
  const alarms = new Map<string, NativeAlarm>();
  return {
    alarms,
    stopped: 0,
    isSupported: () => true,
    async list() {
      return [...alarms.values()];
    },
    async schedule(list) {
      list.forEach((a) => alarms.set(a.id, a));
    },
    async cancel(ids) {
      ids.forEach((id) => alarms.delete(id));
    },
    async stopRinging() {
      this.stopped += 1;
    },
  };
}

const settings: AppSettings = {
  ...DEFAULT_SETTINGS,
  location: { source: 'city', latitude: 48.8566, longitude: 2.3522, timeZone: 'Europe/Paris', label: 'Paris', country: 'FR' },
  prayer: { ...DEFAULT_SETTINGS.prayer, method: 'france_uoif' },
  alarm: { ...DEFAULT_SETTINGS.alarm, enabled: true },
};
const texts = { title: 'Fajr', body: 'Complete your mission to stop the alarm' };
const NOW = new Date('2026-05-10T10:00:00Z');

describe('alarm service', () => {
  it('schedules the plan on the native side with titles', async () => {
    const native = fakeNative();
    const service = createAlarmService(native, memoryStorage());
    const result = await service.sync(settings, NOW, texts);
    expect(result).toMatchObject({ scheduled: 27, cancelled: 0 });
    const first = native.alarms.get('fajr-2026-05-11-0');
    expect(first).toMatchObject({ title: 'Fajr', body: texts.body });
  });

  it('is idempotent: a second sync changes nothing', async () => {
    const native = fakeNative();
    const service = createAlarmService(native, memoryStorage());
    await service.sync(settings, NOW, texts);
    expect(await service.sync(settings, NOW, texts)).toMatchObject({ scheduled: 0, cancelled: 0 });
  });

  it('cancels everything when the alarm is turned off', async () => {
    const native = fakeNative();
    const service = createAlarmService(native, memoryStorage());
    await service.sync(settings, NOW, texts);
    const r = await service.sync({ ...settings, alarm: { ...settings.alarm, enabled: false } }, NOW, texts);
    expect(r.cancelled).toBe(27);
    expect(native.alarms.size).toBe(0);
  });

  it('schedules nothing without a location', async () => {
    const native = fakeNative();
    const r = await createAlarmService(native, memoryStorage()).sync({ ...settings, location: null }, NOW, texts);
    expect(r).toMatchObject({ scheduled: 0, cancelled: 0, skipped: 'no-location' });
  });

  it('reports unsupported platforms instead of throwing', async () => {
    const native = { ...fakeNative(), isSupported: () => false };
    const r = await createAlarmService(native, memoryStorage()).sync(settings, NOW, texts);
    expect(r.skipped).toBe('unsupported');
  });

  it('completing the mission stops the ringing, cancels the day and is remembered', async () => {
    const native = fakeNative();
    const storage = memoryStorage();
    const service = createAlarmService(native, storage);
    await service.sync(settings, NOW, texts);
    // the morning of 11 May: main rang, chain pending
    const morning = new Date('2026-05-11T02:40:00Z');
    await service.completeMission('2026-05-11', morning);
    expect(native.stopped).toBe(1);
    expect([...native.alarms.keys()].some((id) => id.startsWith('fajr-2026-05-11'))).toBe(false);
    // a later sync the same morning must not bring the day back
    await service.sync(settings, morning, texts);
    expect([...native.alarms.keys()].some((id) => id.startsWith('fajr-2026-05-11'))).toBe(false);
    // and a fresh service on the same storage remembers it
    const again = createAlarmService(native, storage);
    await again.sync(settings, morning, texts);
    expect([...native.alarms.keys()].some((id) => id.startsWith('fajr-2026-05-11'))).toBe(false);
  });

  it('forgets completed days older than 7 days', async () => {
    const storage = memoryStorage();
    const service = createAlarmService(fakeNative(), storage);
    await service.completeMission('2026-05-01', new Date('2026-05-01T03:00:00Z'));
    await service.completeMission('2026-05-11', new Date('2026-05-11T03:00:00Z'));
    expect(service.completedDays(new Date('2026-05-11T03:00:00Z'))).toEqual(new Set(['2026-05-11']));
  });

  it('ignores corrupt stored completion data', () => {
    const storage = memoryStorage();
    storage.setItem('alarm.completedDays.v1', '{"not":"a list"}');
    expect(createAlarmService(fakeNative(), storage).completedDays(NOW)).toEqual(new Set());
  });

  it('schedules a test alarm a few seconds ahead without touching the plan', async () => {
    const native = fakeNative();
    const service = createAlarmService(native, memoryStorage());
    await service.scheduleTest(NOW, 10, texts);
    expect(native.alarms.get('test-alarm')?.fireAt).toBe(NOW.getTime() + 10_000);
    const r = await service.sync(settings, NOW, texts);
    expect(native.alarms.has('test-alarm')).toBe(true); // not ours to cancel
    expect(r.cancelled).toBe(0);
  });
});
