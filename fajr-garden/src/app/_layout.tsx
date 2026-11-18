import { getLocales } from 'expo-localization';
import { Stack } from 'expo-router';
import type { i18n as I18n } from 'i18next';
import { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import { View } from 'react-native';
import { createI18n, isRTL, resolveLocale } from '../i18n';

export default function RootLayout() {
  const [i18n, setI18n] = useState<I18n | null>(null);

  useEffect(() => {
    const locale = resolveLocale(getLocales().map((l) => l.languageTag));
    createI18n(locale).then(setI18n);
  }, []);

  if (!i18n) return null; // resources are bundled, so this resolves in the first frame

  return (
    <I18nextProvider i18n={i18n}>
      {/* Explicit layout direction from the active language: consistent on iOS, Android
          and web, and correct without the app restart that I18nManager.forceRTL needs. */}
      <View style={{ flex: 1, direction: isRTL(i18n.language) ? 'rtl' : 'ltr' }}>
        <Stack screenOptions={{ headerShown: false }} />
      </View>
    </I18nextProvider>
  );
}
