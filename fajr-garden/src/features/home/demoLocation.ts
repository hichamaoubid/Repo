import type { Coords } from '../../lib/prayer';

/**
 * Sprint 1 placeholder until device location and city search land (sprint 2).
 * Times are shown in the city's own timezone so they're correct whatever the device zone.
 */
export const DEMO_CITY = {
  name: 'Paris',
  coords: { latitude: 48.8566, longitude: 2.3522 } satisfies Coords,
  timeZone: 'Europe/Paris',
  countryCode: 'FR',
} as const;
