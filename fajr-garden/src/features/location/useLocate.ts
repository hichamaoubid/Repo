import { useCallback, useState } from 'react';
import { applyLocation } from '../../lib/settings';
import { settingsStore } from '../settings/useSettings';
import { locateDevice } from './locateDevice';

export type LocateStatus = 'idle' | 'locating' | 'denied' | 'unavailable';

/** Runs a one-off GPS fix and saves it. Errors surface as a status, never a crash. */
export function useLocate(): { status: LocateStatus; locate: () => Promise<boolean> } {
  const [status, setStatus] = useState<LocateStatus>('idle');
  const locate = useCallback(async () => {
    setStatus('locating');
    try {
      const result = await locateDevice();
      if (!result.ok) {
        setStatus(result.reason);
        return false;
      }
      settingsStore.update((s) => applyLocation(s, result.location));
      setStatus('idle');
      return true;
    } catch {
      setStatus('unavailable');
      return false;
    }
  }, []);
  return { status, locate };
}
