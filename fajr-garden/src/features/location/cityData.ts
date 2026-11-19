import { parseCities, type City } from '../../lib/cities';

let cache: City[] | null = null;

/**
 * The ~2 MB city dataset, parsed on first use only (city search, or labelling a GPS fix).
 * The require stays inside the function so the JSON module is not evaluated at startup.
 */
export function getCities(): City[] {
  if (!cache) {
    cache = parseCities(require('../../lib/cities/data/cities.json'));
  }
  return cache;
}
