import { formatInTimeZone } from 'date-fns-tz';
import reference from '../__fixtures__/aladhan-reference.json';
import { bruteForceAsr } from './helpers/noaaAsr';
import {
  computePrayerTimes,
  defaultMethodForCountry,
  defaultSettings,
  nextPrayer,
  PRAYER_ORDER,
  type MethodKey,
  type PrayerSettings,
} from '..';

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};
const localHHMM = (d: Date, tz: string) => formatInTimeZone(d, tz, 'HH:mm');
const diffMinutes = (a: string, b: string) => {
  const raw = Math.abs(toMinutes(a) - toMinutes(b));
  return Math.min(raw, 1440 - raw); // tolerate wrap around midnight
};

/**
 * Documented, intentional differences from the AlAdhan reference, in minutes (ours − ref).
 * adhan applies the official precautionary adjustments (ihtiyat) published by these
 * authorities; AlAdhan's methods 11 and 16 do not.
 */
const KNOWN_ADJUSTMENTS: Partial<Record<MethodKey, Partial<Record<string, number>>>> = {
  dubai: { sunrise: -3, asr: 3 },
  singapore: { dhuhr: 1 },
};
/** Ramadan: Umm al-Qura extends Isha to 120 min after Maghrib (tracked in FR-022). */
const isRamadanUmmAlQura = (c: { method: string; date: string }) => c.method === 'umm_al_qura' && c.date === '2026-03-08';

const settingsFor = (method: MethodKey): PrayerSettings => ({ ...defaultSettings, method });

describe('computePrayerTimes — cross-check against AlAdhan reference fixture', () => {
  // Asr is checked separately against an astronomical brute-force oracle: AlAdhan takes
  // the sun's declination at a fixed hour and drifts by up to 4 min at high latitudes.
  const PRAYERS = ['fajr', 'sunrise', 'dhuhr', 'maghrib', 'isha'] as const;
  const deltas: number[] = [];

  const cases = reference.cases.filter((c) => !isRamadanUmmAlQura(c));

  it('Umm al-Qura: Isha is 120 min after Maghrib during Ramadan (FR-022)', () => {
    const c = reference.cases.find(isRamadanUmmAlQura)!;
    const times = computePrayerTimes({ latitude: c.lat, longitude: c.lng }, { year: 2026, month: 3, day: 8 }, settingsFor('umm_al_qura'), { ramadan: true });
    expect(diffMinutes(localHHMM(times.isha, c.tz), c.times.isha)).toBeLessThanOrEqual(1);
    expect(times.isha.getTime() - times.maghrib.getTime()).toBe(120 * 60_000);
  });

  it('the Ramadan flag only changes Umm al-Qura Isha', () => {
    const date = { year: 2026, month: 3, day: 8 };
    const cairo = { latitude: 30.0444, longitude: 31.2357 };
    const normal = computePrayerTimes(cairo, date, settingsFor('egyptian'));
    const ramadan = computePrayerTimes(cairo, date, settingsFor('egyptian'), { ramadan: true });
    expect(ramadan.isha.getTime()).toBe(normal.isha.getTime());
    const mecca = { latitude: 21.4225, longitude: 39.8262 };
    const outside = computePrayerTimes(mecca, date, settingsFor('umm_al_qura'));
    expect(outside.isha.getTime() - outside.maghrib.getTime()).toBe(90 * 60_000);
  });

  it.each(cases.map((c) => [`${c.city} ${c.date} (${c.method})`, c] as const))(
    '%s is within 2 minutes for every prayer',
    (_label, c) => {
      const [y, m, d] = c.date.split('-').map(Number) as [number, number, number];
      const times = computePrayerTimes(
        { latitude: c.lat, longitude: c.lng },
        { year: y, month: m, day: d },
        settingsFor(c.method as MethodKey),
      );
      for (const p of PRAYERS) {
        const known = KNOWN_ADJUSTMENTS[c.method as MethodKey]?.[p] ?? 0;
        const delta = diffMinutes(localHHMM(new Date(times[p].getTime() - known * 60_000), c.tz), c.times[p]);
        deltas.push(delta);
        expect({ prayer: p, withinTwoMinutes: delta <= 2 }).toEqual({ prayer: p, withinTwoMinutes: true });
      }
    },
  );

  it('is within 1 minute for at least 95% of all prayer values', () => {
    expect(deltas.length).toBe(cases.length * PRAYERS.length);
    const withinOne = deltas.filter((x) => x <= 1).length / deltas.length;
    expect(withinOne).toBeGreaterThanOrEqual(0.95);
  });
});

