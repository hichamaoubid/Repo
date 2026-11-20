export interface NativeAlarmSpec {
  /** Stable id chosen by JS, e.g. "fajr-2026-05-11-0". */
  id: string;
  /** Epoch milliseconds. */
  fireAt: number;
  title: string;
  body: string;
}

export interface AlarmPermissionStatus {
  /** iOS: AlarmKit authorization. Android: exact alarms allowed. */
  canSchedule: boolean;
  /** Android 14+: full-screen intent allowed (the alarm screen over the lock screen). */
  canShowFullScreen: boolean;
  /** Android 13+: notification permission granted. */
  notificationsAllowed: boolean;
}

export type FgAlarmModuleEvents = Record<string, never>;
