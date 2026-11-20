import { Pedometer } from 'expo-sensors';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { stepProgress } from '../../lib/missions/steps';
import type { Palette } from '../../theme/sunPhase';
import { fontSize, radius, space } from '../../theme/tokens';

interface Props {
  goal: number;
  palette: Palette;
  onDone: () => void;
  /** Pedometer missing or permission refused: switch to sums. */
  onUnavailable: () => void;
}

/** Counts steps from the moment the screen opens; the alarm stops at the goal. */
export function StepsMission({ goal, palette, onDone, onUnavailable }: Props) {
  const { t } = useTranslation();
  const [counted, setCounted] = useState(0);
  const progress = stepProgress(counted, goal);

  useEffect(() => {
    if (Platform.OS === 'web') {
      onUnavailable();
      return;
    }
    let subscription: { remove: () => void } | null = null;
    let cancelled = false;
    (async () => {
      const available = await Pedometer.isAvailableAsync().catch(() => false);
      const permission = available ? await Pedometer.requestPermissionsAsync().catch(() => null) : null;
      if (cancelled) return;
      if (!available || !permission?.granted) {
        onUnavailable();
        return;
      }
      subscription = Pedometer.watchStepCount((result) => setCounted(result.steps));
    })();
    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [onUnavailable]);

  useEffect(() => {
    if (progress.done) onDone();
  }, [progress.done, onDone]);

  return (
    <View style={styles.wrap}>
      <Text accessibilityRole="header" style={[styles.body, { color: palette.text }]}>
        {t('mission.stepsTitle')}
      </Text>
      <Text accessibilityLiveRegion="polite" style={[styles.count, { color: palette.text }]}>
        {t('mission.stepsCount', { steps: progress.steps, goal })}
      </Text>
      <View
        style={[styles.track, { backgroundColor: palette.surface }]}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: goal, now: progress.steps }}
      >
        <View style={[styles.fill, { width: `${progress.fraction * 100}%`, backgroundColor: palette.accent }]} />
      </View>
      <Text style={[styles.caption, { color: palette.textMuted }]}>{t('mission.stepsHint')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.md },
  body: { fontSize: fontSize.body },
  count: { fontSize: fontSize.hero, fontWeight: '600', fontVariant: ['tabular-nums'] },
  track: { height: 16, borderRadius: radius.sm, overflow: 'hidden' },
  fill: { height: '100%' },
  caption: { fontSize: fontSize.caption },
});