describe('computePrayerTimes — Asr against a brute-force astronomical oracle', () => {
  const cases = reference.cases;
  // Official precautionary minutes added on top of astronomical Asr.
  const ASR_METHOD_ADJ: Partial<Record<MethodKey, number>> = { turkey: 4, dubai: 3 };

  it.each(cases.map((c) => [`${c.city} ${c.date}`, c] as const))('%s Asr is within 1 minute', (_l, c) => {
    const [y, m, d] = c.date.split('-').map(Number) as [number, number, number];
    const ours = computePrayerTimes({ latitude: c.lat, longitude: c.lng }, { year: y, month: m, day: d }, settingsFor(c.method as MethodKey));
    const oracle = new Date(bruteForceAsr(y, m, d, c.lat, c.lng).getTime() + (ASR_METHOD_ADJ[c.method as MethodKey] ?? 0) * 60_000);
    // ours is rounded to the minute (Singapore rounds up), so allow 1 min + rounding.
    expect(Math.abs(ours.asr.getTime() - oracle.getTime())).toBeLessThanOrEqual(90_000);
  });

  it('Hanafi Asr matches the oracle with a shadow factor of 2', () => {
    const ours = computePrayerTimes({ latitude: 24.8607, longitude: 67.0011 }, { year: 2026, month: 6, day: 21 }, { ...settingsFor('karachi'), asrMadhab: 'hanafi' });
    const oracle = bruteForceAsr(2026, 6, 21, 24.8607, 67.0011, 2);
    expect(Math.abs(ours.asr.getTime() - oracle.getTime())).toBeLessThanOrEqual(90_000);
  });
});

describe('computePrayerTimes — invariants', () => {
  const paris = { latitude: 48.8566, longitude: 2.3522 };

  it('returns prayers in chronological order', () => {
    const t = computePrayerTimes(paris, { year: 2026, month: 5, day: 10 }, settingsFor('mwl'));
    const seq = [t.fajr, t.sunrise, t.dhuhr, t.asr, t.maghrib, t.isha].map((d) => d.getTime());
    expect([...seq].sort((a, b) => a - b)).toEqual(seq);
  });

  it('applies per-prayer minute offsets', () => {
    const date = { year: 2026, month: 5, day: 10 };
    const base = computePrayerTimes(paris, date, settingsFor('mwl'));
    const shifted = computePrayerTimes(paris, date, {
      ...settingsFor('mwl'),
      offsetsMin: { fajr: 5, isha: -10 },
    });
    expect(shifted.fajr.getTime() - base.fajr.getTime()).toBe(5 * 60_000);
    expect(shifted.isha.getTime() - base.isha.getTime()).toBe(-10 * 60_000);
    expect(shifted.dhuhr.getTime()).toBe(base.dhuhr.getTime());
  });

  it('rejects offsets outside ±30 minutes', () => {
    expect(() =>
      computePrayerTimes(paris, { year: 2026, month: 5, day: 10 }, {
        ...settingsFor('mwl'),
        offsetsMin: { fajr: 31 },
      }),
    ).toThrow(RangeError);
  });

  it('Hanafi Asr is later than standard Asr', () => {
    const date = { year: 2026, month: 5, day: 10 };
    const std = computePrayerTimes(paris, date, settingsFor('mwl'));
    const hanafi = computePrayerTimes(paris, date, { ...settingsFor('mwl'), asrMadhab: 'hanafi' });
    expect(hanafi.asr.getTime()).toBeGreaterThan(std.asr.getTime());
  });

  it('rejects invalid coordinates', () => {
    expect(() =>
      computePrayerTimes({ latitude: 91, longitude: 0 }, { year: 2026, month: 1, day: 1 }, defaultSettings),
    ).toThrow(RangeError);
  });
});

