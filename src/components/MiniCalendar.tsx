import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { formatMonth, getCalendarDays, isSameDay, isSameMonth, toDateKey } from "../lib/date";
import type { Order } from "../types";

export function MiniCalendar({ orders, onSelectDate }: { orders: Order[]; onSelectDate?: (date: string) => void }) {
  const [month, setMonth] = useState(() => new Date());
  const days = useMemo(() => getCalendarDays(month), [month]);
  const eventsByDate = useMemo(() => {
    const map = new Map<string, number>();
    orders
      .filter((order) => !order.deletedAt)
      .forEach((order) => map.set(order.date, (map.get(order.date) || 0) + 1));
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
          const count = eventsByDate.get(key) || 0;
          const today = isSameDay(day, new Date());
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDate?.(key)}
              className={`mx-auto flex h-9 w-9 flex-col items-center justify-center rounded-lg text-sm transition ${
                today ? "bg-accent text-white" : isSameMonth(day, month) ? "text-white hover:bg-white/10" : "text-slate-600"
              }`}
            >
              {day.getDate()}
              {count > 0 && <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-accent" />}
            </button>
          );
        })}
      </div>
    </section>
  );
}
