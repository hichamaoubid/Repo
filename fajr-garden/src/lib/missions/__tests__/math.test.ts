import { checkAnswer, generateMathProblems, mulberry32, parseDigits } from '../math';

describe('parseDigits', () => {
  it.each([
    ['42', 42],
    [' 42 ', 42],
    ['٤٢', 42], // Arabic-Indic digits
    ['۴۲', 42], // Persian digits
    ['4٢', 42],
  ])('%p → %p', (input, expected) => {
    expect(parseDigits(input)).toBe(expected);
  });

  it.each(['', 'abc', '4 2', '-3', '1.5', '١٢٣٤٥٦٧'])('rejects %p', (input) => {
    expect(parseDigits(input)).toBeNull();
  });
});

describe('generateMathProblems', () => {
  it('is deterministic for a given seed', () => {
    expect(generateMathProblems(mulberry32(7), 3, 1)).toEqual(generateMathProblems(mulberry32(7), 3, 1));
  });

  it('produces the requested number of distinct problems', () => {
    const p = generateMathProblems(mulberry32(1), 3, 2);
    expect(p).toHaveLength(3);
    expect(new Set(p.map((x) => x.prompt)).size).toBe(3);
  });

  it.each([1, 2, 3] as const)('level %i keeps answers positive, bounded and correct', (level) => {
    const rng = mulberry32(level * 101);
    for (let i = 0; i < 200; i++) {
      for (const p of generateMathProblems(rng, 3, level)) {
        expect(p.answer).toBeGreaterThan(0);
        expect(p.answer).toBeLessThan(1000);
        const [a, op, b] = p.prompt.split(' ');
        expect(op === '+' ? Number(a) + Number(b) : Number(a) * Number(b)).toBe(p.answer);
      }
    }
  });

  it('gets harder with the level: level 3 answers are larger on average than level 1', () => {
    const avg = (level: 1 | 3) => {
      const rng = mulberry32(5);
      let sum = 0;
      for (let i = 0; i < 300; i++) sum += generateMathProblems(rng, 1, level)[0]!.answer;
      return sum / 300;
    };
    expect(avg(3)).toBeGreaterThan(avg(1) * 1.5);
  });
});

describe('checkAnswer', () => {
  const [p] = generateMathProblems(mulberry32(3), 1, 1);
  it('accepts the right answer in Western or Arabic-Indic digits', () => {
    const arabic = String(p!.answer).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]!);
    expect(checkAnswer(p!, String(p!.answer))).toBe(true);
    expect(checkAnswer(p!, arabic)).toBe(true);
  });
  it('rejects a wrong or malformed answer', () => {
    expect(checkAnswer(p!, String(p!.answer + 1))).toBe(false);
    expect(checkAnswer(p!, 'x')).toBe(false);
  });
});
