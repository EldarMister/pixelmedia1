import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { formatMonth, getCalendarDays, isSameDay, isSameMonth, toDateKey } from "../lib/date";
import type { Order } from "../types";

export function MiniCalendar({
  orders,
  selectedDate,
  onSelectDate
}: {
  orders: Order[];
  selectedDate?: string;
  onSelectDate?: (date: string) => void;
}) {
  const [month, setMonth] = useState(() => new Date());
  const days = useMemo(() => getCalendarDays(month), [month]);
  const eventsByDate = useMemo(() => {
    const map = new Map<string, { count: number; past: boolean }>();
    orders
      .filter((order) => !order.deletedAt)
      .forEach((order) => {
        const current = map.get(order.date) || { count: 0, past: order.date < toDateKey(new Date()) };
        map.set(order.date, {
          count: current.count + 1,
          past: current.past || order.date < toDateKey(new Date())
        });
      });
    return map;
  }, [orders]);

  const changeMonth = (direction: number) => {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
  };

  return (
    <section className="panel p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Календарь</h2>
          <p className="text-sm capitalize text-slate-400">{formatMonth(month)}</p>
        </div>
        <div className="flex gap-2">
          <button className="icon-button h-9 w-9" type="button" onClick={() => changeMonth(-1)} aria-label="Предыдущий месяц">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button className="icon-button h-9 w-9" type="button" onClick={() => changeMonth(1)} aria-label="Следующий месяц">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-y-2 text-center text-xs text-slate-400">
        {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day) => (
          <span key={day}>{day}</span>
        ))}
        {days.map((day) => {
          const key = toDateKey(day);
          const event = eventsByDate.get(key);
          const hasEvent = Boolean(event?.count);
          const today = isSameDay(day, new Date());
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDate?.(key)}
              className={`mx-auto flex h-9 w-9 flex-col items-center justify-center rounded-lg text-sm transition ${
                selectedDate === key
                  ? "bg-accent text-white ring-1 ring-accent/60"
                  : hasEvent
                  ? event?.past
                    ? "bg-red-500/20 text-red-100 ring-1 ring-red-400/30"
                    : "bg-emerald-500/20 text-emerald-100 ring-1 ring-emerald-400/30"
                  : today
                    ? "bg-accent text-white"
                    : isSameMonth(day, month)
                      ? "text-white hover:bg-white/10"
                      : "text-slate-600"
              }`}
            >
              {day.getDate()}
              {hasEvent && (
                <span className={`mt-0.5 h-1.5 w-1.5 rounded-full ${event?.past ? "bg-red-300" : "bg-emerald-300"}`} />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
