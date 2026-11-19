/**
 * Math wake-up mission (PRD FR-007): always available, so nobody is ever locked out of
 * stopping the alarm. Each snooze raises the level (FR-008).
 */

export interface MathProblem {
  /** "a + b" or "a × b" with Western digits (the UI may localise them). */
  prompt: string;
  answer: number;
}

export type MathLevel = 1 | 2 | 3;

/** Small, fast, seedable PRNG (tests use fixed seeds; the app seeds from the clock). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const int = (rng: () => number, min: number, max: number) => min + Math.floor(rng() * (max - min + 1));

function one(rng: () => number, level: MathLevel): MathProblem {
  switch (level) {
    case 1: {
      const a = int(rng, 11, 49);
      const b = int(rng, 11, 49);
      return { prompt: `${a} + ${b}`, answer: a + b };
    }
    case 2: {
      const a = int(rng, 12, 39);
      const b = int(rng, 3, 9);
      return { prompt: `${a} × ${b}`, answer: a * b };
    }
    case 3: {
      const a = int(rng, 12, 31);
      const b = int(rng, 12, 31);
      return { prompt: `${a} × ${b}`, answer: a * b };
    }
  }
}

export function generateMathProblems(rng: () => number, count: number, level: MathLevel): MathProblem[] {
  const out: MathProblem[] = [];
  const seen = new Set<string>();
  while (out.length < count) {
    const p = one(rng, level);
    if (seen.has(p.prompt)) continue;
    seen.add(p.prompt);
    out.push(p);
  }
  return out;
}

const DIGIT_SETS = ['0123456789', '٠١٢٣٤٥٦٧٨٩', '۰۱۲۳۴۵۶۷۸۹'];
const MAX_DIGITS = 6;

/** Parses a non-negative integer typed with Western, Arabic-Indic or Persian digits. */
export function parseDigits(input: string): number | null {
  const s = input.trim();
  if (s.length === 0 || s.length > MAX_DIGITS) return null;
  let value = 0;
  for (const ch of s) {
    const set = DIGIT_SETS.find((d) => d.includes(ch));
    if (!set) return null;
    value = value * 10 + set.indexOf(ch);
  }
  return value;
}

export function checkAnswer(problem: MathProblem, input: string): boolean {
  return parseDigits(input) === problem.answer;
}
