import { Pressable, StyleSheet, Text } from 'react-native';
import { fontSize, radius, space } from '../theme/tokens';
import type { Palette } from '../theme/sunPhase';

interface Props {
  label: string;
  onPress: () => void;
  palette: Palette;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  accessibilityHint?: string;
}

/** Accessible button: 48 pt minimum target, visible pressed state, real button role. */
export function Button({ label, onPress, palette, variant = 'primary', disabled, accessibilityHint }: Props) {
  const primary = variant === 'primary';
  return (
    <Pressable
      role="button"
      aria-disabled={!!disabled}
      accessibilityHint={accessibilityHint}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        primary
          ? { backgroundColor: palette.accent }
          : { backgroundColor: 'transparent', borderColor: palette.text, borderWidth: 1 },
        (pressed || disabled) && { opacity: 0.7 },
      ]}
    >
      <Text style={[styles.label, { color: primary ? palette.onAccent : palette.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: 48, borderRadius: radius.sm, paddingHorizontal: space.md, justifyContent: 'center', alignItems: 'center' },
  label: { fontSize: fontSize.body, fontWeight: '600' },
});
