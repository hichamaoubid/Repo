/**
 * Prayer time computation. Pure TypeScript, offline, no React imports.
 * Wraps the `adhan` library and adds: country defaults, the methods adhan lacks
 * (France UOIF, Morocco), the "auto" high-latitude policy, offset validation,
 * an `estimated` flag and timezone-aware "next prayer".
 */
import {
  CalculationMethod,
  CalculationParameters,
  Coordinates,
  HighLatitudeRule,
  Madhab,
  PolarCircleResolution,
  PrayerTimes,
  Rounding,
} from 'adhan';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

export type PrayerName = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
export type TimeName = PrayerName | 'sunrise';

export const PRAYER_ORDER: readonly PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

export type MethodKey =
  | 'mwl'
  | 'isna'
  | 'egyptian'
  | 'umm_al_qura'
  | 'karachi'
  | 'dubai'
  | 'qatar'
  | 'kuwait'
  | 'singapore'
  | 'turkey'
  | 'tehran'
  | 'moonsighting'
  | 'france_uoif'
  | 'morocco';

export type HighLatRule = 'auto' | 'middle' | 'seventh' | 'twilight';

export interface PrayerSettings {
  method: MethodKey;
  asrMadhab: 'standard' | 'hanafi';
  highLatRule: HighLatRule;
  /** Manual per-time adjustment in minutes, each within ±30. */
  offsetsMin: Partial<Record<TimeName, number>>;
}

export interface Coords {
  latitude: number;
  longitude: number;
}

/** A calendar date as seen in the user's local timezone. */
export interface LocalDate {
  year: number;
  month: number; // 1–12
  day: number;
}

export interface DayTimes extends Record<TimeName, Date> {
  /** True when a high-latitude or polar fallback changed at least one time. */
  estimated: boolean;
}

export interface ComputeOptions {
  /**
   * True during Ramadan. Umm al-Qura then sets Isha at 120 min after Maghrib instead
   * of 90. Deciding whether today is in Ramadan (official announcement or calendar)
   * is the caller's job.
   */
  ramadan?: boolean;
}

/** Umm al-Qura's Isha interval in Ramadan, in minutes. */
export const UMM_AL_QURA_RAMADAN_ISHA_INTERVAL = 120;

export const defaultSettings: PrayerSettings = {
  method: 'mwl',
  asrMadhab: 'standard',
  highLatRule: 'auto',
  offsetsMin: {},
};

/** Above this absolute latitude, `auto` switches to the twilight-angle rule. */
export const HIGH_LATITUDE_THRESHOLD = 48;
const MAX_OFFSET_MIN = 30;

const METHOD_FACTORIES: Record<MethodKey, () => CalculationParameters> = {
  mwl: () => CalculationMethod.MuslimWorldLeague(),
  isna: () => CalculationMethod.NorthAmerica(),
  egyptian: () => CalculationMethod.Egyptian(),
  umm_al_qura: () => CalculationMethod.UmmAlQura(),
  karachi: () => CalculationMethod.Karachi(),
  dubai: () => CalculationMethod.Dubai(),
  qatar: () => CalculationMethod.Qatar(),
  kuwait: () => CalculationMethod.Kuwait(),
  singapore: () => CalculationMethod.Singapore(),
  turkey: () => CalculationMethod.Turkey(),
  tehran: () => CalculationMethod.Tehran(),
  moonsighting: () => CalculationMethod.MoonsightingCommittee(),
  // UOIF: Fajr and Isha at 12° below the horizon.
  france_uoif: () => new CalculationParameters('Other', 12, 12),
  // Morocco (Ministry of Habous): Fajr 19°, Isha 17°, with the ministry's +5 min on Maghrib.
  morocco: () => {
    const p = new CalculationParameters('Other', 19, 17);
    p.methodAdjustments = { ...p.methodAdjustments, dhuhr: 5, maghrib: 5 };
    return p;
  },
};

const COUNTRY_DEFAULTS: Record<string, MethodKey> = {
  SA: 'umm_al_qura',
  YE: 'umm_al_qura',
  FR: 'france_uoif',
  MA: 'morocco',
  TR: 'turkey',
  US: 'isna',
  CA: 'isna',
  PK: 'karachi',
  IN: 'karachi',
  BD: 'karachi',
  AF: 'karachi',
  EG: 'egyptian',
  SD: 'egyptian',
  LY: 'egyptian',
  DZ: 'egyptian',
  AE: 'dubai',
  QA: 'qatar',
  KW: 'kuwait',
  SG: 'singapore',
  MY: 'singapore',
  ID: 'singapore',
  BN: 'singapore',
  IR: 'tehran',
};

export function defaultMethodForCountry(countryCode: string): MethodKey {
  return COUNTRY_DEFAULTS[countryCode.toUpperCase()] ?? 'mwl';
}

function assertCoords({ latitude, longitude }: Coords): void {
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw new RangeError(`latitude out of range: ${latitude}`);
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new RangeError(`longitude out of range: ${longitude}`);
  }
}

