import { getCalendars } from 'expo-localization';
import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { nearestCity } from '../../lib/cities';
import { coarsenCoords, isValidTimeZone, type LocationSetting } from '../../lib/settings';
import { getCities } from './cityData';

export type LocateResult = { ok: true; location: LocationSetting } | { ok: false; reason: 'denied' | 'unavailable' };

const SIX_HOURS = 6 * 3_600_000;

/**
 * One-off, foreground-only location fix for prayer times. No background location, no
 * continuous tracking; the result is rounded to about 1 km before it is returned.
 */
export async function locateDevice(): Promise<LocateResult> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return { ok: false, reason: 'denied' };

  let position: Location.LocationObject | null = null;
  try {
    position =
      (await Location.getLastKnownPositionAsync({ maxAge: SIX_HOURS })) ??
      (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }));
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
  if (!position) return { ok: false, reason: 'unavailable' };

  const coords = coarsenCoords(position.coords);
  const fallback = nearestCity(getCities(), coords);

  let label = fallback?.name ?? `${coords.latitude}, ${coords.longitude}`;
  let country = fallback?.country ?? '';
  if (Platform.OS !== 'web') {
    try {
      const [place] = await Location.reverseGeocodeAsync(coords);
      if (place?.city) label = place.city.slice(0, 80);
      if (place?.isoCountryCode && /^[A-Z]{2}$/.test(place.isoCountryCode)) country = place.isoCountryCode;
    } catch {
      // Geocoding is best effort; the nearest city from the bundled dataset is used instead.
    }
  }

  // The device's own zone drives its clock, so alarms must use it.
  const deviceZone = getCalendars()[0]?.timeZone;
  const timeZone = isValidTimeZone(deviceZone) ? deviceZone : (fallback?.timeZone ?? 'UTC');

  if (!/^[A-Z]{2}$/.test(country)) return { ok: false, reason: 'unavailable' };
  return { ok: true, location: { source: 'gps', ...coords, timeZone, label, country } };
}
