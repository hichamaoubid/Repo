import { applyLocation, coarsenCoords, DEFAULT_SETTINGS, parseSettings, serializeSettings, type AppSettings } from '..';

const valid: AppSettings = {
  ...DEFAULT_SETTINGS,
  prayer: { method: 'morocco', asrMadhab: 'standard', highLatRule: 'auto', offsetsMin: { fajr: 2 } },
  location: { source: 'city', latitude: 34.013, longitude: -6.832, timeZone: 'Africa/Casablanca', label: 'Rabat', country: 'MA', cityId: 120 },
};

describe('parseSettings', () => {
  it('round-trips valid settings', () => {
    expect(parseSettings(serializeSettings(valid))).toEqual(valid);
  });

  it.each([null, '', 'not json', '42', '[]', '{"version":99}'])('falls back to defaults for %p', (raw) => {
    expect(parseSettings(raw)).toEqual(DEFAULT_SETTINGS);
  });

  it('keeps valid sections when another section is corrupt', () => {
    const raw = JSON.stringify({ ...valid, alarm: { mode: 'explode' } });
    const parsed = parseSettings(raw);
    expect(parsed.prayer).toEqual(valid.prayer);
    expect(parsed.location).toEqual(valid.location);
    expect(parsed.alarm).toEqual(DEFAULT_SETTINGS.alarm);
  });

  it.each([
    ['unknown method', { method: 'flat_earth' }],
    ['offset out of range', { offsetsMin: { fajr: 31 } }],
    ['non-integer offset', { offsetsMin: { isha: 1.5 } }],
    ['unknown offset key', { offsetsMin: { lunch: 5 } }],
  ])('rejects prayer settings with %s', (_label, patch) => {
    const raw = JSON.stringify({ ...valid, prayer: { ...valid.prayer, ...patch } });
    expect(parseSettings(raw).prayer).toEqual(DEFAULT_SETTINGS.prayer);
  });

  it.each([
    ['latitude out of range', { latitude: 95 }],
    ['unknown time zone', { timeZone: 'Mars/Olympus_Mons' }],
    ['overlong label', { label: 'x'.repeat(81) }],
    ['bad country code', { country: 'Morocco' }],
    ['unknown source', { source: 'satellite' }],
  ])('drops a location with %s', (_label, patch) => {
    const raw = JSON.stringify({ ...valid, location: { ...valid.location, ...patch } });
    expect(parseSettings(raw).location).toBeNull();
  });

  it.each([
    ['unknown mode', { mode: 'whenever' }],
    ['offset over 60', { offsetMin: 61 }],
    ['malformed fixed time', { mode: 'fixed', fixedTime: '25:00' }],
    ['fixed mode without time', { mode: 'fixed', fixedTime: undefined }],
    ['day mask out of range', { enabledDays: 128 }],
    ['snooze count over 3', { snoozeMax: 4 }],
  ])('rejects alarm settings with %s', (_label, patch) => {
    const raw = JSON.stringify({ ...valid, alarm: { ...valid.alarm, ...patch } });
    expect(parseSettings(raw).alarm).toEqual(DEFAULT_SETTINGS.alarm);
  });

  it('ignores unexpected extra fields instead of carrying them along', () => {
    const raw = JSON.stringify({ ...valid, __proto__: { polluted: true }, extra: 'x', prayer: { ...valid.prayer, sneaky: 1 } });
    const parsed = parseSettings(raw) as unknown as Record<string, unknown>;
    expect(parsed.extra).toBeUndefined();
    expect((parsed.prayer as Record<string, unknown>).sneaky).toBeUndefined();
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
});

describe('applyLocation', () => {
  const rabat = valid.location!;
  const cairo = { ...rabat, label: 'Cairo', country: 'EG', timeZone: 'Africa/Cairo', latitude: 30.06, longitude: 31.25 };

  it('switches the calculation method to the new country while it is automatic', () => {
    const next = applyLocation({ ...DEFAULT_SETTINGS, methodIsAuto: true }, cairo);
    expect(next.location).toEqual(cairo);
    expect(next.prayer.method).toBe('egyptian');
    expect(next.methodIsAuto).toBe(true);
  });

  it('keeps a method the user chose manually', () => {
    const chosen = { ...DEFAULT_SETTINGS, methodIsAuto: false, prayer: { ...DEFAULT_SETTINGS.prayer, method: 'mwl' as const } };
    expect(applyLocation(chosen, cairo).prayer.method).toBe('mwl');
  });

  it('does not mutate its input', () => {
    const before = JSON.stringify(DEFAULT_SETTINGS);
    applyLocation(DEFAULT_SETTINGS, cairo);
    expect(JSON.stringify(DEFAULT_SETTINGS)).toBe(before);
  });
});

describe('methodIsAuto', () => {
  it('defaults to true and survives a round trip', () => {
    expect(DEFAULT_SETTINGS.methodIsAuto).toBe(true);
    const manual = { ...valid, methodIsAuto: false };
    expect(parseSettings(serializeSettings(manual)).methodIsAuto).toBe(false);
  });

  it('falls back to true when the stored value is not a boolean', () => {
    expect(parseSettings(JSON.stringify({ ...valid, methodIsAuto: 'yes' })).methodIsAuto).toBe(true);
  });
});

describe('coarsenCoords', () => {
  it('rounds GPS coordinates to 2 decimals (about 1 km) before storage', () => {
    expect(coarsenCoords({ latitude: 48.856613, longitude: 2.352222 })).toEqual({ latitude: 48.86, longitude: 2.35 });
    expect(coarsenCoords({ latitude: -33.86882, longitude: 151.20929 })).toEqual({ latitude: -33.87, longitude: 151.21 });
  });
});

describe('defaults', () => {
  it('ship with the Fajr alarm off, at Fajr, Steps mission, no snooze, every day', () => {
    expect(DEFAULT_SETTINGS.alarm).toMatchObject({ enabled: false, mode: 'at_fajr', mission: 'steps', snoozeMax: 0, enabledDays: 0b1111111 });
    expect(DEFAULT_SETTINGS.location).toBeNull();
  });
});
