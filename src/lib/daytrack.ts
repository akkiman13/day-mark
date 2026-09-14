// DayTrack — Local-only data store using localStorage

export type DayStatus = "good" | "wasted";

export interface DayEntry {
  status: DayStatus;
  note?: string;
}

export type DayTrackData = Record<string, DayEntry>;

const STORAGE_KEY = "daytrack-data";

export function loadData(): DayTrackData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveData(data: DayTrackData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getDayStatus(
  data: DayTrackData,
  dateKey: string,
): DayStatus | null {
  const entry = data[dateKey];
  return entry ? entry.status : null;
}

export function setDayStatus(
  data: DayTrackData,
  dateKey: string,
  status: DayStatus,
): DayTrackData {
  const existing = data[dateKey];
  return {
    ...data,
    [dateKey]: {
      ...existing,
      status,
      note: existing?.note ?? "",
    },
  };
}

export function setDayNote(
  data: DayTrackData,
  dateKey: string,
  note: string,
): DayTrackData {
  const existing = data[dateKey];
  return {
    ...data,
    [dateKey]: {
      ...existing,
      status: existing?.status ?? ("good" as DayStatus),
      note,
    },
  };
}

export function clearDayStatus(
  data: DayTrackData,
  dateKey: string,
): DayTrackData {
  const copy = { ...data };
  delete copy[dateKey];
  return copy;
}

export function exportData(data: DayTrackData): string {
  return JSON.stringify(data, null, 2);
}

export function importData(jsonStr: string): DayTrackData {
  const parsed = JSON.parse(jsonStr);
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Invalid data format");
  }
  return parsed as DayTrackData;
}

// Date helpers

export function dateKeyFromDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function dateKeyFromParts(
  year: number,
  month: number,
  day: number,
): string {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

export function parseDateKey(key: string): Date | null {
  const parts = key.split("-");
  if (parts.length !== 3) return null;
  const [y, m, d] = parts.map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

// Calendar helpers

export interface CalendarDay {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isFuture: boolean;
}

export function getCalendarDays(year: number, month: number): CalendarDay[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Start from the Monday before the first day
  const startDay = new Date(firstDay);
  const dayOfWeek = startDay.getDay();
  // Convert to Monday-start: 0=Sun -> 6, 1=Mon -> 0, etc.
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  startDay.setDate(startDay.getDate() - mondayOffset);

  const days: CalendarDay[] = [];
  const current = new Date(startDay);

  // Fill 6 weeks (42 days) for consistent calendar grid
  for (let i = 0; i < 42; i++) {
    const date = new Date(current);
    date.setHours(0, 0, 0, 0);
    days.push({
      date,
      dayOfMonth: date.getDate(),
      isCurrentMonth: date.getMonth() === month && date.getFullYear() === year,
      isToday: date.getTime() === today.getTime(),
      isFuture: date.getTime() > today.getTime(),
    });
    current.setDate(current.getDate() + 1);
  }

  return days;
}

// Stats helpers

export interface MonthStats {
  goodDays: number;
  wastedDays: number;
  unmarkedDays: number;
  totalEvaluated: number;
  goodPercentage: number;
}

export function getMonthStats(
  data: DayTrackData,
  year: number,
  month: number,
): MonthStats {
  const lastDay = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let goodDays = 0;
  let wastedDays = 0;
  let unmarkedDays = 0;

  for (let d = 1; d <= lastDay; d++) {
    const date = new Date(year, month, d);
    date.setHours(0, 0, 0, 0);
    const key = dateKeyFromParts(year, month, d);
    const status = getDayStatus(data, key);

    // Don't count future days as unmarked
    if (date > today) continue;

    if (status === "good") goodDays++;
    else if (status === "wasted") wastedDays++;
    else unmarkedDays++;
  }

  const totalEvaluated = goodDays + wastedDays;
  const goodPercentage =
    totalEvaluated > 0 ? Math.round((goodDays / totalEvaluated) * 1000) / 10 : 0;

  return {
    goodDays,
    wastedDays,
    unmarkedDays,
    totalEvaluated,
    goodPercentage,
  };
}

// Streak helpers

export interface StreakInfo {
  current: number;
  best: number;
}

export function getStreaks(data: DayTrackData): StreakInfo {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Collect all dates with status, sorted descending
  const entries: Array<{ key: string; date: Date; status: DayStatus }> = [];

  for (const [key, entry] of Object.entries(data)) {
    if (entry.status) {
      const d = parseDateKey(key);
      if (d) {
        entries.push({ key, date: d, status: entry.status });
      }
    }
  }

  entries.sort((a, b) => b.date.getTime() - a.date.getTime());

  // Calculate current streak (from today backwards)
  let currentStreak = 0;
  let checkDate = new Date(today);
  // Check if today is marked; if not, start from yesterday
  const todayKey = dateKeyFromDate(today);
  const todayEntry = data[todayKey];
  if (!todayEntry?.status) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const key = dateKeyFromDate(checkDate);
    const entry = data[key];
    if (entry?.status === "good") {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Calculate best streak (scan all dates)
  // Sort ascending for best streak calculation
  entries.sort((a, b) => a.date.getTime() - b.date.getTime());

  let bestStreak = 0;
  let runStreak = 0;
  let lastDate: Date | null = null;

  for (const entry of entries) {
    if (entry.status === "good") {
      if (lastDate) {
        const diffDays = Math.round(
          (entry.date.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        if (diffDays === 1) {
          runStreak++;
        } else {
          runStreak = 1;
        }
      } else {
        runStreak = 1;
      }
      lastDate = entry.date;
      bestStreak = Math.max(bestStreak, runStreak);
    } else {
      // wasted day breaks the streak
      runStreak = 0;
      lastDate = null;
    }
  }

  // Also consider current streak for best
  bestStreak = Math.max(bestStreak, currentStreak);

  return { current: currentStreak, best: bestStreak };
}

// History helpers

export interface HistoryEntry {
  dateKey: string;
  date: Date;
  status: DayStatus | null;
  note: string;
}

export function getRecentHistory(
  data: DayTrackData,
  count: number = 14,
): HistoryEntry[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const entries: HistoryEntry[] = [];

  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = dateKeyFromDate(d);
    const entry = data[key];

    entries.push({
      dateKey: key,
      date: d,
      status: entry?.status ?? null,
      note: entry?.note ?? "",
    });
  }

  return entries;
}

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const DAY_NAMES_FULL = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
