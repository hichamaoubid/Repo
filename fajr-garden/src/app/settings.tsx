import { router, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { ChoiceRow } from '../components/ChoiceRow';
import { NO_LOCATION_PALETTE, usePrayerDay } from '../features/home/usePrayerDay';
import { useNow } from '../features/home/useNow';
import { useLocate } from '../features/location/useLocate';
import { settingsStore, useSettings } from '../features/settings/useSettings';
import { defaultMethodForCountry, type HighLatRule, type MethodKey, type PrayerSettings } from '../lib/prayer';
import { fontSize, space } from '../theme/tokens';

const METHODS: MethodKey[] = [
  'mwl', 'umm_al_qura', 'egyptian', 'morocco', 'france_uoif', 'isna', 'karachi', 'turkey',
  'dubai', 'qatar', 'kuwait', 'singapore', 'tehran', 'moonsighting',
];
const HIGH_LAT: { rule: HighLatRule; key: string }[] = [
  { rule: 'auto', key: 'settings.highLatAuto' },
  { rule: 'middle', key: 'settings.highLatMiddle' },
  { rule: 'seventh', key: 'settings.highLatSeventh' },
  { rule: 'twilight', key: 'settings.highLatTwilight' },
];

const updatePrayer = (patch: Partial<PrayerSettings>) =>
  settingsStore.update((s) => ({ ...s, prayer: { ...s.prayer, ...patch } }));

export default function SettingsScreen() {
  const { t } = useTranslation();
  const settings = useSettings();
  const palette = usePrayerDay(settings, useNow())?.palette ?? NO_LOCATION_PALETTE;
  const { status, locate } = useLocate();
  const { location, prayer, methodIsAuto } = settings;

  const statusText =
    status === 'locating' ? t('settings.locating') :
    status === 'denied' ? t('settings.locationDenied') :
    status === 'unavailable' ? t('settings.locationUnavailable') : null;

  const chooseAuto = () =>
    settingsStore.update((s) => ({
      ...s,
      methodIsAuto: true,
      prayer: s.location ? { ...s.prayer, method: defaultMethodForCountry(s.location.country) } : s.prayer,
    }));
  const chooseMethod = (method: MethodKey) =>
    settingsStore.update((s) => ({ ...s, methodIsAuto: false, prayer: { ...s.prayer, method } }));

  const text = { color: palette.text };
  const muted = { color: palette.textMuted };
  const selectedLabel = t('settings.selected');

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: t('settings.title'),
          headerStyle: { backgroundColor: palette.background },
          headerTintColor: palette.text,
        }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text accessibilityRole="header" style={[styles.sectionTitle, text]}>{t('settings.location')}</Text>
          <Text style={[styles.body, text]}>{location?.label ?? t('settings.noLocation')}</Text>
          <Text style={[styles.caption, muted]}>{t('settings.privacyNote')}</Text>
          <Button label={t('settings.useMyLocation')} palette={palette} onPress={locate} disabled={status === 'locating'} />
          <Button label={t('settings.searchCity')} palette={palette} variant="secondary" onPress={() => router.push('/city-search')} />
          {statusText && (
            <Text accessibilityLiveRegion="polite" style={[styles.body, muted]}>
              {statusText}
            </Text>
          )}
        </View>

        <View style={styles.section} role="radiogroup">
          <Text accessibilityRole="header" style={[styles.sectionTitle, text]}>{t('settings.method')}</Text>
          <ChoiceRow label={t('settings.automatic')} selected={methodIsAuto} onPress={chooseAuto} palette={palette} selectedLabel={selectedLabel} />
          {METHODS.map((m) => (
            <ChoiceRow key={m} label={t(`methods.${m}`)} selected={!methodIsAuto && prayer.method === m} onPress={() => chooseMethod(m)} palette={palette} selectedLabel={selectedLabel} />
          ))}
        </View>

        <View style={styles.section} role="radiogroup">
          <Text accessibilityRole="header" style={[styles.sectionTitle, text]}>{t('settings.asr')}</Text>
          <ChoiceRow label={t('settings.asrStandard')} selected={prayer.asrMadhab === 'standard'} onPress={() => updatePrayer({ asrMadhab: 'standard' })} palette={palette} selectedLabel={selectedLabel} />
          <ChoiceRow label={t('settings.asrHanafi')} selected={prayer.asrMadhab === 'hanafi'} onPress={() => updatePrayer({ asrMadhab: 'hanafi' })} palette={palette} selectedLabel={selectedLabel} />
        </View>

        <View style={styles.section} role="radiogroup">
          <Text accessibilityRole="header" style={[styles.sectionTitle, text]}>{t('settings.highLat')}</Text>
          {HIGH_LAT.map(({ rule, key }) => (
            <ChoiceRow key={rule} label={t(key)} selected={prayer.highLatRule === rule} onPress={() => updatePrayer({ highLatRule: rule })} palette={palette} selectedLabel={selectedLabel} />
          ))}
        </View>

        <Text style={[styles.caption, muted]}>{t('settings.attribution')}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: space.md, gap: space.xl, paddingBottom: space.xxl },
  section: { gap: space.sm },
  sectionTitle: { fontSize: fontSize.title, fontWeight: '600' },
  body: { fontSize: fontSize.body },
  caption: { fontSize: fontSize.caption },
});
