import { formatInTimeZone } from 'date-fns-tz';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { computePrayerTimes, localDateIn, type PrayerSettings } from '../../lib/prayer';
import type { LocationSetting } from '../../lib/settings';
import type { CheckinState } from '../../lib/streak';
import type { Palette } from '../../theme/sunPhase';
import { fontSize, radius, space } from '../../theme/tokens';
import type { FajrProgress } from './useFajrProgress';
import { fajrLog } from './useFajrLog';

interface Props {
  location: LocationSetting;
  prayer: PrayerSettings;
  now: Date;
  progress: FajrProgress;
  palette: Palette;
}

const isKept = (s: string | undefined) => s === 'kept' || s === 'made_up';

/** Private Fajr check-in (FR-012): consistency only, never a score. */
export function CheckinCard({ location, prayer, now, progress, palette }: Props) {
  const { t } = useTranslation();
  const todayFajr = computePrayerTimes(location, localDateIn(now, location.timeZone), prayer).fajr;
  const todayStatus = progress.statusOf(progress.today);
  const yesterdayStatus = progress.statusOf(progress.yesterday);
  const record = (day: string, state: CheckinState) => fajrLog.record({ kind: 'checkin', day, state, recordedAt: new Date() });

  const text = { color: palette.text };
  const muted = { color: palette.textMuted };

  let body: React.ReactNode;
  if (isKept(todayStatus)) {
    body = <Text style={[styles.title, text]}>{t('checkin.kept')}</Text>;
  } else if (now < todayFajr) {
    body = <Text style={[styles.body, muted]}>{t('checkin.notYet', { time: formatInTimeZone(todayFajr, location.timeZone, 'HH:mm') })}</Text>;
  } else {
    body = (
      <>
        <Text style={[styles.title, text]}>{t('checkin.question')}</Text>
        <View style={styles.row}>
          <View style={styles.flex}>
            <Button label={t('checkin.onTime')} palette={palette} onPress={() => record(progress.today, 'on_time')} />
          </View>
          <View style={styles.flex}>
            <Button label={t('checkin.late')} palette={palette} variant="secondary" onPress={() => record(progress.today, 'late')} />
          </View>
        </View>
      </>
    );
  }

  // Yesterday is still "pending" while it can be made up (24 h after it ends).
  const canMakeUp = yesterdayStatus === 'pending';

  return (
    <View style={[styles.card, { backgroundColor: palette.surface }]}>
      {body}
      {canMakeUp && (
        <Button label={t('checkin.makeUp')} palette={palette} variant="secondary" onPress={() => record(progress.yesterday, 'made_up')} />
      )}
      <Text style={[styles.caption, muted]}>{t('checkin.private')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.md, padding: space.md, gap: space.sm },
  title: { fontSize: fontSize.title, fontWeight: '600' },
  body: { fontSize: fontSize.body },
  caption: { fontSize: fontSize.caption },
  row: { flexDirection: 'row', gap: space.sm },
  flex: { flex: 1 },
});
