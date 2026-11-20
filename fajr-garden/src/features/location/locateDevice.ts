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
export async function locateDevice(options: { arabicLabel?: boolean } = {}): Promise<LocateResult> {
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
  const city = nearestCity(getCities(), coords);

  // The label comes from the bundled dataset: consistent names, available in Arabic. The
  // platform geocoder can return historical or administrative names (for example
  // "Dar-el-Beida" for Casablanca), so it is only used for the country, which it knows
  // better near borders.
  let label = (options.arabicLabel && city?.arabicNames[0]) || city?.name || `${coords.latitude}, ${coords.longitude}`;
  let country = city?.country ?? '';
  if (Platform.OS !== 'web') {
    try {
      const [place] = await Location.reverseGeocodeAsync(coords);
      if (place?.isoCountryCode && /^[A-Z]{2}$/.test(place.isoCountryCode)) country = place.isoCountryCode;
      if (!city && place?.city) label = place.city;
    } catch {
      // Geocoding is best effort; the dataset's country is used instead.
    }
  }
  label = label.slice(0, 80);
  const fallback = city;

  // The device's own zone drives its clock, so alarms must use it.
  const deviceZone = getCalendars()[0]?.timeZone;
  const timeZone = isValidTimeZone(deviceZone) ? deviceZone : (fallback?.timeZone ?? 'UTC');

  if (!/^[A-Z]{2}$/.test(country)) return { ok: false, reason: 'unavailable' };
  return { ok: true, location: { source: 'gps', ...coords, timeZone, label, country } };
}
