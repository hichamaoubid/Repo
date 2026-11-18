import { formatInTimeZone } from 'date-fns-tz';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DEMO_CITY } from '../features/home/demoLocation';
import { useNow } from '../features/home/useNow';
import {
  computePrayerTimes,
  defaultMethodForCountry,
  defaultSettings,
  localDateIn,
  nextPrayer,
  type TimeName,
} from '../lib/prayer';
import { paletteAt } from '../theme/sunPhase';
import { fontSize, radius, space } from '../theme/tokens';

const ROWS: TimeName[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

export default function HomeScreen() {
  const { t } = useTranslation();
  const now = useNow();
  const { coords, timeZone, countryCode, name } = DEMO_CITY;
  const settings = useMemo(() => ({ ...defaultSettings, method: defaultMethodForCountry(countryCode) }), [countryCode]);

  const today = localDateIn(now, timeZone);
  const times = useMemo(
    () => computePrayerTimes(coords, today, settings),
    // recompute once per local day
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [today.year, today.month, today.day, settings],
  );
  const next = nextPrayer(now, coords, settings, timeZone);
  const minutes = Math.max(0, Math.round((next.time.getTime() - now.getTime()) / 60_000));
  const palette = paletteAt(now, times);
  const hhmm = (d: Date) => formatInTimeZone(d, timeZone, 'HH:mm');

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: palette.background }]}>
      <StatusBar style={palette.scheme === 'dark' ? 'light' : 'dark'} />
      <View style={[styles.card, { backgroundColor: palette.surface }]} accessible accessibilityLabel={`${t('home.nextPrayer')}: ${t(`prayer.${next.name}`)} ${hhmm(next.time)}, ${t('home.inMinutes', { count: minutes })}`}>
        <Text style={[styles.eyebrow, { color: palette.textMuted }]}>{t('home.nextPrayer')}</Text>
        <Text accessibilityRole="header" style={[styles.hero, { color: palette.text }]}>
          {t(`prayer.${next.name}`)}
        </Text>
        <Text style={[styles.time, { color: palette.text }]}>{hhmm(next.time)}</Text>
        <Text style={[styles.body, { color: palette.textMuted }]}>{t('home.inMinutes', { count: minutes })}</Text>
      </View>

      <View style={styles.list} accessibilityRole="list">
        <Text style={[styles.sectionTitle, { color: palette.text }]}>{t('home.today')}</Text>
        {ROWS.map((row) => {
          const isNext = row === next.name;
          return (
            <View key={row} style={[styles.row, isNext && { backgroundColor: palette.accent }]}>
              <Text style={[styles.body, { color: isNext ? palette.onAccent : palette.text }]}>{t(`prayer.${row}`)}</Text>
              <Text style={[styles.body, styles.tabular, { color: isNext ? palette.onAccent : palette.text }]}>{hhmm(times[row])}</Text>
            </View>
          );
        })}
        {times.estimated && <Text style={[styles.caption, { color: palette.textMuted }]}>{t('home.estimated')}</Text>}
      </View>

      <Text style={[styles.body, styles.garden, { color: palette.text }]}>{t('garden.empty')}</Text>
      <Text style={[styles.caption, { color: palette.textMuted }]}>{t('home.locationPlaceholder', { city: name })}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: space.md, paddingTop: space.lg, gap: space.lg },
  // alignItems flex-start = the start edge, i.e. right in RTL, whatever the text's own direction
  card: { borderRadius: radius.md, padding: space.lg, gap: space.xs, alignItems: 'flex-start' },
  eyebrow: { fontSize: fontSize.small, letterSpacing: 0.5, textTransform: 'uppercase' },
  hero: { fontSize: fontSize.hero, fontWeight: '600' },
  time: { fontSize: fontSize.display, fontVariant: ['tabular-nums'] },
  list: { gap: space.xs },
  sectionTitle: { fontSize: fontSize.title, fontWeight: '600', marginBottom: space.xs },
  // paddingStart/End follow the layout direction, so rows mirror correctly in RTL
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: space.sm, paddingStart: space.md, paddingEnd: space.md, borderRadius: radius.sm },
  body: { fontSize: fontSize.body },
  tabular: { fontVariant: ['tabular-nums'] },
  caption: { fontSize: fontSize.caption },
  garden: { textAlign: 'center', marginTop: space.md },
});
