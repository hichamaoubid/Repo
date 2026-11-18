/**
 * Sun-phase palettes: the UI's colours follow the real position of the sun, derived from
 * today's prayer times (PRD §10). Pure TypeScript so contrast can be tested in CI.
 */
import type { DayTimes } from '../lib/prayer';

export type SunPhase = 'fajr' | 'shuruq' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
export const PHASE_ORDER: readonly SunPhase[] = ['fajr', 'shuruq', 'dhuhr', 'asr', 'maghrib', 'isha'];

export interface Palette {
  scheme: 'light' | 'dark';
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  accent: string;
  onAccent: string;
}

/** Material colours from the brand palette. */
export const MATERIALS = {
  sand: '#E9DFCC',
  ink: '#1B1F2A',
  oliveWood: '#6B5A3E',
  zellige: '#2F7F7A',
  terracotta: '#B5543A',
} as const;

export const PALETTES: Record<SunPhase, Palette> = {
  // Deep indigo towards a rose dawn
  fajr: { scheme: 'dark', background: '#1E2142', surface: '#2A2D55', text: '#F4EDE4', textMuted: '#C9C3D9', accent: '#E8A0A8', onAccent: '#1E2142' },
  // Pale gold after sunrise
  shuruq: { scheme: 'light', background: '#F6EBD0', surface: '#FFF6E3', text: MATERIALS.ink, textMuted: '#4E4A42', accent: '#22605C', onAccent: '#FFFFFF' },
  // Clear sand, high-key
  dhuhr: { scheme: 'light', background: '#F3ECDD', surface: '#FBF7EF', text: MATERIALS.ink, textMuted: '#514B40', accent: '#22605C', onAccent: '#FFFFFF' },
  // Warm ochre
  asr: { scheme: 'light', background: '#EBD3A8', surface: '#F5E3C2', text: '#2A1F12', textMuted: '#4F3D29', accent: '#8F3F2A', onAccent: '#FFFFFF' },
  // Copper towards plum
  maghrib: { scheme: 'dark', background: '#3B2333', surface: '#4C2E42', text: '#F7E9DF', textMuted: '#D8C2BE', accent: '#E08A5E', onAccent: '#2A1620' },
  // Ink blue, near black
  isha: { scheme: 'dark', background: '#12151F', surface: MATERIALS.ink, text: '#ECE6DA', textMuted: '#A9A9B5', accent: '#5FB3AC', onAccent: '#0E1117' },
};

/** Total length of the cross-fade, centred on each transition. */
export const TRANSITION_MS = 20 * 60_000;

export interface PhaseState {
  phase: SunPhase;
  previous: SunPhase;
  /** 0 = fully `previous`, 1 = fully `phase`. */
  blend: number;
}

export function sunPhaseAt(now: Date, times: DayTimes): PhaseState {
  const boundaries: [SunPhase, Date][] = [
    ['fajr', times.fajr],
    ['shuruq', times.sunrise],
    ['dhuhr', times.dhuhr],
    ['asr', times.asr],
    ['maghrib', times.maghrib],
    ['isha', times.isha],
  ];
  const t = now.getTime();
  const half = TRANSITION_MS / 2;
  for (let i = 0; i < boundaries.length; i++) {
    const [phase, start] = boundaries[i]!;
    const previous = boundaries[(i + boundaries.length - 1) % boundaries.length]![0];
    const delta = t - start.getTime();
    if (Math.abs(delta) <= half) {
      return { phase, previous, blend: Math.round(((delta + half) / TRANSITION_MS) * 1000) / 1000 };
    }
  }
  // Outside any window: the latest boundary that has passed, else the night before Fajr.
  let phase: SunPhase = 'isha';
  for (const [p, start] of boundaries) if (t >= start.getTime()) phase = p;
  const idx = PHASE_ORDER.indexOf(phase);
  return { phase, previous: PHASE_ORDER[(idx + PHASE_ORDER.length - 1) % PHASE_ORDER.length]!, blend: 1 };
}

const hexToRgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rgbToHex = ([r, g, b]: [number, number, number]) =>
  '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();

function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return rgbToHex([ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t]);
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(fg: string, bg: string): number {
  const [hi, lo] = [relativeLuminance(fg), relativeLuminance(bg)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** Of two candidate foregrounds, the one that reads best on `bg`. */
const bestOn = (bg: string, a: string, b: string) => (contrastRatio(a, bg) >= contrastRatio(b, bg) ? a : b);

/**
 * Palette at an instant. Between two phases of the same polarity, backgrounds and the
 * accent drift over the transition window, and text snaps to whichever phase's text
 * reads best. Between a dark and a light phase, any midpoint is a mid tone that no text
 * colour can reach 4.5:1 on, so the palette switches at the transition instant instead
 * (the UI animates that switch over ~300 ms).
 */
export function paletteAt(now: Date, times: DayTimes): Palette {
  const { phase, previous, blend } = sunPhaseAt(now, times);
  const from = PALETTES[previous];
  const to = PALETTES[phase];
  if (from.scheme !== to.scheme) return blend >= 0.5 ? to : from;
  if (blend >= 1) return to;
  if (blend <= 0) return from;
  const background = mix(from.background, to.background, blend);
  const surface = mix(from.surface, to.surface, blend);
  const accent = mix(from.accent, to.accent, blend);
  const text = bestOn(background, from.text, to.text);
  // Muted text must pass on the blended background too; fall back to full text colour.
  const mutedCandidate = bestOn(background, from.textMuted, to.textMuted);
  const textMuted = contrastRatio(mutedCandidate, background) >= 4.5 ? mutedCandidate : text;
  return {
    scheme: blend < 0.5 ? from.scheme : to.scheme,
    background,
    surface,
    text: contrastRatio(text, surface) >= 4.5 ? text : bestOn(surface, from.text, to.text),
    textMuted,
    accent,
    onAccent: bestOn(accent, from.onAccent, to.onAccent),
  };
}
