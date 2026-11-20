/**
 * The garden (PRD FR-013) is derived entirely from the streak's day statuses: nothing
 * is stored, so it can never drift from the log. It only ever grows:
 * - each kept or made-up day waters the current plant,
 * - a plant moves through 5 stages, then the next species is planted,
 * - 7 kept days in a row make the current plant bloom (frozen/paused days are neutral),
 * - missed days leave it "resting", never smaller.
 */
import type { DayStatus } from '../streak';

export const SPECIES = [
  'date_palm', 'olive', 'fig', 'pomegranate', 'jasmine', 'lemon',
  'rose', 'mint', 'vine', 'almond', 'cedar', 'lavender',
] as const;
export type Species = (typeof SPECIES)[number];

/** Waterings needed to reach each stage: seed, sprout, young, growing, grown. */
export const STAGE_THRESHOLDS = [0, 2, 5, 9, 14] as const;
const FULL = STAGE_THRESHOLDS[STAGE_THRESHOLDS.length - 1] as number;
export const BLOOM_RUN = 7;

export interface Plant {
  species: Species;
  /** 0 seed … 4 fully grown. */
  stage: number;
  waterings: number;
  bloomed: boolean;
}

export interface Garden {
  plants: Plant[];
  /** The last settled day was not kept: the garden is resting (never wilting). */
  resting: boolean;
  keptThisMonth: number;
}

const stageFor = (waterings: number) => {
  let stage = 0;
  STAGE_THRESHOLDS.forEach((t, i) => {
    if (waterings >= t) stage = i;
  });
  return stage;
};

const isKept = (s: DayStatus) => s === 'kept' || s === 'made_up';

export function computeGarden(days: readonly { day: string; status: DayStatus }[], today: string): Garden {
  const plants: Plant[] = [{ species: SPECIES[0], stage: 0, waterings: 0, bloomed: false }];
  let run = 0;

  for (const { status } of days) {
    let current = plants[plants.length - 1] as Plant;
    if (isKept(status)) {
      if (current.waterings >= FULL) {
        current = { species: SPECIES[plants.length % SPECIES.length] as Species, stage: 0, waterings: 0, bloomed: false };
        plants.push(current);
      }
      current.waterings += 1;
      current.stage = stageFor(current.waterings);
      run += 1;
      if (run >= BLOOM_RUN) current.bloomed = true;
    } else if (status === 'missed') {
      run = 0;
    }
    // frozen, paused and pending days are neutral
  }

  const settled = [...days].reverse().find((d) => d.status !== 'pending');
  const month = today.slice(0, 7);
  return {
    plants,
    resting: settled ? !isKept(settled.status) : false,
    keptThisMonth: days.filter((d) => d.day.startsWith(month) && isKept(d.status)).length,
  };
}