function assertOffsets(offsets: PrayerSettings['offsetsMin']): void {
  for (const [name, value] of Object.entries(offsets)) {
    if (value === undefined) continue;
    if (!Number.isInteger(value) || Math.abs(value) > MAX_OFFSET_MIN) {
      throw new RangeError(`offset for ${name} must be an integer within ±${MAX_OFFSET_MIN} min, got ${value}`);
    }
  }
}

const ADHAN_RULE = {
  middle: HighLatitudeRule.MiddleOfTheNight,
  seventh: HighLatitudeRule.SeventhOfTheNight,
  twilight: HighLatitudeRule.TwilightAngle,
} as const;

function resolveRule(rule: HighLatRule, latitude: number) {
  if (rule !== 'auto') return ADHAN_RULE[rule];
  return Math.abs(latitude) > HIGH_LATITUDE_THRESHOLD
    ? HighLatitudeRule.TwilightAngle
    : HighLatitudeRule.MiddleOfTheNight;
}

function buildParams(settings: PrayerSettings, rule: string): CalculationParameters {
  const params = METHOD_FACTORIES[settings.method]();
  params.madhab = settings.asrMadhab === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;
  params.highLatitudeRule = rule as CalculationParameters['highLatitudeRule'];
  params.polarCircleResolution = PolarCircleResolution.AqrabBalad;
  params.adjustments = {
    fajr: settings.offsetsMin.fajr ?? 0,
    sunrise: settings.offsetsMin.sunrise ?? 0,
    dhuhr: settings.offsetsMin.dhuhr ?? 0,
    asr: settings.offsetsMin.asr ?? 0,
    maghrib: settings.offsetsMin.maghrib ?? 0,
    isha: settings.offsetsMin.isha ?? 0,
  };
  return params;
}

function run(coords: Coords, date: LocalDate, params: CalculationParameters): PrayerTimes {
  // adhan reads the calendar fields of the Date; building it from components keeps
  // the result independent of the machine timezone.
  return new PrayerTimes(
    new Coordinates(coords.latitude, coords.longitude),
    new Date(date.year, date.month - 1, date.day),
    params,
  );
}

const DEG = Math.PI / 180;
const MS_PER_MIN = 60_000;

/** Solar declination (radians) at an instant, low-precision formula (±0.01°). */
export function solarDeclination(at: Date): number {
  const d = at.getTime() / 86_400_000 + 2440587.5 - 2451545.0;
  const g = (357.529 + 0.98560028 * d) * DEG;
  const q = 280.459 + 0.98564736 * d;
  const L = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * DEG;
  const e = (23.439 - 0.00000036 * d) * DEG;
  return Math.asin(Math.sin(e) * Math.sin(L));
}

function roundToMinute(at: Date, rounding: CalculationParameters['rounding']): Date {
  const ms = at.getTime();
  if (rounding === Rounding.None) return at;
  const minute = rounding === Rounding.Up ? Math.ceil(ms / MS_PER_MIN) : Math.round(ms / MS_PER_MIN);
  return new Date(minute * MS_PER_MIN);
}

/**
 * Asr computed with the sun's declination at the time of Asr itself (iterated), instead
 * of at the start of the day as adhan does. adhan's simplification drifts by 2–3 min in
 * spring and autumn and up to 7 min at high latitudes in winter.
 */
/** Unrounded solar noon with no adjustments. */
function solarTransit(coords: Coords, date: LocalDate): Date {
  const raw = new CalculationParameters('Other', 18, 17);
  raw.rounding = Rounding.None;
  return run(coords, date, raw).dhuhr;
}

/** Hour angle (hours) at which the sun reaches `altitudeDeg`, or null if it never does. */
function hourAngleHours(latitude: number, declination: number, altitudeDeg: number): number | null {
  const phi = latitude * DEG;
  const cosH =
    (Math.sin(altitudeDeg * DEG) - Math.sin(phi) * Math.sin(declination)) / (Math.cos(phi) * Math.cos(declination));
  if (cosH < -1 || cosH > 1) return null;
  return Math.acos(cosH) / DEG / 15;
}

const TOLERANCE_MS = 3 * MS_PER_MIN;

/**
 * True when Fajr or Isha is not the natural twilight time: the sun never reaches the
 * method's angle that night, or the high-latitude rule moved the time.
 */
