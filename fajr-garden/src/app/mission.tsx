import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { dayForAlarm, TEST_ALARM_ID } from '../features/alarm/alarmService';
import { alarmNative } from '../features/alarm/nativeAlarm';
import { alarmService } from '../features/alarm/useAlarm';
import { fajrLog } from '../features/habits/useFajrLog';
import { NO_LOCATION_PALETTE, usePrayerDay } from '../features/home/usePrayerDay';
import { useNow } from '../features/home/useNow';
import { MathMission } from '../features/missions/MathMission';
import { StepsMission } from '../features/missions/StepsMission';
import { useSettings } from '../features/settings/useSettings';
import { DEFAULT_STEP_GOAL } from '../lib/missions/steps';
import { fontSize, space } from '../theme/tokens';

export default function MissionScreen() {
  const { t } = useTranslation();
  const { alarmId } = useLocalSearchParams<{ alarmId?: string }>();
  const settings = useSettings();
  const palette = usePrayerDay(settings, useNow())?.palette ?? NO_LOCATION_PALETTE;
  const [kind, setKind] = useState(settings.alarm.mission === 'steps' ? 'steps' : 'math');
  const [done, setDone] = useState(false);

  const finish = useCallback(async () => {
    const now = new Date();
    try {
      if (alarmId === TEST_ALARM_ID) {
        await alarmNative.stopRinging();
        await alarmNative.cancel([TEST_ALARM_ID]);
      } else {
        const tz = settings.location?.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
        const day = dayForAlarm(alarmId, now, tz);
        await alarmService.completeMission(day, now);
        // Waking up for Fajr waters the garden (FR-013).
        fajrLog.record({ kind: 'mission_completed', day, recordedAt: now });
      }
    } finally {
      setDone(true);
    }
  }, [alarmId, settings.location]);

  const fallBackToMath = useCallback(() => setKind('math'), []);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: palette.background }]}>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
      <View style={styles.center}>
        {done ? (
          <>
            <Text accessibilityRole="header" style={[styles.title, { color: palette.text }]}>{t('mission.doneTitle')}</Text>
            <Text style={[styles.body, { color: palette.textMuted }]}>{t(alarmId === TEST_ALARM_ID ? 'mission.doneBody' : 'mission.doneWatered')}</Text>
            <Button label={t('mission.backHome')} palette={palette} onPress={() => router.replace('/')} />
          </>
        ) : kind === 'steps' ? (
          <StepsMission goal={DEFAULT_STEP_GOAL} palette={palette} onDone={finish} onUnavailable={fallBackToMath} />
        ) : (
          <MathMission palette={palette} onDone={finish} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: space.md },
  center: { flex: 1, justifyContent: 'center', gap: space.md },
  title: { fontSize: fontSize.display, fontWeight: '600' },
  body: { fontSize: fontSize.body },
});
