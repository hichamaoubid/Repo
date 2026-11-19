/**
 * Offline city search over the bundled GeoNames dataset (CC BY 4.0).
 * Pure TypeScript: the dataset is passed in, so the 2 MB file is only loaded by the
 * screen that needs it.
 */

export interface City {
  /** Index in the dataset, stable for a given dataset version. */
  id: number;
  name: string;
  arabicNames: string[];
  otherNames: string[];
  latitude: number;
  longitude: number;
  /** ISO 3166-1 alpha-2 country code. */
  country: string;
  population: number;
  timeZone: string;
}

export interface CityDataset {
  version: number;
  timeZones: string[];
  cities: unknown[];
}

export const DATASET_VERSION = 1;
const MIN_QUERY_LENGTH = 2;

const ARABIC_LETTER_MAP: Record<string, string> = {
  'ة': 'ه', // ta marbuta → ha
  'ى': 'ي', // alef maqsura → ya
  'ک': 'ك', // Persian kaf → Arabic kaf
  'ی': 'ي', // Persian ya → Arabic ya
  'ٱ': 'ا', // alef wasla → alef
};

/**
 * Lowercase, strip Latin accents and Arabic diacritics (harakat, shadda, hamza
 * carriers via decomposition), unify Arabic letter variants, and collapse punctuation
 * into single spaces.
 */
