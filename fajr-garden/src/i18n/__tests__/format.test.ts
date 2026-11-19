import { createI18n } from '..';
import { formatCountdown, splitDuration } from '../format';

describe('splitDuration', () => {
  it.each([
    [0, { hours: 0, minutes: 0 }],
    [45, { hours: 0, minutes: 45 }],
    [60, { hours: 1, minutes: 0 }],
    [344, { hours: 5, minutes: 44 }],
  ])('%i min → %j', (total, expected) => {
    expect(splitDuration(total)).toEqual(expected);
  });

  it('rejects negative or non-integer durations', () => {
    expect(() => splitDuration(-1)).toThrow(RangeError);
    expect(() => splitDuration(1.5)).toThrow(RangeError);
  });
});

describe('formatCountdown', () => {
  it.each([
    ['en', 45, 'in 45 minutes'],
    ['en', 60, 'in 1 h'],
    ['en', 344, 'in 5 h 44 min'],
    ['fr', 344, 'dans 5 h 44 min'],
    ['fr', 1, 'dans 1 minute'],
    ['ar', 0, 'الآن'],
    ['ar', 60, 'بعد ساعة'],
    ['ar', 125, 'بعد ساعتين و5 دقائق'],
    ['ar', 182, 'بعد 3 ساعات ودقيقتين'],
    ['ar', 660, 'بعد 11 ساعة'],
  ] as const)('%s, %i min → %s', async (lng, total, expected) => {
    const i18n = await createI18n(lng);
    expect(formatCountdown(i18n.t, total)).toBe(expected);
  });
});
