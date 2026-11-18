/** Qibla direction by great-circle initial bearing. Pure TypeScript, no React imports. */
import type { Coords } from '../prayer';

export const KAABA: Coords = { latitude: 21.4225, longitude: 39.8262 };
export const ALIGNED_WITHIN_DEG = 3;
export const CALIBRATION_THRESHOLD_DEG = 15;

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

/** Initial great-circle bearing from `from` to the Kaaba, degrees clockwise from true north. */
export function qiblaBearing(from: Coords): number {
  if (Math.abs(from.latitude - KAABA.latitude) < 1e-6 && Math.abs(from.longitude - KAABA.longitude) < 1e-6) {
    throw new Error('qibla is undefined at the Kaaba itself');
  }
  const phi1 = rad(from.latitude);
  const phi2 = rad(KAABA.latitude);
  const dLambda = rad(KAABA.longitude - from.longitude);
  const y = Math.sin(dLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);
  return (deg(Math.atan2(y, x)) + 360) % 360;
}

export interface Alignment {
  aligned: boolean;
  /** Shortest turn to face the qibla, positive = clockwise, rounded to whole degrees. */
  turnDegrees: number;
  needsCalibration?: true;
}

/**
 * Compare the device's true heading with the qibla bearing.
 * `headingAccuracyDeg` is the platform's reported accuracy, when available.
 */
export function alignmentState(headingDeg: number, qiblaDeg: number, headingAccuracyDeg?: number): Alignment {
  const turn = ((qiblaDeg - headingDeg + 540) % 360) - 180;
  const result: Alignment = { aligned: Math.abs(turn) <= ALIGNED_WITHIN_DEG, turnDegrees: Math.round(turn) };
  if (headingAccuracyDeg !== undefined && headingAccuracyDeg > CALIBRATION_THRESHOLD_DEG) {
    return { ...result, aligned: false, needsCalibration: true };
  }
  return result;
}
