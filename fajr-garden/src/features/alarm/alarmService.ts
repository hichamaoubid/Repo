/**
 * Orchestrates the native alarm module: plan (lib/alarm) → reconcile (lib/alarm/sync)
 * → native schedule/cancel. No React or native imports: the native module and the
 * storage are injected, so this is unit-tested with fakes.
 */
import { planFajrAlarms } from '../../lib/alarm';
import { idsToCancelOnCompletion, reconcile } from '../../lib/alarm/sync';
import type { AppSettings } from '../../lib/settings';
import { fajrDayKey } from '../../lib/streak';
import type { KeyValueStorage } from '../settings/store';

export interface NativeAlarm {
  id: string;
  /** Epoch milliseconds. */
  fireAt: number;
  title: string;
  body: string;
}

/** What the native module must provide (see modules/fg-alarm). */
export interface AlarmNative {
  isSupported(): boolean;
  list(): Promise<NativeAlarm[]>;
  /** Scheduling an existing id replaces it. */
  schedule(alarms: NativeAlarm[]): Promise<void>;
  cancel(ids: string[]): Promise<void>;
  stopRinging(): Promise<void>;
}

export interface AlarmTexts {
  title: string;
  body: string;
}

export interface SyncResult {
  scheduled: number;
  cancelled: number;
  skipped?: 'unsupported' | 'no-location';
}

export const TEST_ALARM_ID = 'test-alarm';
const COMPLETED_KEY = 'alarm.completedDays.v1';
const KEEP_COMPLETED_DAYS = 7;
const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

export function createAlarmService(native: AlarmNative, storage: KeyValueStorage) {
  function readCompleted(): string[] {
    try {
      const parsed: unknown = JSON.parse(storage.getItem(COMPLETED_KEY) ?? '[]');
      return Array.isArray(parsed) ? parsed.filter((d): d is string => typeof d === 'string' && DAY_KEY.test(d)) : [];
    } catch {
      return [];
    }
  }

  function completedDays(now: Date): Set<string> {
    const cutoff = new Date(now.getTime() - KEEP_COMPLETED_DAYS * 86_400_000).toISOString().slice(0, 10);
    return new Set(readCompleted().filter((d) => d >= cutoff));
  }

  async function sync(settings: AppSettings, now: Date, texts: AlarmTexts): Promise<SyncResult> {
    if (!native.isSupported()) return { scheduled: 0, cancelled: 0, skipped: 'unsupported' };
    const scheduled = await native.list();
    const location = settings.location;
    const plan =
      location && settings.alarm.enabled
        ? planFajrAlarms({ now, coords: location, timeZone: location.timeZone, prayer: settings.prayer, alarm: settings.alarm })
        : [];
    const { toSchedule, toCancel } = reconcile(plan, scheduled, now, completedDays(now));
    if (toCancel.length) await native.cancel(toCancel);
    if (toSchedule.length) {
      await native.schedule(toSchedule.map((a) => ({ id: a.id, fireAt: a.fireAt.getTime(), title: texts.title, body: texts.body })));
    }
    return {
      scheduled: toSchedule.length,
      cancelled: toCancel.length,
      ...(location ? {} : { skipped: 'no-location' as const }),
    };
  }

  /** Mission done: stop the sound, cancel what is left of the day, remember it. */
  async function completeMission(day: string, now: Date): Promise<void> {
    if (!DAY_KEY.test(day)) throw new Error(`invalid day: ${day}`);
    await native.stopRinging();
    const remaining = idsToCancelOnCompletion(day, await native.list());
    if (remaining.length) await native.cancel(remaining);
    const days = [...completedDays(now), day];
    try {
      storage.setItem(COMPLETED_KEY, JSON.stringify([...new Set(days)].sort()));
    } catch {
      // Not persisted: the alarms are already cancelled, which is what matters now.
    }
  }

  async function scheduleTest(now: Date, inSeconds: number, texts: AlarmTexts): Promise<void> {
    await native.schedule([{ id: TEST_ALARM_ID, fireAt: now.getTime() + inSeconds * 1000, title: texts.title, body: texts.body }]);
  }

  return { sync, completeMission, completedDays, scheduleTest };
}

export type AlarmService = ReturnType<typeof createAlarmService>;

/** The Fajr day an alarm id belongs to, or today's for the test alarm. */
export function dayForAlarm(alarmId: string | undefined, now: Date, timeZone: string): string {
  const m = alarmId ? /^fajr-(\d{4}-\d{2}-\d{2})-\d{1,2}$/.exec(alarmId) : null;
  return m ? (m[1] as string) : fajrDayKey(now, timeZone);
}
