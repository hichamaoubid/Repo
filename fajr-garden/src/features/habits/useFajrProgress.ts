import { useMemo } from 'react';
import { computeGarden, type Garden } from '../../lib/garden';
import { computeStreak, fajrDayKey, type DayStatus, type StreakResult } from '../../lib/streak';
import type { LocationSetting } from '../../lib/settings';
import { useFajrLog } from './useFajrLog';

export interface FajrProgress {
  today: string;
  yesterday: string;
  streak: StreakResult;
  garden: Garden;
  statusOf: (day: string) => DayStatus | undefined;
}

const previousDay = (day: string) => {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d - 1)).toISOString().slice(0, 10);
};

/** Streak and garden derived from the private log, recomputed when the log or the day changes. */
export function useFajrProgress(location: LocationSetting | null, now: Date): FajrProgress {
  const events = useFajrLog();
  const timeZone = location?.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const today = fajrDayKey(now, timeZone);
  // Recompute at most once a minute: `now` ticks every 30 s.
  const minute = Math.floor(now.getTime() / 60_000);

  return useMemo(() => {
    const at = new Date(minute * 60_000);
    const streak = computeStreak({ events, pauses: [], today, now: at, timeZone });
    const byDay = new Map(streak.days.map((d) => [d.day, d.status]));
    return {
      today,
      yesterday: previousDay(today),
      streak,
      garden: computeGarden(streak.days, today),
      statusOf: (day: string) => byDay.get(day),
    };
  }, [events, today, timeZone, minute]);
}

