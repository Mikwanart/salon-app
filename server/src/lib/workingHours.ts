/**
 * Working hours are stored as JSON on the Stylist model, shaped like:
 * {
 *   "sun": null,                          // day off
 *   "mon": { "start": "09:00", "end": "18:00" },
 *   "tue": { "start": "09:00", "end": "18:00" },
 *   ...
 * }
 *
 * If a stylist has no `workingHours` set at all (null/undefined), we treat
 * them as having no restriction — this keeps existing stylists from any
 * earlier data working exactly as before.
 */

export const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
export type DayKey = typeof DAY_KEYS[number];

export const DAY_LABELS: Record<DayKey, string> = {
  sun: 'Sunday', mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday',
  thu: 'Thursday', fri: 'Friday', sat: 'Saturday',
};

export interface DayHours {
  start: string; // "HH:MM", 24-hour
  end: string;   // "HH:MM", 24-hour
}

export type WorkingHours = Partial<Record<DayKey, DayHours | null>>;

const toMinutes = (hhmm: string): number | null => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm?.trim() || '');
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
};

export interface WorkingHoursCheckResult {
  ok: boolean;
  reason?: string;
}

/**
 * Checks whether an appointment starting at `date` and lasting `durationMinutes`
 * falls entirely within the stylist's configured working hours for that day.
 */
export const checkWithinWorkingHours = (
  workingHours: WorkingHours | null | undefined,
  date: Date,
  durationMinutes: number
): WorkingHoursCheckResult => {
  if (!workingHours) {
    // No schedule configured for this stylist — don't restrict.
    return { ok: true };
  }

  const dayKey = DAY_KEYS[date.getDay()];
  const dayHours = workingHours[dayKey];

  if (!dayHours) {
    return { ok: false, reason: `This stylist does not work on ${DAY_LABELS[dayKey]}s.` };
  }

  const startMinutes = toMinutes(dayHours.start);
  const endMinutes = toMinutes(dayHours.end);
  if (startMinutes === null || endMinutes === null || startMinutes >= endMinutes) {
    // Malformed configuration — fail safe by not restricting, rather than
    // blocking every booking because of a data entry mistake.
    return { ok: true };
  }

  const apptStartMinutes = date.getHours() * 60 + date.getMinutes();
  const apptEndMinutes = apptStartMinutes + durationMinutes;

  if (apptStartMinutes < startMinutes || apptEndMinutes > endMinutes) {
    return {
      ok: false,
      reason: `This stylist is only available on ${DAY_LABELS[dayKey]}s from ${dayHours.start} to ${dayHours.end}.`,
    };
  }

  return { ok: true };
};

/**
 * Validates the raw shape of a workingHours object coming from a request body.
 * Returns an error string if invalid, or null if it's acceptable (including
 * `null`/`undefined`, which just means "no schedule set").
 */
export const validateWorkingHoursShape = (value: any): string | null => {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'object' || Array.isArray(value)) {
    return 'workingHours must be an object keyed by day (sun, mon, tue, ...)';
  }

  for (const key of Object.keys(value)) {
    if (!DAY_KEYS.includes(key as DayKey)) {
      return `Invalid day key "${key}". Must be one of: ${DAY_KEYS.join(', ')}`;
    }
    const dayValue = value[key];
    if (dayValue === null) continue; // day off is valid
    if (
      typeof dayValue !== 'object' ||
      typeof dayValue.start !== 'string' ||
      typeof dayValue.end !== 'string' ||
      toMinutes(dayValue.start) === null ||
      toMinutes(dayValue.end) === null
    ) {
      return `Invalid hours for "${key}". Expected { start: "HH:MM", end: "HH:MM" } or null.`;
    }
  }

  return null;
};
