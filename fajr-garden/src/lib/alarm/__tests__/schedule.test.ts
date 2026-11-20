import { formatInTimeZone } from 'date-fns-tz';
import { computePrayerTimes, defaultSettings, type PrayerSettings } from '../../prayer';
import { DEFAULT_SETTINGS } from '../../settings';
import { planFajrAlarms, type FajrAlarmConfig } from '..';

const paris = { latitude: 48.8566, longitude: 2.3522 };
const TZ = 'Europe/Paris';
const prayer: PrayerSettings = { ...defaultSettings, method: 'france_uoif' };
const alarm = (patch: Partial<FajrAlarmConfig> = {}): FajrAlarmConfig => ({ ...DEFAULT_SETTINGS.alarm, enabled: true, ...patch });
const plan = (now: Date, a: FajrAlarmConfig, extra = {}) =>
  planFajrAlarms({ now, coords: paris, timeZone: TZ, prayer, alarm: a, ...extra });
const mains = (alarms: ReturnType<typeof plan>) => alarms.filter((x) => x.kind === 'main');
const local = (d: Date) => formatInTimeZone(d, TZ, 'yyyy-MM-dd HH:mm');

const NOW = new Date('2026-05-10T10:00:00Z'); // Sunday noon in Paris, after today's Fajr

describe('planFajrAlarms', () => {
  it('plans nothing when the alarm is disabled', () => {
    expect(plan(NOW, alarm({ enabled: false }))).toEqual([]);
  });

  it('plans one main alarm per day for the next 7 days, skipping today if Fajr has passed', () => {
    const m = mains(plan(NOW, alarm()));
    expect(m.map((x) => x.fajrDay)).toEqual(['2026-05-11', '2026-05-12', '2026-05-13', '2026-05-14', '2026-05-15', '2026-05-16', '2026-05-17']);
  });

  it('includes today when Fajr is still ahead', () => {
    const early = new Date('2026-05-10T00:30:00Z'); // 02:30 in Paris
    expect(mains(plan(early, alarm()))[0]?.fajrDay).toBe('2026-05-10');
  });

  it('fires exactly at Fajr in at_fajr mode', () => {
    const t = computePrayerTimes(paris, { year: 2026, month: 5, day: 11 }, prayer);
    expect(mains(plan(NOW, alarm()))[0]?.fireAt.getTime()).toBe(t.fajr.getTime());
  });

  it('supports minutes before Fajr, minutes before sunrise and a fixed local time', () => {
    const t = computePrayerTimes(paris, { year: 2026, month: 5, day: 11 }, prayer);
    expect(mains(plan(NOW, alarm({ mode: 'before_fajr', offsetMin: 10 })))[0]?.fireAt.getTime()).toBe(t.fajr.getTime() - 10 * 60_000);
    expect(mains(plan(NOW, alarm({ mode: 'before_sunrise', offsetMin: 30 })))[0]?.fireAt.getTime()).toBe(t.sunrise.getTime() - 30 * 60_000);
    expect(local(mains(plan(NOW, alarm({ mode: 'fixed', fixedTime: '05:15' })))[0]!.fireAt)).toBe('2026-05-11 05:15');
  });

  it('keeps a fixed local time across the DST change', () => {
    const beforeDst = new Date('2026-03-27T12:00:00Z');
    const m = mains(plan(beforeDst, alarm({ mode: 'fixed', fixedTime: '06:00' })));
    for (const x of m) expect(formatInTimeZone(x.fireAt, TZ, 'HH:mm')).toBe('06:00');
    expect(m.map((x) => x.fajrDay)).toContain('2026-03-29');
  });

  it('only plans the enabled weekdays (bit 0 = Monday … bit 6 = Sunday)', () => {
    const weekdaysOnly = 0b0011111;
    const days = mains(plan(NOW, alarm({ enabledDays: weekdaysOnly }))).map((x) => x.fajrDay);
    expect(days).toEqual(['2026-05-11', '2026-05-12', '2026-05-13', '2026-05-14', '2026-05-15']);
  });

  it('adds a follow-up chain every 2 minutes for 20 minutes, only for the first days', () => {
    const all = plan(NOW, alarm());
    const day1 = all.filter((x) => x.fajrDay === '2026-05-11');
    expect(day1.map((x) => x.sequence)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const main = day1[0]!.fireAt.getTime();
    day1.forEach((x, i) => expect(x.fireAt.getTime() - main).toBe(i * 2 * 60_000));
    // default: follow-ups for the next 2 planned days only (stays under iOS's 64 pending notifications)
    expect(all.filter((x) => x.kind === 'followup').length).toBe(20);
    expect(all.length).toBeLessThanOrEqual(64);
  });

  it('never schedules follow-ups at or after sunrise', () => {
    const lateFixed = alarm({ mode: 'before_sunrise', offsetMin: 5 });
    const day1 = plan(NOW, lateFixed).filter((x) => x.fajrDay === '2026-05-11');
    const sunrise = computePrayerTimes(paris, { year: 2026, month: 5, day: 11 }, prayer).sunrise.getTime();
    for (const x of day1) expect(x.fireAt.getTime()).toBeLessThan(sunrise);
    expect(day1.length).toBe(3); // main at −5 min, follow-ups at −3 and −1
  });

  it('gives every alarm a unique, deterministic id', () => {
    const a = plan(NOW, alarm());
    const ids = a.map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(plan(NOW, alarm()).map((x) => x.id)).toEqual(ids);
    expect(ids[0]).toBe('fajr-2026-05-11-0');
  });

  it('returns alarms sorted by time', () => {
    const times = plan(NOW, alarm()).map((x) => x.fireAt.getTime());
    expect([...times].sort((a, b) => a - b)).toEqual(times);
  });

  it('rejects an invalid configuration', () => {
    expect(() => plan(NOW, alarm({ mode: 'fixed', fixedTime: '7am' }))).toThrow(/fixedTime/);
    expect(() => plan(NOW, alarm({ offsetMin: 90 }))).toThrow(/offsetMin/);
  });
});
