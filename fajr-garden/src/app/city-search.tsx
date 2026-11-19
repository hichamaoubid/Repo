import { getLocales } from 'expo-localization';
import { router, Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { NO_LOCATION_PALETTE, usePrayerDay } from '../features/home/usePrayerDay';
import { useNow } from '../features/home/useNow';
import { getCities } from '../features/location/cityData';
import { settingsStore, useSettings } from '../features/settings/useSettings';
import { searchCities, type City } from '../lib/cities';
import { applyLocation } from '../lib/settings';
import { fontSize, radius, space } from '../theme/tokens';

export default function CitySearchScreen() {
  const { t, i18n } = useTranslation();
  const settings = useSettings();
  const palette = usePrayerDay(settings, useNow())?.palette ?? NO_LOCATION_PALETTE;
  const [query, setQuery] = useState('');
  const cities = useMemo(() => getCities(), []);
  const region = getLocales()[0]?.regionCode ?? undefined;
  const results = useMemo(() => searchCities(cities, query, { limit: 30, preferCountry: region }), [cities, query, region]);
  const arabic = i18n.language === 'ar';

  const displayName = (c: City) => (arabic && c.arabicNames[0]) || c.name;

  const choose = (c: City) => {
    settingsStore.update((s) =>
      applyLocation(s, {
        source: 'city',
        latitude: c.latitude,
        longitude: c.longitude,
        timeZone: c.timeZone,
        label: displayName(c).slice(0, 80),
        country: c.country,
        cityId: c.id,
      }),
    );
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const showHint = query.trim().length < 2;

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: t('citySearch.title'),
          headerStyle: { backgroundColor: palette.background },
          headerTintColor: palette.text,
        }}
      />
      <TextInput
        autoFocus
        value={query}
        onChangeText={setQuery}
        placeholder={t('citySearch.placeholder')}
        placeholderTextColor={palette.textMuted}
        accessibilityLabel={t('citySearch.placeholder')}
        autoCorrect={false}
        autoCapitalize="words"
        returnKeyType="search"
        style={[styles.input, { color: palette.text, borderColor: palette.text, backgroundColor: palette.surface, textAlign: arabic ? 'right' : 'left' }]}
      />
      {showHint ? (
        <Text style={[styles.message, { color: palette.textMuted }]}>{t('citySearch.hint')}</Text>
      ) : results.length === 0 ? (
        <Text accessibilityLiveRegion="polite" style={[styles.message, { color: palette.textMuted }]}>
          {t('citySearch.noResults')}
        </Text>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(c) => String(c.id)}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              onPress={() => choose(item)}
              style={({ pressed }) => [styles.row, { backgroundColor: palette.surface }, pressed && { opacity: 0.7 }]}
            >
              <Text style={[styles.name, { color: palette.text }]}>{displayName(item)}</Text>
              <Text style={[styles.meta, { color: palette.textMuted }]}>
                {arabic && item.arabicNames[0] ? `${item.name} · ${item.country}` : item.country}
              </Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: space.md, gap: space.md },
  input: { minHeight: 48, borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: space.md, fontSize: fontSize.body },
  message: { fontSize: fontSize.body },
  list: { gap: space.xs, paddingBottom: space.xxl },
  row: { minHeight: 56, borderRadius: radius.sm, paddingHorizontal: space.md, paddingVertical: space.sm, justifyContent: 'center' },
  name: { fontSize: fontSize.body, fontWeight: '600' },
  meta: { fontSize: fontSize.caption },
});
