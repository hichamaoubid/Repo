/**
 * i18n setup. Pure configuration: the device locale is passed in, so this file has no
 * React Native imports and is testable in Node.
 * EN/FR/AR ship at launch; UR/TR/ID are planned for v1.0 (PRD FR-002) and slot in here.
 */
import { createInstance, type i18n as I18n } from 'i18next';
import ar from './locales/ar.json';
import en from './locales/en.json';
import fr from './locales/fr.json';

export const resources = {
  en: { translation: en },
  fr: { translation: fr },
  ar: { translation: ar },
} as const;

export type SupportedLocale = keyof typeof resources;
export const SUPPORTED_LOCALES = Object.keys(resources) as SupportedLocale[];
export const FALLBACK_LOCALE: SupportedLocale = 'en';

const RTL_LANGUAGES = new Set(['ar', 'ur', 'fa', 'he']);

const languageOf = (tag: string) => tag.toLowerCase().split(/[-_]/)[0] ?? '';

export function isRTL(locale: string): boolean {
  return RTL_LANGUAGES.has(languageOf(locale));
}

/** First supported language among the device's preferred locales (BCP 47 tags). */
export function resolveLocale(deviceLocales: readonly string[]): SupportedLocale {
  for (const tag of deviceLocales) {
    const lang = languageOf(tag);
    if ((SUPPORTED_LOCALES as string[]).includes(lang)) return lang as SupportedLocale;
  }
  return FALLBACK_LOCALE;
}

export async function createI18n(locale: SupportedLocale): Promise<I18n> {
  const instance = createInstance();
  await instance.init({
    resources,
    lng: locale,
    fallbackLng: FALLBACK_LOCALE,
    // React escapes text when rendering; escaping here would double-escape.
    interpolation: { escapeValue: false },
    returnNull: false,
  });
  return instance;
}
