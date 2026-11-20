import { useMemo } from 'react';
import { computePrayerTimes, nextPrayer, scheduleDateFor, type DayTimes, type NextPrayer } from '../../lib/prayer';
import type { AppSettings, LocationSetting } from '../../lib/settings';
import { PALETTES, paletteAt, type Palette } from '../../theme/sunPhase';

export interface PrayerDay {
  location: LocationSetting;
  /** The schedule shown: today's, or tomorrow's once Isha has passed. */
  times: DayTimes;
  isTomorrow: boolean;
  next: NextPrayer;
  palette: Palette;
}

/** Today's times, next prayer and sun-phase palette, or null until a location is set. */
export function usePrayerDay(settings: AppSettings, now: Date): PrayerDay | null {
  const { location, prayer } = settings;
  const schedule = location ? scheduleDateFor(now, location, prayer, location.timeZone) : null;
  const dayKey = schedule ? `${schedule.date.year}-${schedule.date.month}-${schedule.date.day}` : '';

  const times = useMemo(
    () => (location && schedule ? computePrayerTimes(location, schedule.date, prayer) : null),
    // recompute only when the shown day or the settings change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dayKey, location, prayer],
  );
  if (!location || !times || !schedule) return null;
  return {
    location,
    times,
    isTomorrow: schedule.isTomorrow,
    next: nextPrayer(now, location, prayer, location.timeZone),
    // Before tomorrow's Fajr the sun phase is still "isha", so tomorrow's times work here.
    palette: paletteAt(now, times),
  };
}

/** Palette used before any location is known. */
export const NO_LOCATION_PALETTE: Palette = PALETTES.fajr;
