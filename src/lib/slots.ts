// Business hours for HEAT The Fitness Studio (Δεληγιώργη 119-121, Πειραιάς).
// Source: https://www.heat-fitness-studio.com
// Each session is 1 hour. Capacity per slot is 7 people.

export const SLOT_CAPACITY = 7;

// 0 = Sunday ... 6 = Saturday (JS Date.getDay() convention)
// Each range is [startHour, endHour) in 24h local (Europe/Athens) time.
type Range = { start: number; end: number };

const HOURS: Record<number, Range[]> = {
  0: [], // Κυριακή - κλειστά
  1: [{ start: 9, end: 13 }, { start: 17, end: 22 }], // Δευτέρα
  2: [{ start: 10, end: 13 }, { start: 16, end: 22 }], // Τρίτη
  3: [{ start: 9, end: 13 }, { start: 17, end: 22 }], // Τετάρτη
  4: [{ start: 10, end: 13 }, { start: 16, end: 22 }], // Πέμπτη
  5: [{ start: 9, end: 13 }, { start: 17, end: 22 }], // Παρασκευή
  6: [{ start: 9, end: 15 }], // Σάββατο
};

export const DAY_LABELS_EL = ["ΚΥΡ", "ΔΕΥ", "ΤΡΙ", "ΤΕΤ", "ΠΕΜ", "ΠΑΡ", "ΣΑΒ"];

// Returns the list of local start-hours (integers) available on a given
// JS Date (only the y/m/d parts of `date` are used).
export function getSlotHoursForDate(date: Date): number[] {
  const ranges = HOURS[date.getDay()] ?? [];
  const hours: number[] = [];
  for (const r of ranges) {
    for (let h = r.start; h < r.end; h++) hours.push(h);
  }
  return hours;
}

// Builds a Date representing `hour`:00 local Athens time on the same
// calendar day as `dateStr` (YYYY-MM-DD). We keep it simple and treat the
// server/client as running in Europe/Athens; if you deploy across other
// timezones, switch this to a proper tz library (e.g. date-fns-tz).
export function slotDateTime(dateStr: string, hour: number): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d, hour, 0, 0, 0);
}

export function formatDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

