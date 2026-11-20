/**
 * Independent test oracle for Asr: NOAA solar position (Meeus-based) and a brute-force
 * search for the instant when shadow length = shadowFactor × height + noon shadow.
 * Deliberately shares no code with the production implementation.
 */
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

function solarAltitude(at: Date, lat: number, lng: number): number {
  const jd = at.getTime() / 86_400_000 + 2440587.5;
  const T = (jd - 2451545) / 36525;
  const L0 = (280.46646 + T * (36000.76983 + T * 0.0003032)) % 360;
  const M = rad(357.52911 + T * (35999.05029 - 0.0001537 * T));
  const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
  const C =
    Math.sin(M) * (1.914602 - T * (0.004817 + 0.000014 * T)) +
    Math.sin(2 * M) * (0.019993 - 0.000101 * T) +
    Math.sin(3 * M) * 0.000289;
  const omega = rad(125.04 - 1934.136 * T);
  const lambda = rad(L0 + C - 0.00569 - 0.00478 * Math.sin(omega));
  const eps = rad(23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60 + 0.00256 * Math.cos(omega));
  const dec = Math.asin(Math.sin(eps) * Math.sin(lambda));
  const y = Math.tan(eps / 2) ** 2;
  const L0r = rad(L0);
  const eot =
    4 *
    deg(
      y * Math.sin(2 * L0r) -
        2 * e * Math.sin(M) +
        4 * e * y * Math.sin(M) * Math.cos(2 * L0r) -
        0.5 * y * y * Math.sin(4 * L0r) -
        1.25 * e * e * Math.sin(2 * M),
    );
  const minutesUtc = at.getUTCHours() * 60 + at.getUTCMinutes() + at.getUTCSeconds() / 60;
  const ha = rad((minutesUtc + eot + 4 * lng) / 4 - 180);
  return Math.asin(Math.sin(rad(lat)) * Math.sin(dec) + Math.cos(rad(lat)) * Math.cos(dec) * Math.cos(ha));
}

/** Asr for the UTC day that contains local noon at `lng`, with 10-second resolution. */
export function bruteForceAsr(year: number, month: number, day: number, lat: number, lng: number, shadowFactor = 1): Date {
  const start = Date.UTC(year, month - 1, day) - (lng / 15) * 3_600_000; // local-solar midnight
  const STEP = 10_000;
  let noon = start;
  let best = -Infinity;
  for (let t = start; t < start + 86_400_000; t += STEP) {
    const a = solarAltitude(new Date(t), lat, lng);
    if (a > best) {
      best = a;
      noon = t;
    }
  }
  const target = shadowFactor + 1 / Math.tan(best);
  for (let t = noon; t < start + 86_400_000; t += STEP) {
    const a = solarAltitude(new Date(t), lat, lng);
    if (a > 0 && 1 / Math.tan(a) >= target) return new Date(t);
  }
  throw new Error('sun never reaches Asr altitude');
}
