import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Palette } from '../theme/sunPhase';
import { fontSize, radius, space } from '../theme/tokens';

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
  palette: Palette;
  selectedLabel: string;
}

/** One option in a single-choice list, announced as a radio button. */
export function ChoiceRow({ label, selected, onPress, palette, selectedLabel }: Props) {
  return (
    <Pressable
      role="radio"
      aria-checked={selected}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { borderColor: selected ? palette.accent : palette.surface, backgroundColor: palette.surface },
        pressed && { opacity: 0.7 },
      ]}
    >
      <View style={[styles.dot, { borderColor: palette.text }, selected && { backgroundColor: palette.accent, borderColor: palette.accent }]} />
      <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
      {selected && <Text style={[styles.selected, { color: palette.textMuted }]}>{selectedLabel}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.md, borderRadius: radius.sm, borderWidth: 2 },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2 },
  label: { flex: 1, fontSize: fontSize.body },
  selected: { fontSize: fontSize.caption },
});
