/** Locale-aware duration formatting on top of i18next. */
import type { TFunction } from 'i18next';

export function splitDuration(totalMinutes: number): { hours: number; minutes: number } {
  if (!Number.isInteger(totalMinutes) || totalMinutes < 0) {
    throw new RangeError(`duration must be a non-negative integer number of minutes, got ${totalMinutes}`);
  }
  return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 };
}

/** "in 45 minutes", "in 5 h 44 min", "بعد ساعتين و5 دقائق". */
export function formatCountdown(t: TFunction, totalMinutes: number): string {
  const { hours, minutes } = splitDuration(totalMinutes);
  if (hours === 0) return t('home.inMinutes', { count: minutes });
  const h = t('time.hours', { count: hours });
  const duration = minutes === 0 ? h : t('time.hoursAndMinutes', { hours: h, minutes: t('time.minutes', { count: minutes }) });
  return t('home.inDuration', { duration });
}
