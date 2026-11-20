import { NativeModule, requireOptionalNativeModule } from 'expo';
import type { AlarmPermissionStatus, FgAlarmModuleEvents, NativeAlarmSpec } from './FgAlarm.types';

declare class FgAlarmNativeModule extends NativeModule<FgAlarmModuleEvents> {
  /** False on iOS < 26 (no AlarmKit). */
  isSupported(): boolean;
  getPermissionStatus(): Promise<AlarmPermissionStatus>;
  /** iOS: AlarmKit authorization prompt. Android: notification permission prompt (13+). */
  requestPermissions(): Promise<AlarmPermissionStatus>;
  /** Android: opens the system page for the full-screen alarm permission (14+). */
  openFullScreenSettings(): Promise<void>;
  /** Replaces alarms with the same id. */
  schedule(alarms: NativeAlarmSpec[]): Promise<void>;
  cancel(ids: string[]): Promise<void>;
  /** Alarms still scheduled (or ringing) by this app. */
  list(): Promise<NativeAlarmSpec[]>;
  stopRinging(): Promise<void>;
  /** Id of the alarm currently ringing, if any. */
  ringingAlarmId(): Promise<string | null>;
  /**
   * Alarm whose mission the user asked to start from the system alarm UI (iOS "Start
   * mission" button), cleared once read. Android opens the mission via a deep link.
   */
  consumePendingMission(): Promise<string | null>;
}

// Optional: the module is missing in Expo Go and in a dev build made before it was added.
export default requireOptionalNativeModule<FgAlarmNativeModule>('FgAlarm');
