/**
 * The private Fajr log: parsing (stored data is untrusted), appending and trimming.
 * Never leaves the device in this version.
 */
import type { CheckinState, FajrEvent } from '.';

/** About 13 months of daily entries (mission + check-in). */
export const MAX_EVENTS = 800;

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const STATES: readonly CheckinState[] = ['on_time', 'late', 'missed', 'made_up'];

function parseOne(v: unknown): FajrEvent | null {
  if (typeof v !== 'object' || v === null) return null;
  const o = v as Record<string, unknown>;
  if (typeof o.day !== 'string' || !DAY.test(o.day) || typeof o.recordedAt !== 'string') return null;
  const recordedAt = new Date(o.recordedAt);
  if (Number.isNaN(recordedAt.getTime())) return null;
  if (o.kind === 'mission_completed') return { kind: 'mission_completed', day: o.day, recordedAt };
  if (o.kind === 'checkin' && typeof o.state === 'string' && (STATES as readonly string[]).includes(o.state)) {
    return { kind: 'checkin', day: o.day, state: o.state as CheckinState, recordedAt };
  }
  return null;
}

export function parseEvents(raw: string | null | undefined): FajrEvent[] {
  if (!raw) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.map(parseOne).filter((e): e is FajrEvent => e !== null);
  } catch {
    return [];
  }
}

export function serializeEvents(events: readonly FajrEvent[]): string {
  return JSON.stringify(events);
}

/**
 * Adds an event. One mission completion per day; a manual check-in replaces the
 * previous manual check-in of the same day (the person corrected it).
 */
export function addEvent(events: readonly FajrEvent[], event: FajrEvent): FajrEvent[] {
  const others = events.filter((e) => !(e.day === event.day && e.kind === event.kind));
  const sameKind = events.find((e) => e.day === event.day && e.kind === event.kind);
  if (sameKind && event.kind === 'mission_completed') return [...events];
  const next = [...others, event].sort((a, b) => a.day.localeCompare(b.day) || a.recordedAt.getTime() - b.recordedAt.getTime());
  return next.slice(-MAX_EVENTS);
}