function twilightAdjusted(coords: Coords, date: LocalDate, settings: PrayerSettings, params: CalculationParameters, t: PrayerTimes): boolean {
  if (settings.method === 'moonsighting') return false; // seasonal method with its own logic
  const transit = solarTransit(coords, date);
  const delta = solarDeclination(transit);
  const shift = (name: 'fajr' | 'isha') =>
    ((params.methodAdjustments[name] ?? 0) + (settings.offsetsMin[name] ?? 0)) * MS_PER_MIN;

  const fajrH = hourAngleHours(coords.latitude, delta, -params.fajrAngle);
  if (fajrH === null) return true;
  const naturalFajr = transit.getTime() - fajrH * 3_600_000;
  if (Math.abs(t.fajr.getTime() - shift('fajr') - naturalFajr) > TOLERANCE_MS) return true;

  if (!params.ishaInterval) {
    const ishaH = hourAngleHours(coords.latitude, delta, -params.ishaAngle);
    if (ishaH === null) return true;
    const naturalIsha = transit.getTime() + ishaH * 3_600_000;
    if (Math.abs(t.isha.getTime() - shift('isha') - naturalIsha) > TOLERANCE_MS) return true;
  }
  return false;
}

function preciseAsr(coords: Coords, date: LocalDate, settings: PrayerSettings, params: CalculationParameters): Date {
  const transit = solarTransit(coords, date);
  const shadow = settings.asrMadhab === 'hanafi' ? 2 : 1;
  const phi = coords.latitude * DEG;
  let at = new Date(transit.getTime() + 3 * 3_600_000);
  for (let i = 0; i < 3; i++) {
    const delta = solarDeclination(at);
    const altitude = Math.atan(1 / (shadow + Math.tan(Math.abs(phi - delta))));
    const cosH = (Math.sin(altitude) - Math.sin(phi) * Math.sin(delta)) / (Math.cos(phi) * Math.cos(delta));
    if (cosH < -1 || cosH > 1) return new Date(NaN);
    const hours = Math.acos(cosH) / DEG / 15;
    at = new Date(transit.getTime() + hours * 3_600_000);
  }
  const adjust = (params.methodAdjustments.asr ?? 0) + (settings.offsetsMin.asr ?? 0);
  return roundToMinute(new Date(at.getTime() + adjust * MS_PER_MIN), params.rounding);
}

export function computePrayerTimes(
  coords: Coords,
  date: LocalDate,
  settings: PrayerSettings,
  options: ComputeOptions = {},
): DayTimes {
  assertCoords(coords);
  assertOffsets(settings.offsetsMin);

  const rule = resolveRule(settings.highLatRule, coords.latitude);
  const params = buildParams(settings, rule);
  if (options.ramadan && settings.method === 'umm_al_qura') {
    params.ishaInterval = UMM_AL_QURA_RAMADAN_ISHA_INTERVAL;
  }
  const t = run(coords, date, params);

  // With AqrabBalad, adhan moves polar-circle dates to a nearer latitude. Detect it by
  // checking whether an unresolved computation yields no sunrise.
  const unresolvedParams = buildParams(settings, rule);
  unresolvedParams.polarCircleResolution = PolarCircleResolution.Unresolved;
  const unresolved = run(coords, date, unresolvedParams);
  const polar = Number.isNaN(unresolved.sunrise.getTime()) || Number.isNaN(unresolved.maghrib.getTime());

  const out: DayTimes = {
    fajr: t.fajr,
    sunrise: t.sunrise,
    dhuhr: t.dhuhr,
    // Polar dates keep adhan's value: it already substitutes a nearer latitude.
    asr: polar ? t.asr : preciseAsr(coords, date, settings, params),
    maghrib: t.maghrib,
    isha: t.isha,
    estimated: polar || twilightAdjusted(coords, date, settings, params, t),
  };
  for (const name of ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'] as const) {
    if (Number.isNaN(out[name].getTime())) {
      throw new Error(`could not compute ${name} for ${coords.latitude},${coords.longitude}`);
    }
  }
  return out;
}

/** The calendar date in `timeZone` at instant `at`. */
export function localDateIn(at: Date, timeZone: string): LocalDate {
  const z = toZonedTime(at, timeZone);
  return { year: z.getFullYear(), month: z.getMonth() + 1, day: z.getDate() };
}

export function addDays(d: LocalDate, days: number): LocalDate {
  const x = new Date(Date.UTC(d.year, d.month - 1, d.day + days));
  return { year: x.getUTCFullYear(), month: x.getUTCMonth() + 1, day: x.getUTCDate() };
}

/** Start of a local calendar day in `timeZone`, as an absolute instant. */
export function startOfLocalDay(d: LocalDate, timeZone: string): Date {
  const iso = `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}T00:00:00`;
  return fromZonedTime(iso, timeZone);
}

export interface NextPrayer {
  name: PrayerName;
  time: Date;
}

export function nextPrayer(
  now: Date,
  coords: Coords,
  settings: PrayerSettings,
  timeZone: string,
  options: ComputeOptions = {},
): NextPrayer {
  const today = localDateIn(now, timeZone);
  for (const date of [today, addDays(today, 1)]) {
    const times = computePrayerTimes(coords, date, settings, options);
    const next = PRAYER_ORDER.find((p) => times[p].getTime() > now.getTime());
    if (next) return { name: next, time: times[next] };
  }
  // Unreachable in practice: tomorrow's Isha is always after now.
  throw new Error('no upcoming prayer found');
}
