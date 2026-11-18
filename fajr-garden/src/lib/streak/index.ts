/**
 * Fajr consistency streak. A pure function of the event log: no clock, storage or React.
 * The rules are merciful by design (PRD FR-014):
 * - a day is kept with a completed wake-up mission or an on-time/late Fajr check-in,
 * - a missed day can be made up (qada) up to 24 h after the day ends,
 * - each calendar month has a number of freezes that silently cover missed days,
 * - exemption and travel pauses are neutral,
 * - today, and yesterday while qada is still possible, are "pending" and never break it.
 */
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

export type DayKey = string; // YYYY-MM-DD in the user's local timezone

export type CheckinState = 'on_time' | 'late' | 'missed' | 'made_up';

export type FajrEvent =
  | { kind: 'mission_completed'; day: DayKey; recordedAt: Date }
  | { kind: 'checkin'; day: DayKey; state: CheckinState; recordedAt: Date };

export interface Pause {
  from: DayKey; // inclusive
  to: DayKey; // inclusive
  reason: 'exemption' | 'travel';
}

export interface StreakInput {
  events: readonly FajrEvent[];
  pauses: readonly Pause[];
  today: DayKey;
  now: Date;
  timeZone: string;
  /** Default 2. */
  freezesPerMonth?: number;
  /** First day to evaluate. Defaults to the earliest event day, or today. */
  since?: DayKey;
}

export type DayStatus = 'kept' | 'made_up' | 'frozen' | 'paused' | 'missed' | 'pending';

export interface StreakResult {
  current: number;
  best: number;
  days: { day: DayKey; status: DayStatus }[];
  freezesLeftThisMonth: number;
}

export const DEFAULT_FREEZES_PER_MONTH = 2;
export const QADA_WINDOW_MS = 24 * 3_600_000;

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

function assertDayKey(day: DayKey): void {
  if (!DAY_KEY.test(day)) throw new Error(`invalid day key: ${day} (expected YYYY-MM-DD)`);
}

/** The local day an instant belongs to. The day boundary is local midnight. */
export function fajrDayKey(at: Date, timeZone: string): DayKey {
  return formatInTimeZone(at, timeZone, 'yyyy-MM-dd');
}

export function nextDay(day: DayKey): DayKey {
  assertDayKey(day);
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}

/** The instant the local day ends (= start of the next local day), DST-aware. */
export function dayEnd(day: DayKey, timeZone: string): Date {
  return fromZonedTime(`${nextDay(day)}T00:00:00`, timeZone);
}

const RANK: Record<'kept' | 'made_up' | 'none', number> = { none: 0, made_up: 1, kept: 2 };

function bestOutcomeByDay(input: StreakInput): Map<DayKey, 'kept' | 'made_up'> {
  const out = new Map<DayKey, 'kept' | 'made_up'>();
  for (const e of input.events) {
    assertDayKey(e.day);
    let outcome: 'kept' | 'made_up' | null = null;
    if (e.kind === 'mission_completed' || e.state === 'on_time' || e.state === 'late') {
      outcome = 'kept';
    } else if (e.state === 'made_up') {
      const deadline = dayEnd(e.day, input.timeZone).getTime() + QADA_WINDOW_MS;
      if (e.recordedAt.getTime() <= deadline) outcome = 'made_up';
    }
    if (outcome && RANK[outcome] > RANK[out.get(e.day) ?? 'none']) out.set(e.day, outcome);
  }
  return out;
}

const isPaused = (day: DayKey, pauses: readonly Pause[]) => pauses.some((p) => p.from <= day && day <= p.to);

export function computeStreak(input: StreakInput): StreakResult {
  const freezesPerMonth = input.freezesPerMonth ?? DEFAULT_FREEZES_PER_MONTH;
  if (!Number.isInteger(freezesPerMonth) || freezesPerMonth < 0) {
    throw new RangeError(`freezesPerMonth must be a non-negative integer, got ${freezesPerMonth}`);
  }
  assertDayKey(input.today);
  input.pauses.forEach((p) => {
    assertDayKey(p.from);
    assertDayKey(p.to);
  });

  const outcomes = bestOutcomeByDay(input);
  const pastDays = [...outcomes.keys()].filter((d) => d <= input.today);
  let day = input.since ?? pastDays.reduce((min, d) => (d < min ? d : min), input.today);
  assertDayKey(day);

  const days: StreakResult['days'] = [];
  const freezesUsed = new Map<string, number>(); // YYYY-MM → count
  let run = 0;
  let best = 0;

  for (; day <= input.today; day = nextDay(day)) {
    const outcome = outcomes.get(day);
    let status: DayStatus;
    if (outcome) {
      status = outcome;
    } else if (isPaused(day, input.pauses)) {
      status = 'paused';
    } else if (input.now.getTime() <= dayEnd(day, input.timeZone).getTime() + QADA_WINDOW_MS) {
      status = 'pending'; // today, or a day that can still be made up
    } else {
      const month = day.slice(0, 7);
      const used = freezesUsed.get(month) ?? 0;
      if (used < freezesPerMonth) {
        freezesUsed.set(month, used + 1);
        status = 'frozen';
      } else {
        status = 'missed';
      }
    }

    if (status === 'kept' || status === 'made_up') run += 1;
    if (status === 'missed') run = 0;
    best = Math.max(best, run);
    days.push({ day, status });
  }

  const thisMonth = input.today.slice(0, 7);
  return {
    current: run,
    best,
    days,
    freezesLeftThisMonth: freezesPerMonth - (freezesUsed.get(thisMonth) ?? 0),
  };
}
