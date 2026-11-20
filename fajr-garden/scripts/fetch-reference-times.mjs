// Fetches reference prayer times from the AlAdhan API (an independent implementation)
// and writes them as a Jest fixture. Run manually: node scripts/fetch-reference-times.mjs
// The fixture is committed so tests never hit the network.
import { writeFile } from 'node:fs/promises';

// [key, lat, lng, tz, ourMethod, aladhanMethodId]
const CITIES = [
  ['mecca', 21.4225, 39.8262, 'Asia/Riyadh', 'umm_al_qura', 4],
  ['istanbul', 41.0082, 28.9784, 'Europe/Istanbul', 'turkey', 13],
  ['paris', 48.8566, 2.3522, 'Europe/Paris', 'france_uoif', 12],
  ['lyon', 45.764, 4.8357, 'Europe/Paris', 'france_uoif', 12],
  ['casablanca', 33.5731, -7.5898, 'Africa/Casablanca', 'morocco', 21],
  ['cairo', 30.0444, 31.2357, 'Africa/Cairo', 'egyptian', 5],
  ['karachi', 24.8607, 67.0011, 'Asia/Karachi', 'karachi', 1],
  ['toronto', 43.6532, -79.3832, 'America/Toronto', 'isna', 2],
  ['new_york', 40.7128, -74.006, 'America/New_York', 'isna', 2],
  ['london', 51.5074, -0.1278, 'Europe/London', 'mwl', 3],
  ['singapore', 1.3521, 103.8198, 'Asia/Singapore', 'singapore', 11],
  ['dubai', 25.2048, 55.2708, 'Asia/Dubai', 'dubai', 16],
  ['doha', 25.2854, 51.531, 'Asia/Qatar', 'qatar', 10],
  ['kuwait', 29.3759, 47.9774, 'Asia/Kuwait', 'kuwait', 9],
  ['tehran', 35.6892, 51.389, 'Asia/Tehran', 'tehran', 7],
  ['oslo', 59.9139, 10.7522, 'Europe/Oslo', 'mwl', 3],
];
// Outside Ramadan 1447/1448 (Umm al-Qura adds 30 min to Isha in Ramadan), incl. solstices,
// equinox and the EU / US DST switch days.
const DATES = ['2026-01-15', '2026-03-08', '2026-03-29', '2026-06-21', '2026-09-22', '2026-12-21'];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function fetchWithRetry(url, attempts = 6) {
  for (let i = 0; i < attempts; i++) {
    await sleep(700); // stay under the public rate limit
    const res = await fetch(url);
    if (res.ok) return res;
    if (res.status !== 429 && res.status < 500) throw new Error(`${res.status} for ${url}`);
    await sleep(2000 * 2 ** i);
  }
  throw new Error(`gave up on ${url}`);
}

const out = { source: 'https://api.aladhan.com/v1/timings', fetchedAt: new Date().toISOString(), cases: [] };
for (const [city, lat, lng, tz, method, id] of CITIES) {
  for (const date of DATES) {
    const [y, m, d] = date.split('-');
    // latitudeAdjustmentMethod=3 (angle based) matches our 'auto' rule above 48°.
    const url = `https://api.aladhan.com/v1/timings/${d}-${m}-${y}?latitude=${lat}&longitude=${lng}&method=${id}&school=0&latitudeAdjustmentMethod=3&timezonestring=${encodeURIComponent(tz)}`;
    const res = await fetchWithRetry(url);
    const { data } = await res.json();
    const t = data.timings;
    const strip = (s) => s.slice(0, 5);
    out.cases.push({
      city, lat, lng, tz, method, date,
      times: { fajr: strip(t.Fajr), sunrise: strip(t.Sunrise), dhuhr: strip(t.Dhuhr), asr: strip(t.Asr), maghrib: strip(t.Maghrib), isha: strip(t.Isha) },
    });
  }
}
const target = new URL('../src/lib/prayer/__fixtures__/aladhan-reference.json', import.meta.url);
await writeFile(target, JSON.stringify(out, null, 2) + '\n');
console.log(`wrote ${out.cases.length} cases`);
