import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '../../components/Button';
import { checkAnswer, generateMathProblems, mulberry32 } from '../../lib/missions/math';
import type { Palette } from '../../theme/sunPhase';
import { fontSize, radius, space } from '../../theme/tokens';

const PROBLEMS = 3;

export function MathMission({ palette, onDone }: { palette: Palette; onDone: () => void }) {
  const { t } = useTranslation();
  const [problems] = useState(() => generateMathProblems(mulberry32(Date.now()), PROBLEMS, 1));
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [wrong, setWrong] = useState(false);

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
    else onDone();
  };

  return (
    <View style={styles.wrap}>
      <Text style={[styles.eyebrow, { color: palette.textMuted }]}>
        {t('mission.progress', { current: index + 1, total: problems.length })}
      </Text>
      <Text accessibilityRole="header" style={[styles.body, { color: palette.text }]}>
        {t('mission.mathTitle')}
      </Text>
      <Text
        style={[styles.problem, { color: palette.text }]}
        accessibilityLabel={problems[index]?.prompt.replace('×', t('mission.times'))}
      >
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
        <Text accessibilityLiveRegion="assertive" style={[styles.body, { color: palette.text }]}>
          {t('mission.tryAgain')}
        </Text>
      )}
      <Button label={t('mission.check')} palette={palette} onPress={submit} disabled={answer.trim() === ''} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.md },
  eyebrow: { fontSize: fontSize.small, textTransform: 'uppercase', letterSpacing: 0.5 },
  problem: {
    fontSize: fontSize.hero,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    writingDirection: 'ltr',
    textAlign: 'center',
  },
  body: { fontSize: fontSize.body },
  input: {
    minHeight: 56,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    fontSize: fontSize.title,
    textAlign: 'center',
  },
});
