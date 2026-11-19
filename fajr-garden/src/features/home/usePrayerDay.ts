import { useMemo } from 'react';
import { computePrayerTimes, localDateIn, nextPrayer, type DayTimes, type NextPrayer } from '../../lib/prayer';
import type { AppSettings, LocationSetting } from '../../lib/settings';
import { PALETTES, paletteAt, type Palette } from '../../theme/sunPhase';

export interface PrayerDay {
  location: LocationSetting;
  times: DayTimes;
  next: NextPrayer;
  palette: Palette;
}

/** Today's times, next prayer and sun-phase palette, or null until a location is set. */
export function usePrayerDay(settings: AppSettings, now: Date): PrayerDay | null {
  const { location, prayer } = settings;
  const today = location ? localDateIn(now, location.timeZone) : null;
  const dayKey = today ? `${today.year}-${today.month}-${today.day}` : '';

  const times = useMemo(
    () => (location && today ? computePrayerTimes(location, today, prayer) : null),
    // recompute once per local day or when settings change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dayKey, location, prayer],
  );
  if (!location || !times) return null;
  return {
    location,
    times,
    next: nextPrayer(now, location, prayer, location.timeZone),
    palette: paletteAt(now, times),
  };
}

/** Palette used before any location is known. */
export const NO_LOCATION_PALETTE: Palette = PALETTES.fajr;
