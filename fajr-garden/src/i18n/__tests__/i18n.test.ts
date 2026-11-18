import { createI18n, isRTL, resolveLocale, resources, SUPPORTED_LOCALES } from '..';

const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/;

function flatKeys(obj: object, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null ? flatKeys(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}
const baseKeys = (lng: string) =>
  new Set(flatKeys(resources[lng as keyof typeof resources].translation).map((k) => k.replace(PLURAL_SUFFIX, '')));

describe('locale resources', () => {
  it.each(SUPPORTED_LOCALES.filter((l) => l !== 'en'))('%s has exactly the same keys as en', (lng) => {
    expect([...baseKeys(lng)].sort()).toEqual([...baseKeys('en')].sort());
  });

  it.each(SUPPORTED_LOCALES)('%s defines every plural category its language needs', (lng) => {
    const keys = flatKeys(resources[lng].translation);
    const pluralBases = new Set(keys.filter((k) => PLURAL_SUFFIX.test(k)).map((k) => k.replace(PLURAL_SUFFIX, '')));
    const categories = new Intl.PluralRules(lng).resolvedOptions().pluralCategories;
    for (const base of pluralBases) {
      for (const cat of categories) expect(keys).toContain(`${base}_${cat}`);
    }
  });

  it.each(SUPPORTED_LOCALES)('%s has no empty strings', (lng) => {
    const walk = (o: object): string[] => Object.values(o).flatMap((v) => (typeof v === 'string' ? [v] : walk(v)));
    walk(resources[lng].translation).forEach((s) => expect(s.trim()).not.toBe(''));
  });
});

describe('isRTL', () => {
  it('is true for Arabic and Urdu, false otherwise', () => {
    expect(isRTL('ar')).toBe(true);
    expect(isRTL('ar-MA')).toBe(true);
    expect(isRTL('ur')).toBe(true);
    expect(isRTL('fr')).toBe(false);
    expect(isRTL('en-GB')).toBe(false);
  });
});

describe('resolveLocale', () => {
  it('picks the first supported device language', () => {
    expect(resolveLocale(['de-DE', 'fr-FR', 'en-US'])).toBe('fr');
    expect(resolveLocale(['ar-EG'])).toBe('ar');
  });
  it('falls back to English', () => {
    expect(resolveLocale(['de-DE'])).toBe('en');
    expect(resolveLocale([])).toBe('en');
  });
});

describe('createI18n', () => {
  it('interpolates and pluralises in French', async () => {
    const i18n = await createI18n('fr');
    expect(i18n.t('home.inMinutes', { count: 1 })).toBe('dans 1 minute');
    expect(i18n.t('home.inMinutes', { count: 12 })).toBe('dans 12 minutes');
  });

  it.each([
    [0, 'الآن'],
    [1, 'بعد دقيقة واحدة'],
    [2, 'بعد دقيقتين'],
    [5, 'بعد 5 دقائق'],
    [11, 'بعد 11 دقيقة'],
    [100, 'بعد 100 دقيقة'],
  ])('uses the right Arabic plural form for %i', async (count, expected) => {
    const i18n = await createI18n('ar');
    expect(i18n.t('home.inMinutes', { count })).toBe(expected);
  });

  it('does not HTML-escape interpolated values (React escapes on render)', async () => {
    const i18n = await createI18n('en');
    expect(i18n.t('home.locationPlaceholder', { city: 'Rock & Roll' })).toContain('Rock & Roll');
  });
});
