import { idsToCancelOnCompletion, parseAlarmId, reconcile, type ScheduledAlarm } from '../sync';
import type { PlannedAlarm } from '..';

const at = (iso: string) => new Date(iso);
const planned = (day: string, seq: number, iso: string): PlannedAlarm => ({
  id: `fajr-${day}-${seq}`,
  fajrDay: day,
  kind: seq === 0 ? 'main' : 'followup',
  sequence: seq,
  fireAt: at(iso),
});
const scheduled = (id: string, iso: string): ScheduledAlarm => ({ id, fireAt: at(iso).getTime() });
const NOW = at('2026-05-11T03:00:00Z');

describe('parseAlarmId', () => {
  it('reads the day and sequence from an alarm id', () => {
    expect(parseAlarmId('fajr-2026-05-11-3')).toEqual({ day: '2026-05-11', sequence: 3 });
  });
  it('returns null for ids it does not own', () => {
    expect(parseAlarmId('other-123')).toBeNull();
    expect(parseAlarmId('fajr-2026-5-11-0')).toBeNull();
  });
});

describe('reconcile', () => {
  it('schedules everything when nothing is scheduled', () => {
    const plan = [planned('2026-05-12', 0, '2026-05-12T02:30:00Z')];
    expect(reconcile(plan, [], NOW)).toEqual({ toSchedule: plan, toCancel: [] });
  });

  it('leaves unchanged alarms alone', () => {
    const plan = [planned('2026-05-12', 0, '2026-05-12T02:30:00Z')];
    expect(reconcile(plan, [scheduled('fajr-2026-05-12-0', '2026-05-12T02:30:00Z')], NOW)).toEqual({ toSchedule: [], toCancel: [] });
  });

  it('reschedules an alarm whose time changed (native side replaces by id)', () => {
    const plan = [planned('2026-05-12', 0, '2026-05-12T02:20:00Z')];
    const r = reconcile(plan, [scheduled('fajr-2026-05-12-0', '2026-05-12T02:30:00Z')], NOW);
    expect(r.toSchedule.map((a) => a.id)).toEqual(['fajr-2026-05-12-0']);
    expect(r.toCancel).toEqual([]);
  });

  it('cancels future alarms that are no longer planned (alarm disabled, weekday removed)', () => {
    const r = reconcile([], [scheduled('fajr-2026-05-12-0', '2026-05-12T02:30:00Z'), scheduled('fajr-2026-05-12-1', '2026-05-12T02:32:00Z')], NOW);
    expect(r.toCancel).toEqual(['fajr-2026-05-12-0', 'fajr-2026-05-12-1']);
  });

  it('never cancels the follow-up chain of a day whose main alarm has already rung', () => {
    // Today's main rang at 02:50; the plan no longer contains today, but the chain must keep ringing.
    const sched = [
      scheduled('fajr-2026-05-11-0', '2026-05-11T02:50:00Z'),
      scheduled('fajr-2026-05-11-6', '2026-05-11T03:02:00Z'),
      scheduled('fajr-2026-05-11-7', '2026-05-11T03:04:00Z'),
    ];
    expect(reconcile([], sched, NOW).toCancel).toEqual([]);
  });

  it('does cancel the chain of an active day once that day is completed', () => {
    const sched = [scheduled('fajr-2026-05-11-0', '2026-05-11T02:50:00Z'), scheduled('fajr-2026-05-11-6', '2026-05-11T03:02:00Z')];
    expect(reconcile([], sched, NOW, new Set(['2026-05-11'])).toCancel).toEqual(['fajr-2026-05-11-6']);
  });

  it('does not re-plan alarms for a completed day', () => {
    const plan = [planned('2026-05-11', 8, '2026-05-11T03:06:00Z')];
    expect(reconcile(plan, [], NOW, new Set(['2026-05-11'])).toSchedule).toEqual([]);
  });

  it('cleans up past alarms that are not part of an active chain', () => {
    const sched = [scheduled('fajr-2026-05-10-0', '2026-05-10T02:50:00Z')];
    expect(reconcile([], sched, NOW).toCancel).toEqual(['fajr-2026-05-10-0']);
  });

  it('ignores scheduled ids it does not own', () => {
    expect(reconcile([], [scheduled('test-alarm', '2026-05-12T02:30:00Z')], NOW).toCancel).toEqual([]);
  });
});

describe('idsToCancelOnCompletion', () => {
  it('returns every still-scheduled alarm of the completed day, and only that day', () => {
    const sched = [
      scheduled('fajr-2026-05-11-0', '2026-05-11T02:50:00Z'),
      scheduled('fajr-2026-05-11-6', '2026-05-11T03:02:00Z'),
      scheduled('fajr-2026-05-12-0', '2026-05-12T02:49:00Z'),
    ];
    expect(idsToCancelOnCompletion('2026-05-11', sched)).toEqual(['fajr-2026-05-11-0', 'fajr-2026-05-11-6']);
  });
});
