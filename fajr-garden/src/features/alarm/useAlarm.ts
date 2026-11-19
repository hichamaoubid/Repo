import { router } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState } from 'react-native';
import type { AppSettings } from '../../lib/settings';
import { storage } from '../settings/storage';
import { createAlarmService } from './alarmService';
import { alarmNative, pendingMissionAlarmId } from './nativeAlarm';

export const alarmService = createAlarmService(alarmNative, storage);

/**
 * Keeps native alarms in line with the settings: on every settings change and whenever
 * the app comes back to the foreground (a new day may need planning). Also opens the
 * mission screen when the app is opened while an alarm rings.
 */
export function useAlarmSync(settings: AppSettings): void {
  const { t } = useTranslation();

  useEffect(() => {
    const texts = { title: t('alarm.notificationTitle'), body: t('alarm.notificationBody') };
    const run = () => {
      alarmService.sync(settings, new Date(), texts).catch(() => {
        // A failed sync is retried on the next foreground; the UI shows permission problems.
      });
      pendingMissionAlarmId()
        .then((id) => {
          if (id) router.push({ pathname: '/mission', params: { alarmId: id } });
        })
        .catch(() => {});
    };
    run();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') run();
    });
    return () => sub.remove();
  }, [settings, t]);
}
