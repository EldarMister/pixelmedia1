const ruDate = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
  weekday: "short"
});

const ruDateLong = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
  weekday: "short"
});

export function toDateKey(date: Date | string) {
  const value = typeof date === "string" ? new Date(`${date}T00:00:00`) : date;
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function toMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function formatOrderDate(date: string, time?: string | null) {
  const value = new Date(`${date}T00:00:00`);
  if (Number.isNaN(value.getTime())) return time ? `Дата не указана · ${time.slice(0, 5)}` : "Дата не указана";
  const formatted = ruDate.format(value).replace(".", "");
  return time ? `${formatted} · ${time.slice(0, 5)}` : formatted;
}

export function formatLongDate(date: string, time?: string | null) {
  const value = new Date(`${date}T00:00:00`);
  if (Number.isNaN(value.getTime())) return time ? `Дата не указана · ${time.slice(0, 5)}` : "Дата не указана";
  const formatted = ruDateLong.format(value).replace(".", "");
  return time ? `${formatted} · ${time.slice(0, 5)}` : formatted;
}

export function formatMonth(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    month: "long",
    year: "numeric"
  }).format(date);
}

export function addDays(base: Date, days: number) {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
}

export function startOfWeek(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay() || 7;
  start.setDate(start.getDate() - day + 1);
  return start;
}

export function getCalendarDays(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = startOfWeek(first);
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}

export function isSameDay(a: Date | string, b: Date | string) {
  return toDateKey(a) === toDateKey(b);
}

export function isSameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function periodRange(period: "today" | "week" | "month" | "year") {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (period === "today") {
    return { start, end: addDays(start, 1) };
  }
  if (period === "week") {
    const weekStart = startOfWeek(start);
    return { start: weekStart, end: addDays(weekStart, 7) };
  }
  if (period === "month") {
    const monthStart = new Date(start.getFullYear(), start.getMonth(), 1);
    return { start: monthStart, end: new Date(start.getFullYear(), start.getMonth() + 1, 1) };
  }
  const yearStart = new Date(start.getFullYear(), 0, 1);
  return { start: yearStart, end: new Date(start.getFullYear() + 1, 0, 1) };
}
