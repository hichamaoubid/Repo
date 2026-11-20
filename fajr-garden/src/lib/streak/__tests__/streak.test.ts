import { computeStreak, dayEnd, fajrDayKey, type FajrEvent, type StreakInput } from '..';

const TZ = 'Europe/Paris';
const kept = (day: string): FajrEvent => ({ kind: 'mission_completed', day, recordedAt: new Date(`${day}T05:00:00Z`) });
const checkin = (day: string, state: 'on_time' | 'late' | 'missed' | 'made_up', recordedAt: string): FajrEvent => ({
  kind: 'checkin',
  day,
  state,
  recordedAt: new Date(recordedAt),
});
const input = (over: Partial<StreakInput>): StreakInput => ({
  events: [],
  pauses: [],
  today: '2026-05-10',
  now: new Date('2026-05-10T08:00:00Z'),
  timeZone: TZ,
  ...over,
});
const statusOf = (r: ReturnType<typeof computeStreak>, day: string) => r.days.find((d) => d.day === day)?.status;

describe('fajrDayKey / dayEnd', () => {
  it('uses the local calendar date of the timezone', () => {
    expect(fajrDayKey(new Date('2026-05-10T22:30:00Z'), TZ)).toBe('2026-05-11'); // 00:30 Paris
    expect(fajrDayKey(new Date('2026-05-10T22:30:00Z'), 'America/New_York')).toBe('2026-05-10');
  });

  it('computes the end of a local day across a DST change', () => {
    // 29 March 2026 has 23 hours in Paris
    expect(dayEnd('2026-03-29', TZ).toISOString()).toBe('2026-03-29T22:00:00.000Z');
    expect(dayEnd('2026-03-28', TZ).toISOString()).toBe('2026-03-28T23:00:00.000Z');
  });

  it('rejects malformed day keys', () => {
    expect(() => dayEnd('2026-5-1', TZ)).toThrow(/day key/i);
  });
});

