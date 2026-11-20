// Builds the offline city dataset from GeoNames (CC BY 4.0, https://www.geonames.org).
// Usage:
//   curl -LO https://download.geonames.org/export/dump/cities15000.zip && unzip cities15000.zip
//   node scripts/build-cities.mjs path/to/cities15000.txt
// Output: src/lib/cities/data/cities.json, sorted by population (largest first).
import { readFileSync, writeFileSync } from 'node:fs';

const input = process.argv[2];
if (!input) {
  console.error('usage: node scripts/build-cities.mjs <cities15000.txt>');
  process.exit(1);
}

const ARABIC = /[؀-ۿ]/;
const CODE = /^[A-Z0-9]{2,4}$/; // airport / admin codes such as "CAI"
const MAX_LATIN_ALTS = 15;
const LATIN_ALTS_MIN_POPULATION = 500_000;

const tzIndex = new Map();
const cities = [];
for (const line of readFileSync(input, 'utf8').split('\n')) {
  if (!line) continue;
  const f = line.split('\t');
  const [name, alternates, lat, lng, featureCode, country, population, timeZone] = [f[1], f[3], f[4], f[5], f[7], f[8], f[14], f[17]];
  if (!name || !timeZone) continue;
  // PPLX = section of a populated place (arrondissements, neighbourhoods): not a city to pick.
  if (featureCode === 'PPLX') continue;
  const alts = alternates ? alternates.split(',').filter(Boolean) : [];
  const arabic = [...new Set(alts.filter((a) => ARABIC.test(a)))].slice(0, 3);
  const pop = Number(population) || 0;
  const latin =
    pop >= LATIN_ALTS_MIN_POPULATION
      ? [...new Set(alts.filter((a) => !ARABIC.test(a) && !CODE.test(a) && a !== name && /^[\p{Script=Latin}\s'’-]+$/u.test(a)))].slice(0, MAX_LATIN_ALTS)
      : [];
  if (!tzIndex.has(timeZone)) tzIndex.set(timeZone, tzIndex.size);
  cities.push([name, arabic.join('|'), latin.join('|'), Math.round(Number(lat) * 1000) / 1000, Math.round(Number(lng) * 1000) / 1000, country, pop, tzIndex.get(timeZone)]);
}
cities.sort((a, b) => b[6] - a[6]);

const out = {
  version: 1,
  source: 'GeoNames cities15000',
  license: 'CC BY 4.0, https://creativecommons.org/licenses/by/4.0/',
  fields: ['name', 'arabicNames', 'otherNames', 'lat', 'lng', 'country', 'population', 'timeZoneIndex'],
  timeZones: [...tzIndex.keys()],
  cities,
};
const target = new URL('../src/lib/cities/data/cities.json', import.meta.url);
writeFileSync(target, JSON.stringify(out));
console.log(`wrote ${cities.length} cities, ${tzIndex.size} time zones`);
