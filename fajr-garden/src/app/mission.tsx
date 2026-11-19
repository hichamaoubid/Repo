import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { dayForAlarm, TEST_ALARM_ID } from '../features/alarm/alarmService';
import { alarmNative } from '../features/alarm/nativeAlarm';
import { alarmService } from '../features/alarm/useAlarm';
import { NO_LOCATION_PALETTE, usePrayerDay } from '../features/home/usePrayerDay';
import { useNow } from '../features/home/useNow';
import { useSettings } from '../features/settings/useSettings';
import { checkAnswer, generateMathProblems, mulberry32 } from '../lib/missions/math';
import { fontSize, radius, space } from '../theme/tokens';

const PROBLEMS = 3;

export default function MissionScreen() {
  const { t } = useTranslation();
  const { alarmId } = useLocalSearchParams<{ alarmId?: string }>();
  const settings = useSettings();
  const palette = usePrayerDay(settings, useNow())?.palette ?? NO_LOCATION_PALETTE;
  const [problems] = useState(() => generateMathProblems(mulberry32(Date.now()), PROBLEMS, 1));
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [wrong, setWrong] = useState(false);
  const [done, setDone] = useState(false);

  const finish = async () => {
    const now = new Date();
    if (alarmId === TEST_ALARM_ID) {
      await alarmNative.stopRinging();
      await alarmNative.cancel([TEST_ALARM_ID]);
    } else {
      const tz = settings.location?.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
      await alarmService.completeMission(dayForAlarm(alarmId, now, tz), now);
    }
    setDone(true);
  };

  const submit = () => {
    const problem = problems[index];
    if (!problem) return;
    if (!checkAnswer(problem, answer)) {
      setWrong(true);
      return;
    }
    setWrong(false);
    setAnswer('');
    if (index + 1 < problems.length) setIndex(index + 1);
    else finish().catch(() => setDone(true));
  };

  const text = { color: palette.text };
  const muted = { color: palette.textMuted };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: palette.background }]}>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
      {done ? (
        <View style={styles.center}>
          <Text accessibilityRole="header" style={[styles.title, text]}>{t('mission.doneTitle')}</Text>
          <Text style={[styles.body, muted]}>{t('mission.doneBody')}</Text>
          <Button label={t('mission.backHome')} palette={palette} onPress={() => router.replace('/')} />
        </View>
      ) : (
        <View style={styles.center}>
          <Text style={[styles.eyebrow, muted]}>{t('mission.progress', { current: index + 1, total: problems.length })}</Text>
          <Text accessibilityRole="header" style={[styles.body, text]}>{t('mission.mathTitle')}</Text>
          <Text style={[styles.problem, text]} accessibilityLabel={problems[index]?.prompt.replace('×', t('mission.times'))}>
            {problems[index]?.prompt}
          </Text>
          <TextInput
            value={answer}
            onChangeText={(v) => {
              setAnswer(v);
              setWrong(false);
            }}
            onSubmitEditing={submit}
            keyboardType="number-pad"
            autoFocus
            maxLength={6}
            accessibilityLabel={t('mission.answer')}
            placeholder={t('mission.answer')}
            placeholderTextColor={palette.textMuted}
            style={[styles.input, { color: palette.text, borderColor: palette.text, backgroundColor: palette.surface }]}
          />
          {wrong && (
            <Text accessibilityLiveRegion="assertive" style={[styles.body, text]}>
              {t('mission.tryAgain')}
            </Text>
          )}
          <Button label={t('mission.check')} palette={palette} onPress={submit} disabled={answer.trim() === ''} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: space.md },
  center: { flex: 1, justifyContent: 'center', gap: space.md },
  eyebrow: { fontSize: fontSize.small, textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: fontSize.display, fontWeight: '600' },
  problem: { fontSize: fontSize.hero, fontWeight: '600', fontVariant: ['tabular-nums'], writingDirection: 'ltr', textAlign: 'center' },
  body: { fontSize: fontSize.body },
  input: { minHeight: 56, borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: space.md, fontSize: fontSize.title, textAlign: 'center' },
});
