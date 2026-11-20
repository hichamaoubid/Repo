/**
 * Reconciles the alarm plan with what the native layer has scheduled. Pure: the caller
 * passes "now", the scheduled list and the days already completed.
 */
import type { PlannedAlarm } from '.';

export interface ScheduledAlarm {
  id: string;
  /** Epoch milliseconds. */
  fireAt: number;
}

export interface SyncActions {
  /** New or changed alarms. Scheduling an existing id replaces it. */
  toSchedule: PlannedAlarm[];
  toCancel: string[];
}

const ID = /^fajr-(\d{4}-\d{2}-\d{2})-(\d{1,2})$/;

export function parseAlarmId(id: string): { day: string; sequence: number } | null {
  const m = ID.exec(id);
  return m ? { day: m[1] as string, sequence: Number(m[2]) } : null;
}

/** A second's tolerance: native layers may round to the second. */
const SAME_TIME_MS = 1000;

export function reconcile(
  planned: readonly PlannedAlarm[],
  scheduled: readonly ScheduledAlarm[],
  now: Date,
  completedDays: ReadonlySet<string> = new Set(),
): SyncActions {
  const t = now.getTime();
  const plannedById = new Map(planned.filter((p) => !completedDays.has(p.fajrDay)).map((p) => [p.id, p]));
  const scheduledById = new Map(scheduled.map((s) => [s.id, s]));

  // A day is "active" when its main alarm has rung and follow-ups are still pending: that
  // chain keeps ringing until the mission is completed, even though the plan (which only
  // looks forward) no longer lists the day.
  const rang = new Set<string>();
  const pending = new Set<string>();
  for (const s of scheduled) {
    const parsed = parseAlarmId(s.id);
    if (!parsed || completedDays.has(parsed.day)) continue;
    if (parsed.sequence === 0 && s.fireAt <= t) rang.add(parsed.day);
    if (parsed.sequence > 0 && s.fireAt > t) pending.add(parsed.day);
  }
  const activeDays = new Set([...rang].filter((d) => pending.has(d)));

  const toSchedule = [...plannedById.values()].filter((p) => {
    const existing = scheduledById.get(p.id);
    return !existing || Math.abs(existing.fireAt - p.fireAt.getTime()) > SAME_TIME_MS;
  });

  const toCancel: string[] = [];
  for (const s of scheduled) {
    const parsed = parseAlarmId(s.id);
    if (!parsed || plannedById.has(s.id)) continue; // not ours, or still planned
    if (activeDays.has(parsed.day)) continue; // part of a chain that is still ringing
    if (completedDays.has(parsed.day) && s.fireAt <= t) continue; // already rang, nothing to stop
    toCancel.push(s.id);
  }
  return { toSchedule, toCancel };
}

/** Everything still scheduled for `day`, cancelled once its mission is completed. */
export function idsToCancelOnCompletion(day: string, scheduled: readonly ScheduledAlarm[]): string[] {
  return scheduled.filter((s) => parseAlarmId(s.id)?.day === day).map((s) => s.id);
}
