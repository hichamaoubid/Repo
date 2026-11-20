/** Steps wake-up mission (PRD FR-007): walk until the goal is reached. */

export const DEFAULT_STEP_GOAL = 30;
const MAX_MULTIPLIER = 4;

export interface StepProgress {
  steps: number;
  remaining: number;
  /** 0–1, rounded to 2 decimals. */
  fraction: number;
  done: boolean;
}

export function stepProgress(counted: number, goal: number): StepProgress {
  if (!Number.isInteger(goal) || goal <= 0) throw new RangeError(`goal must be a positive integer, got ${goal}`);
  const steps = Number.isFinite(counted) ? Math.min(goal, Math.max(0, Math.floor(counted))) : 0;
  return { steps, remaining: goal - steps, fraction: Math.round((steps / goal) * 100) / 100, done: steps >= goal };
}

/** Each snooze doubles the walk (FR-008), up to 4×. */
export function stepGoalFor(snoozes: number): number {
  return DEFAULT_STEP_GOAL * Math.min(MAX_MULTIPLIER, 2 ** Math.max(0, snoozes));
}
