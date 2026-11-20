import { addEvent, MAX_EVENTS, parseEvents, serializeEvents } from '../events';
import type { FajrEvent } from '..';

const mission = (day: string): FajrEvent => ({ kind: 'mission_completed', day, recordedAt: new Date(`${day}T05:00:00Z`) });

describe('parseEvents', () => {
  it('round-trips valid events, restoring dates', () => {
    const events: FajrEvent[] = [mission('2026-05-10'), { kind: 'checkin', day: '2026-05-11', state: 'late', recordedAt: new Date('2026-05-11T07:00:00Z') }];
    const parsed = parseEvents(serializeEvents(events));
    expect(parsed).toEqual(events);
    expect(parsed[0]?.recordedAt).toBeInstanceOf(Date);
  });

  it.each([null, '', 'garbage', '{}', '42'])('returns [] for %p', (raw) => {
    expect(parseEvents(raw)).toEqual([]);
  });

  it('drops invalid entries and keeps the valid ones', () => {
    const raw = JSON.stringify([
      { kind: 'mission_completed', day: '2026-05-10', recordedAt: '2026-05-10T05:00:00.000Z' },
      { kind: 'checkin', day: '2026-05-11', state: 'excellent', recordedAt: '2026-05-11T05:00:00.000Z' },
      { kind: 'checkin', day: '2026-5-12', state: 'late', recordedAt: '2026-05-12T05:00:00.000Z' },
      { kind: 'mission_completed', day: '2026-05-13', recordedAt: 'not a date' },
      { kind: 'teleport', day: '2026-05-14', recordedAt: '2026-05-14T05:00:00.000Z' },
    ]);
    expect(parseEvents(raw)).toEqual([mission('2026-05-10')]);
  });
});

describe('addEvent', () => {
  it('appends an event', () => {
    expect(addEvent([], mission('2026-05-10'))).toEqual([mission('2026-05-10')]);
  });

  it('does not duplicate an identical kind/state on the same day', () => {
    const once = addEvent([], mission('2026-05-10'));
    expect(addEvent(once, mission('2026-05-10'))).toHaveLength(1);
  });

  it('replaces an earlier manual check-in of the same day with the new state', () => {
    const a = addEvent([], { kind: 'checkin', day: '2026-05-10', state: 'missed', recordedAt: new Date('2026-05-10T09:00:00Z') });
    const b = addEvent(a, { kind: 'checkin', day: '2026-05-10', state: 'late', recordedAt: new Date('2026-05-10T10:00:00Z') });
    expect(b).toEqual([{ kind: 'checkin', day: '2026-05-10', state: 'late', recordedAt: new Date('2026-05-10T10:00:00Z') }]);
  });

  it('keeps a mission completion and a check-in of the same day side by side', () => {
    const a = addEvent([], mission('2026-05-10'));
    expect(addEvent(a, { kind: 'checkin', day: '2026-05-10', state: 'on_time', recordedAt: new Date('2026-05-10T06:00:00Z') })).toHaveLength(2);
  });

  it('keeps only the most recent events', () => {
    let events: FajrEvent[] = [];
    for (let i = 0; i < MAX_EVENTS + 20; i++) {
      const d = new Date(Date.UTC(2025, 0, 1 + i)).toISOString().slice(0, 10);
      events = addEvent(events, mission(d));
    }
    expect(events).toHaveLength(MAX_EVENTS);
    expect(events[0]?.day).toBe(new Date(Date.UTC(2025, 0, 21)).toISOString().slice(0, 10));
  });
});
