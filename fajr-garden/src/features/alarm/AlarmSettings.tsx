import { formatInTimeZone } from 'date-fns-tz';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Switch, Text, View } from 'react-native';
import type { AlarmPermissionStatus } from '../../../modules/fg-alarm';
import { Button } from '../../components/Button';
import { ChoiceRow } from '../../components/ChoiceRow';
import { planFajrAlarms, type FajrAlarmConfig } from '../../lib/alarm';
import type { AppSettings } from '../../lib/settings';
import type { Palette } from '../../theme/sunPhase';
import { fontSize, space } from '../../theme/tokens';
import { settingsStore } from '../settings/useSettings';
import { alarmNative, alarmPermissions } from './nativeAlarm';
import { alarmService } from './useAlarm';

const TIMING: { key: string; patch: Pick<FajrAlarmConfig, 'mode' | 'offsetMin'> }[] = [
  { key: 'alarm.atFajr', patch: { mode: 'at_fajr', offsetMin: 0 } },
  { key: 'alarm.before10', patch: { mode: 'before_fajr', offsetMin: 10 } },
  { key: 'alarm.before20', patch: { mode: 'before_fajr', offsetMin: 20 } },
  { key: 'alarm.before30', patch: { mode: 'before_fajr', offsetMin: 30 } },
];

const TEST_DELAY_S = 10;

export function AlarmSettings({ settings, palette }: { settings: AppSettings; palette: Palette }) {
  const { t, i18n } = useTranslation();
  const supported = alarmNative.isSupported();
  const [status, setStatus] = useState<AlarmPermissionStatus | null>(null);
  const [testScheduled, setTestScheduled] = useState(false);
  const { alarm, location } = settings;

  const refresh = useCallback(() => {
    if (supported) alarmPermissions.status().then(setStatus).catch(() => setStatus(null));
  }, [supported]);
  useEffect(refresh, [refresh]);

  const setAlarm = (patch: Partial<FajrAlarmConfig>) =>
    settingsStore.update((s) => ({ ...s, alarm: { ...s.alarm, ...patch } }));

  const toggle = async (enabled: boolean) => {
    if (enabled) setStatus(await alarmPermissions.request().catch(() => null));
    setAlarm({ enabled });
  };

  const testAlarm = async () => {
    await alarmService.scheduleTest(new Date(), TEST_DELAY_S, {
      title: t('alarm.notificationTitle'),
      body: t('alarm.notificationBody'),
    });
    setTestScheduled(true);
  };

  const next =
    alarm.enabled && location
      ? planFajrAlarms({ now: new Date(), coords: location, timeZone: location.timeZone, prayer: settings.prayer, alarm, days: 1, followUpDays: 0 })[0]
      : undefined;
  // Same 24-hour format as the rest of the app; only the weekday is localised.
  const nextLabel =
    next && location
      ? `${next.fireAt.toLocaleDateString(i18n.language, { weekday: 'long', timeZone: location.timeZone })} ${formatInTimeZone(next.fireAt, location.timeZone, 'HH:mm')}`
      : null;

  const text = { color: palette.text };
  const muted = { color: palette.textMuted };
  const selectedLabel = t('settings.selected');
  const isSelected = (p: (typeof TIMING)[number]['patch']) => alarm.mode === p.mode && (p.mode === 'at_fajr' || alarm.offsetMin === p.offsetMin);

  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={[styles.sectionTitle, text]}>{t('alarm.title')}</Text>
      {!supported ? (
        <Text style={[styles.body, muted]}>{t('alarm.unsupported')}</Text>
      ) : (
        <>
          <View style={styles.switchRow}>
            <Text style={[styles.body, text, styles.flex]} nativeID="alarm-switch-label">{t('alarm.enable')}</Text>
            <Switch
              value={alarm.enabled}
              onValueChange={toggle}
              disabled={!location}
              aria-labelledby="alarm-switch-label"
              accessibilityLabel={t('alarm.enable')}
              trackColor={{ true: palette.accent, false: palette.surface }}
            />
          </View>
          {!location && <Text style={[styles.caption, muted]}>{t('alarm.needsLocation')}</Text>}

          {alarm.enabled && (
            <>
              <View role="radiogroup" style={styles.group}>
                {TIMING.map(({ key, patch }) => (
                  <ChoiceRow key={key} label={t(key)} selected={isSelected(patch)} onPress={() => setAlarm(patch)} palette={palette} selectedLabel={selectedLabel} />
                ))}
              </View>
              <Text style={[styles.label, text]}>{t('alarm.mission')}</Text>
              <View role="radiogroup" style={styles.group}>
                <ChoiceRow label={t('alarm.missionMathLabel')} selected={alarm.mission !== 'steps'} onPress={() => setAlarm({ mission: 'math' })} palette={palette} selectedLabel={selectedLabel} />
                <ChoiceRow label={t('alarm.missionStepsLabel')} selected={alarm.mission === 'steps'} onPress={() => setAlarm({ mission: 'steps' })} palette={palette} selectedLabel={selectedLabel} />
              </View>
              <Text style={[styles.caption, muted]}>{t(alarm.mission === 'steps' ? 'alarm.missionSteps' : 'alarm.missionMath')}</Text>
              {nextLabel && <Text style={[styles.body, text]}>{t('alarm.next', { when: nextLabel })}</Text>}
            </>
          )}

          {status && !status.canSchedule && <Text style={[styles.body, muted]}>{t('alarm.cannotSchedule')}</Text>}
          {status && !status.notificationsAllowed && (
            <Button label={t('alarm.allowNotifications')} palette={palette} variant="secondary" onPress={() => alarmPermissions.request().then(setStatus)} />
          )}
          {status && !status.canShowFullScreen && (
            <>
              <Text style={[styles.body, muted]}>{t('alarm.fullScreenOff')}</Text>
              <Button label={t('alarm.allowFullScreen')} palette={palette} variant="secondary" onPress={() => alarmPermissions.openFullScreenSettings().then(refresh)} />
            </>
          )}

          <Button label={t('alarm.test', { seconds: TEST_DELAY_S })} palette={palette} variant="secondary" onPress={testAlarm} />
          {testScheduled && (
            <Text accessibilityLiveRegion="polite" style={[styles.caption, muted]}>
              {t('alarm.testScheduled', { seconds: TEST_DELAY_S })}
            </Text>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.sm },
  group: { gap: space.sm },
  sectionTitle: { fontSize: fontSize.title, fontWeight: '600' },
  switchRow: { flexDirection: 'row', alignItems: 'center', minHeight: 48, gap: space.sm },
  flex: { flex: 1 },
  body: { fontSize: fontSize.body },
  label: { fontSize: fontSize.body, fontWeight: '600' },
  caption: { fontSize: fontSize.caption },
});
