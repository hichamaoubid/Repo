import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, type ColorValue } from 'react-native';
import { isRTL } from '../i18n';

/**
 * Header back button that points the right way in RTL. The layout direction is set per
 * language (not through I18nManager), so the stock header arrow would not mirror.
 */
export function BackButton({ tintColor }: { tintColor?: ColorValue }) {
  const { t, i18n } = useTranslation();
  const rtl = isRTL(i18n.language);
  return (
    <Pressable
      role="button"
      aria-label={t('common.back')}
      hitSlop={12}
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      style={styles.target}
    >
      <Text style={[styles.arrow, { color: tintColor }]}>{rtl ? '→' : '←'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  target: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  arrow: { fontSize: 24 },
});
