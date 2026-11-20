/**
 * App settings: shape, defaults and validation of what is read back from storage.
 * Stored data is treated as untrusted input: every field is checked, unknown fields are
 * dropped, and a corrupt section falls back to its default without losing the others.
 */
import { ALARM_MODES, MISSION_TYPES, validateAlarmConfig, type FajrAlarmConfig } from '../alarm';
import { defaultMethodForCountry, defaultSettings as defaultPrayerSettings, type Coords, type MethodKey, type PrayerSettings, type TimeName } from '../prayer';

export interface LocationSetting {
  source: 'gps' | 'city';
  latitude: number;
  longitude: number;
  timeZone: string;
  /** Display name, e.g. the city name. */
  label: string;
  /** ISO 3166-1 alpha-2, used for the default calculation method. */
  country: string;
  /** Index in the bundled city dataset when chosen from search. */
  cityId?: number;
}

export interface AppSettings {
  version: 1;
  prayer: PrayerSettings;
  /** True until the user picks a calculation method: it then follows the location's country. */
  methodIsAuto: boolean;
  location: LocationSetting | null;
  alarm: FajrAlarmConfig;
}

export const DEFAULT_SETTINGS: AppSettings = {
  version: 1,
  prayer: defaultPrayerSettings,
  methodIsAuto: true,
  location: null,
  alarm: {
    enabled: false,
    mode: 'at_fajr',
    offsetMin: 0,
    mission: 'math',
    snoozeMax: 0,
    snoozeMin: 5,
    enabledDays: 0b1111111,
  },
};

const METHODS: readonly MethodKey[] = [
  'mwl', 'isna', 'egyptian', 'umm_al_qura', 'karachi', 'dubai', 'qatar', 'kuwait',
  'singapore', 'turkey', 'tehran', 'moonsighting', 'france_uoif', 'morocco',
];
const TIME_NAMES: readonly TimeName[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
const MAX_LABEL = 80;

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const oneOf = <T extends string>(v: unknown, allowed: readonly T[]): v is T => typeof v === 'string' && (allowed as readonly string[]).includes(v);
const intIn = (v: unknown, min: number, max: number): v is number => Number.isInteger(v) && (v as number) >= min && (v as number) <= max;

export function isValidTimeZone(tz: unknown): tz is string {
  if (typeof tz !== 'string' || !tz || tz.length > 64) return false;
  try {
    new Intl.DateTimeFormat('en', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function parsePrayer(v: unknown): PrayerSettings | null {
  if (!isObj(v) || !oneOf(v.method, METHODS) || !oneOf(v.asrMadhab, ['standard', 'hanafi'] as const)) return null;
  if (!oneOf(v.highLatRule, ['auto', 'middle', 'seventh', 'twilight'] as const) || !isObj(v.offsetsMin)) return null;
  const offsetsMin: PrayerSettings['offsetsMin'] = {};
  for (const [k, n] of Object.entries(v.offsetsMin)) {
    if (!oneOf(k, TIME_NAMES) || !intIn(n, -30, 30)) return null;
    offsetsMin[k] = n;
  }
  return { method: v.method, asrMadhab: v.asrMadhab, highLatRule: v.highLatRule, offsetsMin };
}

function parseLocation(v: unknown): LocationSetting | null {
  if (!isObj(v) || !oneOf(v.source, ['gps', 'city'] as const)) return null;
  const { latitude, longitude, timeZone, label, country, cityId } = v;
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return null;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  if (!isValidTimeZone(timeZone)) return null;
  if (typeof label !== 'string' || label.length === 0 || label.length > MAX_LABEL) return null;
  if (typeof country !== 'string' || !/^[A-Z]{2}$/.test(country)) return null;
  if (cityId !== undefined && !intIn(cityId, 0, 1_000_000)) return null;
  const out: LocationSetting = { source: v.source, latitude, longitude, timeZone, label, country };
  if (cityId !== undefined) out.cityId = cityId as number;
  return out;
}

function parseAlarm(v: unknown): FajrAlarmConfig | null {
  if (!isObj(v) || typeof v.enabled !== 'boolean' || !oneOf(v.mode, ALARM_MODES) || !oneOf(v.mission, MISSION_TYPES)) return null;
  const candidate: FajrAlarmConfig = {
    enabled: v.enabled,
    mode: v.mode,
    offsetMin: v.offsetMin as number,
    mission: v.mission,
    snoozeMax: v.snoozeMax as number,
    snoozeMin: v.snoozeMin as number,
    enabledDays: v.enabledDays as number,
  };
  if (typeof v.fixedTime === 'string') candidate.fixedTime = v.fixedTime;
  try {
    validateAlarmConfig(candidate);
  } catch {
    return null;
  }
  return candidate;
}

/** Never throws: returns defaults for anything missing or invalid. */
export function parseSettings(raw: string | null | undefined): AppSettings {
  if (!raw) return DEFAULT_SETTINGS;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return DEFAULT_SETTINGS;
  }
  if (!isObj(data) || data.version !== 1) return DEFAULT_SETTINGS;
  return {
    version: 1,
    prayer: parsePrayer(data.prayer) ?? DEFAULT_SETTINGS.prayer,
    methodIsAuto: typeof data.methodIsAuto === 'boolean' ? data.methodIsAuto : true,
    location: data.location === null ? null : parseLocation(data.location),
    alarm: parseAlarm(data.alarm) ?? DEFAULT_SETTINGS.alarm,
  };
}

/** New settings with `location` applied; the method follows the country while automatic. */
export function applyLocation(settings: AppSettings, location: LocationSetting): AppSettings {
  const prayer = settings.methodIsAuto
    ? { ...settings.prayer, method: defaultMethodForCountry(location.country) }
    : settings.prayer;
  return { ...settings, location, prayer };
}

export function serializeSettings(settings: AppSettings): string {
  return JSON.stringify(settings);
}

/**
 * Rounds GPS coordinates to 2 decimals (about 1.1 km) before they are stored: precise
 * enough for prayer times (well under a minute of difference), and avoids keeping an
 * exact home address on the device.
 */
export function coarsenCoords({ latitude, longitude }: Coords): Coords {
  const r = (n: number) => Math.round(n * 100) / 100;
  return { latitude: r(latitude), longitude: r(longitude) };
}
