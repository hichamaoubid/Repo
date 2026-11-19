import dataset from '../data/cities.json';
import { nearestCity, normalizeForSearch, parseCities, rankCity, searchCities, type City } from '..';

const cities = parseCities(dataset);
const top = (query: string, opts?: Parameters<typeof searchCities>[2]) => searchCities(cities, query, opts)[0];

describe('normalizeForSearch', () => {
  it.each([
    ['Fès', 'fes'],
    ['Saint-Étienne', 'saint etienne'],
    ['  CASABLANCA  ', 'casablanca'],
    ['Ad Dār al Bayḑā’', 'ad dar al bayda'],
  ])('Latin: %s → %s', (input, expected) => {
    expect(normalizeForSearch(input)).toBe(expected);
  });

  it.each([
    ['القَاهِرَة', 'القاهره'], // harakat removed, ta marbuta → ha
    ['أكادير', 'اكادير'], // hamza on alef → alef
    ['مكّة', 'مكه'], // shadda removed
    ['مستشفى', 'مستشفي'], // alef maqsura → ya
    ['مراکش', 'مراكش'], // Persian kaf → Arabic kaf
    ['طنـــجة', 'طنجه'], // tatweel removed
  ])('Arabic: %s → %s', (input, expected) => {
    expect(normalizeForSearch(input)).toBe(expected);
  });
});

describe('parseCities', () => {
  it('loads every city with a valid time zone and coordinates', () => {
    expect(cities.length).toBeGreaterThan(30_000);
    for (const c of cities) {
      expect(Math.abs(c.latitude)).toBeLessThanOrEqual(90);
      expect(Math.abs(c.longitude)).toBeLessThanOrEqual(180);
      expect(c.timeZone).toMatch(/^[A-Za-z_]+\/[A-Za-z_\-/+0-9]+$|^UTC$/);
    }
  });

  it('rejects a dataset with an unknown version', () => {
    expect(() => parseCities({ ...dataset, version: 99 })).toThrow(/version/);
  });

  it('rejects rows with an out-of-range time zone index', () => {
    const broken = { ...dataset, cities: [['X', '', '', 0, 0, 'ZZ', 1, 9999]] };
    expect(() => parseCities(broken)).toThrow(/time zone/);
  });
});

describe('searchCities', () => {
  it('finds a city by its exact name', () => {
    expect(top('Rabat')).toMatchObject({ name: 'Rabat', country: 'MA', timeZone: 'Africa/Casablanca' });
  });

  it('ignores accents and case', () => {
    expect(top('fès')).toMatchObject({ name: 'Fes', country: 'MA' });
    expect(top('FES')).toMatchObject({ name: 'Fes', country: 'MA' });
  });

  it('finds cities by their Arabic names, with or without diacritics or the article', () => {
    expect(top('القاهرة')?.name).toBe('Cairo');
    expect(top('الرِّيَاض')?.name).toBe('Riyadh');
    expect(top('مراكش')?.name).toBe('Marrakesh');
    expect(top('الدار البيضاء')?.name).toBe('Casablanca');
  });

  it('finds cities by common alternate spellings', () => {
    expect(top('Marrakech')?.name).toBe('Marrakesh');
    expect(top('Mecca')?.name).toBe('Makkah');
    expect(top('La Mecque')?.name).toBe('Makkah');
    expect(top('Caire')?.name).toBe('Cairo');
  });

  it('matches prefixes as the user types, largest city first', () => {
    expect(top('casa')).toMatchObject({ name: 'Casablanca', country: 'MA' });
    expect(top('par')?.name).toBe('Paris');
  });

  it('returns results in non-decreasing rank order', () => {
    for (const q of ['paris', 'fes', 'القاهرة', 'saint']) {
      const ranks = searchCities(cities, q, { limit: 50 }).map((c) => rankCity(c, normalizeForSearch(q)) as number);
      expect([...ranks].sort((a, b) => a - b)).toEqual(ranks);
    }
  });

  it('ranks a main-name match above a match on an alternate spelling of the same tier', () => {
    const paris = cities.find((c) => c.name === 'Paris' && c.country === 'FR') as City;
    const perth = cities.find((c) => c.name === 'Perth' && c.country === 'AU') as City;
    expect(rankCity(paris, 'par')).toBeLessThan(rankCity(perth, 'par') ?? Infinity);
  });

  it('boosts the preferred country within the same match tier', () => {
    // "Casablanca" also exists in Chile; with a Chilean preference it comes first
    expect(top('Casablanca', { preferCountry: 'CL' })).toMatchObject({ country: 'CL' });
    expect(top('Casablanca')).toMatchObject({ country: 'MA' });
  });

  it('respects the limit and returns nothing for queries under 2 characters', () => {
    expect(searchCities(cities, 'sa', { limit: 5 })).toHaveLength(5);
    expect(searchCities(cities, 'a')).toEqual([]);
    expect(searchCities(cities, '   ')).toEqual([]);
  });

  it('returns stable ids usable for storage', () => {
    const rabat = top('Rabat') as City;
    expect(cities[rabat.id]).toBe(rabat);
  });

  it('searches the whole dataset in under 50 ms', () => {
    const t0 = performance.now();
    for (const q of ['fes', 'القاهرة', 'saint', 'xyzq']) searchCities(cities, q);
    expect((performance.now() - t0) / 4).toBeLessThan(50);
  });
});

describe('nearestCity', () => {
  it.each([
    [{ latitude: 48.8566, longitude: 2.3522 }, 'Paris'],
    [{ latitude: 34.02, longitude: -6.84 }, 'Rabat'],
    [{ latitude: 21.42, longitude: 39.83 }, 'Makkah'],
  ])('%j → %s', (coords, name) => {
    expect(nearestCity(cities, coords)?.name).toBe(name);
  });

  it('labels a suburb with its own name, not the big city 9 km away', () => {
    expect(nearestCity(cities, { latitude: 48.936, longitude: 2.357 })?.name).toBe('Saint-Denis');
  });

  it('handles the antimeridian (Fiji, longitude 179.9 vs -179.9)', () => {
    const suva = cities.find((c) => c.name === 'Suva') as City;
    expect(nearestCity(cities, { latitude: suva.latitude, longitude: suva.longitude - 360 + 0.01 })?.name).toBe('Suva');
  });

  it('returns null for an empty list', () => {
    expect(nearestCity([], { latitude: 0, longitude: 0 })).toBeNull();
  });
});