describe('computeStreak', () => {
  it('starts at zero with today pending', () => {
    const r = computeStreak(input({}));
    expect(r.current).toBe(0);
    expect(statusOf(r, '2026-05-10')).toBe('pending');
  });

  it('counts consecutive kept days including today', () => {
    const r = computeStreak(input({ events: ['2026-05-08', '2026-05-09', '2026-05-10'].map(kept) }));
    expect(r.current).toBe(3);
  });

  it('accepts on-time and late check-ins as kept', () => {
    const r = computeStreak(
      input({
        events: [checkin('2026-05-08', 'on_time', '2026-05-08T04:30:00Z'), checkin('2026-05-09', 'late', '2026-05-09T07:00:00Z')],
      }),
    );
    expect(r.current).toBe(2);
    expect(statusOf(r, '2026-05-09')).toBe('kept');
  });

  it('does not break the streak while today is still pending', () => {
    const r = computeStreak(input({ events: ['2026-05-07', '2026-05-08', '2026-05-09'].map(kept) }));
    expect(r.current).toBe(3);
  });

  it('keeps yesterday pending while it can still be made up', () => {
    const r = computeStreak(input({ events: ['2026-05-07', '2026-05-08'].map(kept) }));
    expect(statusOf(r, '2026-05-09')).toBe('pending');
    expect(r.current).toBe(2);
    expect(r.freezesLeftThisMonth).toBe(2);
  });

  it('spends a freeze on a missed day once the qada window has closed', () => {
    const r = computeStreak(input({ events: ['2026-05-05', '2026-05-06', '2026-05-08', '2026-05-09', '2026-05-10'].map(kept) }));
    expect(statusOf(r, '2026-05-07')).toBe('frozen');
    expect(r.current).toBe(5); // a frozen day keeps the streak but does not add to it
    expect(r.freezesLeftThisMonth).toBe(1);
  });

  it('breaks on the third missed day in a month', () => {
    const days = ['2026-05-01', '2026-05-03', '2026-05-05', '2026-05-07', '2026-05-08', '2026-05-09', '2026-05-10'];
    const r = computeStreak(input({ events: days.map(kept) }));
    expect(statusOf(r, '2026-05-02')).toBe('frozen');
    expect(statusOf(r, '2026-05-04')).toBe('frozen');
    expect(statusOf(r, '2026-05-06')).toBe('missed');
    expect(r.current).toBe(4);
    expect(r.best).toBe(4);
    expect(r.freezesLeftThisMonth).toBe(0);
  });

  it('resets freezes at the start of each calendar month', () => {
    const days = ['2026-04-27', '2026-04-29', '2026-05-01', '2026-05-03', '2026-05-04'];
    const r = computeStreak(input({ today: '2026-05-04', now: new Date('2026-05-04T08:00:00Z'), events: days.map(kept) }));
    expect(statusOf(r, '2026-04-28')).toBe('frozen');
    expect(statusOf(r, '2026-04-30')).toBe('frozen');
    expect(statusOf(r, '2026-05-02')).toBe('frozen');
    expect(r.current).toBe(5);
    expect(r.freezesLeftThisMonth).toBe(1);
  });

  it('restores a missed day with qada recorded within 24 h after the day ends', () => {
    // 7 May ends at 22:00Z (Paris, UTC+2); qada at 21:30Z on 8 May is within 24 h
    const r = computeStreak(
      input({
        events: [kept('2026-05-06'), checkin('2026-05-07', 'made_up', '2026-05-08T21:30:00Z'), kept('2026-05-08'), kept('2026-05-09')],
      }),
    );
    expect(statusOf(r, '2026-05-07')).toBe('made_up');
    expect(r.current).toBe(4);
    expect(r.freezesLeftThisMonth).toBe(2);
  });

  it('ignores qada recorded after the 24 h window and spends a freeze instead', () => {
    const r = computeStreak(
      input({
        events: [kept('2026-05-06'), checkin('2026-05-07', 'made_up', '2026-05-08T22:30:00Z'), kept('2026-05-08'), kept('2026-05-09')],
      }),
    );
    expect(statusOf(r, '2026-05-07')).toBe('frozen');
    expect(r.current).toBe(3);
  });

  it('measures the qada window in absolute hours across a DST change', () => {
    // 28 March ends at 23:00Z; the window closes at 23:00Z on 29 March (01:00 local on 30 March)
    const base = { today: '2026-03-30', now: new Date('2026-03-30T08:00:00Z') };
    const within = computeStreak(input({ ...base, events: [kept('2026-03-27'), checkin('2026-03-28', 'made_up', '2026-03-29T22:45:00Z')] }));
    expect(statusOf(within, '2026-03-28')).toBe('made_up');
    const after = computeStreak(input({ ...base, events: [kept('2026-03-27'), checkin('2026-03-28', 'made_up', '2026-03-29T23:15:00Z')] }));
    expect(statusOf(after, '2026-03-28')).toBe('frozen');
  });

  it('treats an explicit "missed" check-in like a missing day', () => {
    const r = computeStreak(input({ events: [kept('2026-05-07'), checkin('2026-05-08', 'missed', '2026-05-08T09:00:00Z'), kept('2026-05-09')] }));
    expect(statusOf(r, '2026-05-08')).toBe('frozen');
  });

  it('prefers kept over a missed check-in on the same day', () => {
    const r = computeStreak(input({ events: [checkin('2026-05-09', 'missed', '2026-05-09T04:00:00Z'), kept('2026-05-09')] }));
    expect(statusOf(r, '2026-05-09')).toBe('kept');
  });

  it('treats exemption and travel pauses as neutral, inclusive of both ends', () => {
    const r = computeStreak(
      input({
        events: ['2026-05-01', '2026-05-02', '2026-05-09', '2026-05-10'].map(kept),
        pauses: [{ from: '2026-05-03', to: '2026-05-08', reason: 'exemption' }],
      }),
    );
    for (const d of ['2026-05-03', '2026-05-05', '2026-05-08']) expect(statusOf(r, d)).toBe('paused');
    expect(r.current).toBe(4);
    expect(r.freezesLeftThisMonth).toBe(2);
  });

  it('a kept day inside a pause still counts', () => {
    const r = computeStreak(input({ events: ['2026-05-09', '2026-05-10'].map(kept), pauses: [{ from: '2026-05-09', to: '2026-05-09', reason: 'travel' }] }));
    expect(statusOf(r, '2026-05-09')).toBe('kept');
    expect(r.current).toBe(2);
  });

  it('ignores events dated after today', () => {
    const r = computeStreak(input({ events: [kept('2026-05-10'), kept('2026-05-11')] }));
    expect(r.current).toBe(1);
    expect(r.days.at(-1)?.day).toBe('2026-05-10');
  });

  it('tracks the best streak separately from the current one', () => {
    const days = ['2026-04-01', '2026-04-02', '2026-04-03', '2026-04-04', '2026-04-05', '2026-04-09', '2026-04-10'];
    const r = computeStreak(input({ today: '2026-04-10', now: new Date('2026-04-10T08:00:00Z'), events: days.map(kept), freezesPerMonth: 0 }));
    expect(r.best).toBe(5);
    expect(r.current).toBe(2);
  });

  it('starts from the `since` day when given', () => {
    const r = computeStreak(input({ since: '2026-05-08', events: ['2026-05-09', '2026-05-10'].map(kept) }));
    expect(r.days[0]?.day).toBe('2026-05-08');
    expect(statusOf(r, '2026-05-08')).toBe('frozen');
  });

  it('rejects a negative freeze allowance', () => {
    expect(() => computeStreak(input({ freezesPerMonth: -1 }))).toThrow(RangeError);
  });
});
