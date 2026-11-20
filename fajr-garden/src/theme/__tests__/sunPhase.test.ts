import { computePrayerTimes, defaultSettings } from '../../lib/prayer';
import { contrastRatio, PALETTES, paletteAt, PHASE_ORDER, sunPhaseAt, TRANSITION_MS, type Palette } from '../sunPhase';

const paris = { latitude: 48.8566, longitude: 2.3522 };
const times = computePrayerTimes(paris, { year: 2026, month: 5, day: 10 }, { ...defaultSettings, method: 'france_uoif' });
const at = (d: Date, minutes: number) => new Date(d.getTime() + minutes * 60_000);

const assertReadable = (p: Palette, label: string) => {
  expect({ label, pair: 'text/background', ok: contrastRatio(p.text, p.background) >= 4.5 }).toEqual({ label, pair: 'text/background', ok: true });
  expect({ label, pair: 'textMuted/background', ok: contrastRatio(p.textMuted, p.background) >= 4.5 }).toEqual({ label, pair: 'textMuted/background', ok: true });
  expect({ label, pair: 'text/surface', ok: contrastRatio(p.text, p.surface) >= 4.5 }).toEqual({ label, pair: 'text/surface', ok: true });
  expect({ label, pair: 'onAccent/accent', ok: contrastRatio(p.onAccent, p.accent) >= 4.5 }).toEqual({ label, pair: 'onAccent/accent', ok: true });
};

describe('contrastRatio', () => {
  it('matches WCAG reference values', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#777777', '#FFFFFF')).toBeCloseTo(4.48, 2);
  });
});

describe('sunPhaseAt', () => {
  it.each([
    [at(times.fajr, -60), 'isha'],
    [at(times.fajr, 30), 'fajr'],
    [at(times.sunrise, 60), 'shuruq'],
    [at(times.dhuhr, 30), 'dhuhr'],
    [at(times.asr, 30), 'asr'],
    [at(times.maghrib, 30), 'maghrib'],
    [at(times.isha, 30), 'isha'],
  ] as const)('%s → %s', (now, phase) => {
    expect(sunPhaseAt(now, times).phase).toBe(phase);
  });

  it('blends across a window centred on each transition', () => {
    expect(sunPhaseAt(at(times.dhuhr, -TRANSITION_MS / 2 / 60_000), times).blend).toBe(0);
    expect(sunPhaseAt(times.dhuhr, times)).toEqual({ phase: 'dhuhr', previous: 'shuruq', blend: 0.5 });
    expect(sunPhaseAt(at(times.dhuhr, 30), times).blend).toBe(1);
  });
});

describe('palettes', () => {
  it.each(PHASE_ORDER)('%s palette meets WCAG AA (4.5:1) for every text pair', (phase) => {
    assertReadable(PALETTES[phase], phase);
  });

  it('stays readable at every point of every transition', () => {
    const transitions = [times.fajr, times.sunrise, times.dhuhr, times.asr, times.maghrib, times.isha];
    for (const t of transitions) {
      for (let s = -10; s <= 10; s += 1) {
        const now = at(t, s);
        assertReadable(paletteAt(now, times), `${t.toISOString()} ${s}min`);
      }
    }
  });

  it('switches between dark and light palettes at the transition instant, without a mid tone', () => {
    expect(paletteAt(at(times.sunrise, -1), times)).toEqual(PALETTES.fajr);
    expect(paletteAt(times.sunrise, times)).toEqual(PALETTES.shuruq);
    expect(paletteAt(at(times.maghrib, -1), times)).toEqual(PALETTES.asr);
    expect(paletteAt(at(times.maghrib, 1), times)).toEqual(PALETTES.maghrib);
  });

  it('drifts between same-polarity phases', () => {
    const mid = paletteAt(times.asr, times); // dhuhr → asr, both light
    expect(mid.background).not.toBe(PALETTES.dhuhr.background);
    expect(mid.background).not.toBe(PALETTES.asr.background);
  });

  it('returns the pure palette outside transitions', () => {
    expect(paletteAt(at(times.asr, 60), times)).toEqual(PALETTES.asr);
  });

  it('only uses hex colours and declares light/dark for the status bar', () => {
    for (const p of Object.values(PALETTES)) {
      for (const c of [p.background, p.surface, p.text, p.textMuted, p.accent, p.onAccent]) expect(c).toMatch(/^#[0-9A-F]{6}$/);
      expect(['light', 'dark']).toContain(p.scheme);
    }
  });
});
