import { getLocales } from 'expo-localization';
import { Stack } from 'expo-router';
import type { i18n as I18n } from 'i18next';
import { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import { View } from 'react-native';
import { BackButton } from '../components/BackButton';
import { useAlarmSync } from '../features/alarm/useAlarm';
import { useSettings } from '../features/settings/useSettings';
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
      <AlarmSync />
      {/* Explicit layout direction from the active language: consistent on iOS, Android
          and web, and correct without the app restart that I18nManager.forceRTL needs. */}
      <View style={{ flex: 1, direction: isRTL(i18n.language) ? 'rtl' : 'ltr' }}>
        <Stack
          screenOptions={{
            headerShown: false,
            headerBackVisible: false,
            headerLeft: ({ tintColor, canGoBack }) => (canGoBack ? <BackButton tintColor={tintColor} /> : null),
          }}
        />
      </View>
    </I18nextProvider>
  );
}

/** Runs inside the i18n provider so alarm texts are translated. */
function AlarmSync() {
  useAlarmSync(useSettings());
  return null;
}
