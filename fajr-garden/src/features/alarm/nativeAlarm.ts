import FgAlarm from '../../../modules/fg-alarm';
import type { AlarmPermissionStatus } from '../../../modules/fg-alarm';
import type { AlarmNative } from './alarmService';

/** Adapter from the fg-alarm native module to the service's interface. Null-safe on web. */
export const alarmNative: AlarmNative = {
  isSupported: () => !!FgAlarm && FgAlarm.isSupported(),
  list: async () => (FgAlarm ? FgAlarm.list() : []),
  schedule: async (alarms) => {
    if (FgAlarm) await FgAlarm.schedule(alarms);
  },
  cancel: async (ids) => {
    if (FgAlarm) await FgAlarm.cancel(ids);
  },
  stopRinging: async () => {
    if (FgAlarm) await FgAlarm.stopRinging();
  },
};

const UNSUPPORTED: AlarmPermissionStatus = { canSchedule: false, canShowFullScreen: false, notificationsAllowed: false };

export const alarmPermissions = {
  status: async (): Promise<AlarmPermissionStatus> => (FgAlarm ? FgAlarm.getPermissionStatus() : UNSUPPORTED),
  request: async (): Promise<AlarmPermissionStatus> => (FgAlarm ? FgAlarm.requestPermissions() : UNSUPPORTED),
  openFullScreenSettings: async () => {
    if (FgAlarm) await FgAlarm.openFullScreenSettings();
  },
};

/** Alarm id the mission screen should handle now, if any (ringing, or picked from the iOS alarm UI). */
export async function pendingMissionAlarmId(): Promise<string | null> {
  if (!FgAlarm) return null;
  return (await FgAlarm.consumePendingMission()) ?? (await FgAlarm.ringingAlarmId());
}
