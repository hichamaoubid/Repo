import { DEFAULT_STEP_GOAL, stepGoalFor, stepProgress } from '../steps';

describe('stepProgress', () => {
  it('reports steps, the fraction done and completion', () => {
    expect(stepProgress(0, 30)).toEqual({ steps: 0, remaining: 30, fraction: 0, done: false });
    expect(stepProgress(12, 30)).toEqual({ steps: 12, remaining: 18, fraction: 0.4, done: false });
    expect(stepProgress(30, 30)).toEqual({ steps: 30, remaining: 0, fraction: 1, done: true });
  });

  it('caps at the goal and never goes negative', () => {
    expect(stepProgress(45, 30)).toMatchObject({ steps: 30, remaining: 0, fraction: 1, done: true });
    expect(stepProgress(-3, 30)).toMatchObject({ steps: 0, fraction: 0 });
    expect(stepProgress(Number.NaN, 30)).toMatchObject({ steps: 0, done: false });
  });

  it('rejects a goal that is not a positive integer', () => {
    expect(() => stepProgress(1, 0)).toThrow(RangeError);
  });
});

describe('stepGoalFor', () => {
  it('starts at the default and doubles with each snooze (FR-008)', () => {
    expect(stepGoalFor(0)).toBe(DEFAULT_STEP_GOAL);
    expect(stepGoalFor(1)).toBe(DEFAULT_STEP_GOAL * 2);
    expect(stepGoalFor(3)).toBe(DEFAULT_STEP_GOAL * 4); // capped
  });
});
