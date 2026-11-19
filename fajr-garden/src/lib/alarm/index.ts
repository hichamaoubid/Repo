/**
 * Fajr alarm planning (PRD FR-006 to FR-008). Pure: given the settings and "now", it
 * returns the exact list of alarms the native module must schedule. The native layer
 * (AlarmKit / AlarmManager, sprint 3) only executes this plan.
 */
import { fromZonedTime } from 'date-fns-tz';
import { addDays, computePrayerTimes, localDateIn, type ComputeOptions, type Coords, type LocalDate, type PrayerSettings } from '../prayer';

export type AlarmMode = 'at_fajr' | 'before_fajr' | 'before_sunrise' | 'fixed';
export type MissionType = 'stand_perform' | 'steps' | 'math' | 'wudu' | 'ayah';

export const ALARM_MODES: readonly AlarmMode[] = ['at_fajr', 'before_fajr', 'before_sunrise', 'fixed'];
export const MISSION_TYPES: readonly MissionType[] = ['stand_perform', 'steps', 'math', 'wudu', 'ayah'];

export interface FajrAlarmConfig {
  enabled: boolean;
  mode: AlarmMode;
  /** Minutes before Fajr or sunrise, 0–60. Ignored for `at_fajr` and `fixed`. */
  offsetMin: number;
  /** Local "HH:MM", required for `fixed`. */
  fixedTime?: string;
  mission: MissionType;
  /** 0–3 snoozes allowed (FR-008). */
  snoozeMax: number;
  /** 3–9 minutes per snooze. */
  snoozeMin: number;
  /** Bit 0 = Monday … bit 6 = Sunday. */
  enabledDays: number;
}

export interface PlannedAlarm {
  /** Deterministic: `fajr-<day>-<sequence>`, so re-planning replaces alarms in place. */
  id: string;
  fajrDay: string; // YYYY-MM-DD, local
  kind: 'main' | 'followup';
  /** 0 for the main alarm, 1… for follow-ups. */
  sequence: number;
  fireAt: Date;
}

export interface PlanInput {
  now: Date;
  coords: Coords;
  timeZone: string;
  prayer: PrayerSettings;
  alarm: FajrAlarmConfig;
  /** Days to plan, default 7. */
  days?: number;
  /** Days (from the first planned one) that also get follow-up alarms, default 2. */
  followUpDays?: number;
  options?: ComputeOptions;
}

export const FOLLOW_UP_EVERY_MIN = 2;
export const FOLLOW_UP_FOR_MIN = 20;
const MIN = 60_000;
const FIXED_TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export function validateAlarmConfig(a: FajrAlarmConfig): void {
  if (!ALARM_MODES.includes(a.mode)) throw new RangeError(`invalid mode: ${a.mode}`);
  if (!Number.isInteger(a.offsetMin) || a.offsetMin < 0 || a.offsetMin > 60) {
    throw new RangeError(`offsetMin must be an integer in 0–60, got ${a.offsetMin}`);
  }
  if (a.mode === 'fixed' && !(typeof a.fixedTime === 'string' && FIXED_TIME.test(a.fixedTime))) {
    throw new RangeError(`fixedTime must be HH:MM in fixed mode, got ${String(a.fixedTime)}`);
  }
  if (!MISSION_TYPES.includes(a.mission)) throw new RangeError(`invalid mission: ${a.mission}`);
  if (!Number.isInteger(a.snoozeMax) || a.snoozeMax < 0 || a.snoozeMax > 3) throw new RangeError('snoozeMax must be 0–3');
  if (!Number.isInteger(a.snoozeMin) || a.snoozeMin < 3 || a.snoozeMin > 9) throw new RangeError('snoozeMin must be 3–9');
  if (!Number.isInteger(a.enabledDays) || a.enabledDays < 0 || a.enabledDays > 0b1111111) {
    throw new RangeError('enabledDays must be a 7-bit mask');
  }
}

const dayKey = (d: LocalDate) =>
  `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;

/** Bit index for a local date: Monday = 0 … Sunday = 6. */
const weekdayBit = (d: LocalDate) => (new Date(Date.UTC(d.year, d.month - 1, d.day)).getUTCDay() + 6) % 7;

export function planFajrAlarms(input: PlanInput): PlannedAlarm[] {
  const { now, coords, timeZone, prayer, alarm } = input;
  if (!alarm.enabled) return [];
  validateAlarmConfig(alarm);
  const days = input.days ?? 7;
  const followUpDays = input.followUpDays ?? 2;

  const planned: PlannedAlarm[] = [];
  let mainsPlanned = 0;
  const today = localDateIn(now, timeZone);

  // Look one day further than `days` so a passed alarm today does not shorten the plan.
  for (let i = 0; i <= days && mainsPlanned < days; i++) {
    const date = addDays(today, i);
    if (!(alarm.enabledDays & (1 << weekdayBit(date)))) continue;

    const times = computePrayerTimes(coords, date, prayer, input.options);
    let fireAt: Date;
    switch (alarm.mode) {
      case 'at_fajr':
        fireAt = times.fajr;
        break;
      case 'before_fajr':
        fireAt = new Date(times.fajr.getTime() - alarm.offsetMin * MIN);
        break;
      case 'before_sunrise':
        fireAt = new Date(times.sunrise.getTime() - alarm.offsetMin * MIN);
        break;
      case 'fixed':
        fireAt = fromZonedTime(`${dayKey(date)}T${alarm.fixedTime}:00`, timeZone);
        break;
    }
    if (fireAt.getTime() <= now.getTime()) continue;

    const key = dayKey(date);
    planned.push({ id: `fajr-${key}-0`, fajrDay: key, kind: 'main', sequence: 0, fireAt });

    if (mainsPlanned < followUpDays) {
      // The chain keeps ringing until the mission is completed (completion cancels it).
      // There is no point waking someone for Fajr after sunrise.
      for (let k = 1; k <= FOLLOW_UP_FOR_MIN / FOLLOW_UP_EVERY_MIN; k++) {
        const at = new Date(fireAt.getTime() + k * FOLLOW_UP_EVERY_MIN * MIN);
        if (at.getTime() >= times.sunrise.getTime()) break;
        planned.push({ id: `fajr-${key}-${k}`, fajrDay: key, kind: 'followup', sequence: k, fireAt: at });
      }
    }
    mainsPlanned += 1;
  }
  return planned.sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime());
}