export function normalizeForSearch(input: string): string {
  return input
    .normalize('NFD')
    .replace(/\p{M}/gu, '') // combining marks: Latin accents, harakat, hamza above/below
    .replace(/ـ/g, '') // tatweel
    .replace(/[ةىکیٱ]/g, (ch) => ARABIC_LETTER_MAP[ch] ?? ch)
    .toLowerCase()
    .replace(/[\s\-‐'’ʼ`.,()/]+/g, ' ')
    .trim();
}

function fail(message: string): never {
  throw new Error(`invalid city dataset: ${message}`);
}

const splitNames = (field: unknown): string[] => (typeof field === 'string' && field ? field.split('|') : []);

/** Validates and expands the compact dataset. Throws on any malformed row. */
export function parseCities(raw: unknown): City[] {
  const data = raw as Partial<CityDataset>;
  if (!data || data.version !== DATASET_VERSION) fail(`unsupported version ${String(data?.version)}`);
  if (!Array.isArray(data.timeZones) || !Array.isArray(data.cities)) fail('missing timeZones or cities');
  const timeZones = data.timeZones;

  return data.cities.map((row, id): City => {
    if (!Array.isArray(row) || row.length !== 8) fail(`row ${id} has the wrong shape`);
    const [name, arabic, other, lat, lng, country, population, tzIndex] = row as unknown[];
    if (typeof name !== 'string' || !name) fail(`row ${id} has no name`);
    if (typeof lat !== 'number' || typeof lng !== 'number' || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      fail(`row ${id} has invalid coordinates`);
    }
    if (typeof tzIndex !== 'number' || !Number.isInteger(tzIndex) || tzIndex < 0 || tzIndex >= timeZones.length) {
      fail(`row ${id} has an invalid time zone index`);
    }
    return {
      id,
      name,
      arabicNames: splitNames(arabic),
      otherNames: splitNames(other),
      latitude: lat,
      longitude: lng,
      country: typeof country === 'string' ? country : '',
      population: typeof population === 'number' ? population : 0,
      timeZone: timeZones[tzIndex] as string,
    };
  });
}

interface Keys {
  primary: string[]; // name and Arabic names
  alternate: string[]; // other spellings
}

// Normalized search keys, computed once per City object.
const keyCache = new WeakMap<City, Keys>();
function keysOf(city: City): Keys {
  let keys = keyCache.get(city);
  if (!keys) {
    const primary = [...new Set([city.name, ...city.arabicNames].map(normalizeForSearch))];
    const alternate = [...new Set(city.otherNames.map(normalizeForSearch))].filter((k) => !primary.includes(k));
    keys = { primary, alternate };
    keyCache.set(city, keys);
  }
  return keys;
}

const ARABIC_ARTICLE = 'ال';

/** 0 exact, 1 starts with, 2 a word starts with, 3 contains, null no match. */
function matchTier(key: string, query: string): number | null {
  if (key === query) return 0;
  if (key.startsWith(query)) return 1;
  for (const word of key.split(' ')) {
    if (word.startsWith(query)) return 2;
    if (word.startsWith(ARABIC_ARTICLE) && word.slice(ARABIC_ARTICLE.length).startsWith(query)) return 2;
  }
  return key.includes(query) ? 3 : null;
}

export interface SearchOptions {
  limit?: number;
  /** ISO country code ranked first within the same match tier (e.g. the device region). */
  preferCountry?: string;
}

function bestTier(keys: readonly string[], query: string): number | null {
  let best: number | null = null;
  for (const key of keys) {
    const tier = matchTier(key, query);
    if (tier !== null && (best === null || tier < best)) best = tier;
    if (best === 0) break;
  }
  return best;
}

/**
 * Rank of a city for an already-normalized query (lower is better), or null when it
 * does not match. Order: match tier, then main name over alternate spelling, then the
 * preferred country.
 */
export function rankCity(city: City, normalizedQuery: string, preferCountry?: string): number | null {
  const { primary, alternate } = keysOf(city);
  const primaryTier = bestTier(primary, normalizedQuery);
  const alternateTier = bestTier(alternate, normalizedQuery);
  let tier: number;
  let alternatePenalty: number;
  if (primaryTier !== null && (alternateTier === null || primaryTier <= alternateTier)) {
    tier = primaryTier;
    alternatePenalty = 0;
  } else if (alternateTier !== null) {
    tier = alternateTier;
    alternatePenalty = 1;
  } else {
    return null;
  }
  const countryPenalty = preferCountry && city.country !== preferCountry.toUpperCase() ? 1 : 0;
  return tier * 4 + alternatePenalty * 2 + countryPenalty;
}

/**
 * Ranked search (see rankCity); ties keep population order, as the dataset is sorted
 * by population, largest first.
 */
export function searchCities(cities: readonly City[], query: string, options: SearchOptions = {}): City[] {
  const q = normalizeForSearch(query);
  if (q.length < MIN_QUERY_LENGTH) return [];
  const limit = options.limit ?? 20;

  const hits: { city: City; rank: number }[] = [];
  for (const city of cities) {
    const rank = rankCity(city, q, options.preferCountry);
    if (rank !== null) hits.push({ city, rank });
  }
  // Array.prototype.sort is stable, so population order survives within a rank.
  hits.sort((a, b) => a.rank - b.rank);
  return hits.slice(0, limit).map((h) => h.city);
}

const toRad = (d: number) => (d * Math.PI) / 180;

/** Great-circle distance in km (haversine). Longitudes may be outside ±180. */
export function distanceKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * The city to show for a position, used to label a GPS fix when reverse geocoding is
 * unavailable. GeoNames lists districts (e.g. Paris arrondissements) as separate places,
 * so cities within (2 × the nearest distance + 1 km) compete, and the most populous
 * wins: central Paris is labelled "Paris", while someone standing in a suburb keeps the
 * suburb's name because no bigger place is that close.
 */
export function nearestCity(cities: readonly City[], at: { latitude: number; longitude: number }): City | null {
  if (cities.length === 0) return null;
  const withDistance = cities.map((city) => ({ city, km: distanceKm(at, city) }));
  const nearestKm = Math.min(...withDistance.map((c) => c.km));
  const limitKm = nearestKm * 2 + 1;
  let best: City | null = null;
  for (const { city, km } of withDistance) {
    if (km <= limitKm && (!best || city.population > best.population)) best = city;
  }
  return best;
}