describe('computePrayerTimes — high latitudes', () => {
  const tromso = { latitude: 69.6492, longitude: 18.9553 };
  const oslo = { latitude: 59.9139, longitude: 10.7522 };

  it('produces valid times in Oslo at the summer solstice (no true night) and flags them estimated', () => {
    const t = computePrayerTimes(oslo, { year: 2026, month: 6, day: 21 }, settingsFor('mwl'));
    for (const p of ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'] as const) {
      expect(Number.isNaN(t[p].getTime())).toBe(false);
    }
    expect(t.estimated).toBe(true);
  });

  it('does not flag ordinary mid-latitude days as estimated', () => {
    const t = computePrayerTimes({ latitude: 30.0444, longitude: 31.2357 }, { year: 2026, month: 6, day: 21 }, settingsFor('egyptian'));
    expect(t.estimated).toBe(false);
  });

  it.each([
    ['polar day', { year: 2026, month: 6, day: 21 }],
    ['polar night', { year: 2026, month: 12, day: 21 }],
  ])('falls back to the nearest valid latitude in Tromsø during %s', (_label, date) => {
    const t = computePrayerTimes(tromso, date, settingsFor('mwl'));
    const seq = [t.fajr, t.sunrise, t.dhuhr, t.asr, t.maghrib, t.isha].map((d) => d.getTime());
    seq.forEach((ms) => expect(Number.isNaN(ms)).toBe(false));
    expect([...seq].sort((a, b) => a - b)).toEqual(seq);
    expect(t.estimated).toBe(true);
  });
});

describe('nextPrayer', () => {
  const paris = { latitude: 48.8566, longitude: 2.3522 };
  const tz = 'Europe/Paris';

  it('returns the next prayer later the same day', () => {
    const now = new Date('2026-05-10T10:00:00Z'); // 12:00 in Paris, before Dhuhr (~13:50)
    const n = nextPrayer(now, paris, settingsFor('france_uoif'), tz);
    expect(n.name).toBe('dhuhr');
    expect(n.time.getTime()).toBeGreaterThan(now.getTime());
  });

  it("rolls over to tomorrow's Fajr after Isha", () => {
    const now = new Date('2026-05-10T22:30:00Z'); // 00:30 on 11 May in Paris
    const n = nextPrayer(now, paris, settingsFor('france_uoif'), tz);
    expect(n.name).toBe('fajr');
    expect(formatInTimeZone(n.time, tz, 'yyyy-MM-dd')).toBe('2026-05-11');
  });

  it('passes the Ramadan option through, so Umm al-Qura Isha is not announced early', () => {
    const mecca = { latitude: 21.4225, longitude: 39.8262 };
    const t = computePrayerTimes(mecca, { year: 2026, month: 3, day: 8 }, settingsFor('umm_al_qura'));
    const now = new Date(t.maghrib.getTime() + 100 * 60_000); // after the normal 90 min, before 120
    expect(nextPrayer(now, mecca, settingsFor('umm_al_qura'), 'Asia/Riyadh').name).toBe('fajr');
    const n = nextPrayer(now, mecca, settingsFor('umm_al_qura'), 'Asia/Riyadh', { ramadan: true });
    expect(n.name).toBe('isha');
    expect(n.time.getTime() - t.maghrib.getTime()).toBe(120 * 60_000);
  });

  it('uses the local date of the given timezone, not the machine timezone', () => {
    // 23:30 UTC on 10 May is already 11 May in Dubai
    const n = nextPrayer(new Date('2026-05-10T23:30:00Z'), { latitude: 25.2048, longitude: 55.2708 }, settingsFor('dubai'), 'Asia/Dubai');
    // 03:30 local in Dubai: Fajr of 11 May has not started yet.
    expect(formatInTimeZone(n.time, 'Asia/Dubai', 'yyyy-MM-dd')).toBe('2026-05-11');
    expect(n.name).toBe('fajr');
  });
});

describe('defaultMethodForCountry', () => {
  it.each([
    ['SA', 'umm_al_qura'],
    ['FR', 'france_uoif'],
    ['MA', 'morocco'],
    ['TR', 'turkey'],
    ['US', 'isna'],
    ['CA', 'isna'],
    ['PK', 'karachi'],
    ['EG', 'egyptian'],
    ['AE', 'dubai'],
    ['QA', 'qatar'],
    ['KW', 'kuwait'],
    ['SG', 'singapore'],
    ['IR', 'tehran'],
    ['GB', 'mwl'],
    ['ZZ', 'mwl'],
  ])('%s → %s', (cc, method) => {
    expect(defaultMethodForCountry(cc)).toBe(method);
  });

  it('is case-insensitive', () => {
    expect(defaultMethodForCountry('fr')).toBe('france_uoif');
  });
});

describe('PRAYER_ORDER', () => {
  it('lists the five obligatory prayers', () => {
    expect(PRAYER_ORDER).toEqual(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']);
  });
});
