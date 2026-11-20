import type { DayStatus } from '../../streak';
import { computeGarden, SPECIES, STAGE_THRESHOLDS } from '..';

const days = (statuses: DayStatus[], start = '2026-05-01') =>
  statuses.map((status, i) => ({ day: new Date(Date.UTC(2026, 4, 1 + i)).toISOString().slice(0, 10), status, _start: start })).map(({ day, status }) => ({ day, status }));
const kept = (n: number): DayStatus[] => Array.from({ length: n }, () => 'kept');

describe('computeGarden', () => {
  it('starts with one seed of the first species', () => {
    const g = computeGarden([], '2026-05-01');
    expect(g.plants).toEqual([{ species: SPECIES[0], stage: 0, waterings: 0, bloomed: false }]);
    expect(g.keptThisMonth).toBe(0);
  });

  it('each kept or made-up day waters the current plant', () => {
    const g = computeGarden(days(['kept', 'made_up']), '2026-05-02');
    expect(g.plants[0]).toMatchObject({ waterings: 2, stage: 1 });
  });

  it('grows through the stages at the published thresholds', () => {
    for (const [stage, threshold] of STAGE_THRESHOLDS.entries()) {
      const g = computeGarden(days(kept(threshold)), '2026-06-30');
      expect(g.plants[0]?.stage).toBe(stage);
    }
  });

  it('plants the next species once a plant is fully grown', () => {
    const full = STAGE_THRESHOLDS[STAGE_THRESHOLDS.length - 1] as number;
    const g = computeGarden(days(kept(full + 1)), '2026-06-30');
    expect(g.plants).toHaveLength(2);
    expect(g.plants[0]).toMatchObject({ species: SPECIES[0], stage: 4 });
    expect(g.plants[1]).toMatchObject({ species: SPECIES[1], waterings: 1 });
  });

  it('never takes anything away: missed, frozen and paused days do not shrink a plant', () => {
    const g = computeGarden(days(['kept', 'kept', 'missed', 'frozen', 'paused', 'missed']), '2026-05-06');
    expect(g.plants[0]?.waterings).toBe(2);
  });

  it('blooms after 7 kept days in a row; frozen and paused days do not break the run', () => {
    const almost = computeGarden(days([...kept(6), 'missed', 'kept']), '2026-05-08');
    expect(almost.plants[0]?.bloomed).toBe(false);
    const withPause = computeGarden(days([...kept(3), 'paused', 'frozen', ...kept(4)]), '2026-05-09');
    expect(withPause.plants[0]?.bloomed).toBe(true);
  });

  it('marks the garden as resting when the last settled day was not kept', () => {
    expect(computeGarden(days(['kept', 'missed']), '2026-05-02').resting).toBe(true);
    expect(computeGarden(days(['kept', 'frozen', 'pending']), '2026-05-03').resting).toBe(true);
    expect(computeGarden(days(['missed', 'kept', 'pending']), '2026-05-03').resting).toBe(false);
  });

  it('counts the days kept in the current calendar month only', () => {
    const april = [{ day: '2026-04-30', status: 'kept' as const }];
    const g = computeGarden([...april, ...days(['kept', 'made_up', 'missed'])], '2026-05-03');
    expect(g.keptThisMonth).toBe(2);
  });

  it('cycles through the species after the last one', () => {
    const full = STAGE_THRESHOLDS[STAGE_THRESHOLDS.length - 1] as number;
    const statuses = kept(full * SPECIES.length + 1);
    const many = statuses.map((status, i) => ({ day: new Date(Date.UTC(2024, 0, 1 + i)).toISOString().slice(0, 10), status }));
    const g = computeGarden(many, '2030-01-01');
    expect(g.plants.at(-1)?.species).toBe(SPECIES[0]);
  });
});
