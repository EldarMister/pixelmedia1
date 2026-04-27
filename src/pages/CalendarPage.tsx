import { CalendarDays, ChevronLeft, ChevronRight, Grid2X2, ListChecks } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TypeBadge } from "../components/Badges";
import { ORDER_TYPES } from "../data/constants";
import { formatMonth, formatOrderDate, getCalendarDays, isSameDay, isSameMonth, toDateKey } from "../lib/date";
import type { Order, OrderType } from "../types";

export function CalendarPage({ orders }: { orders: Order[] }) {
  const navigate = useNavigate();
  const [month, setMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
  const [typeFilter, setTypeFilter] = useState<OrderType | "all">("all");

  const visibleOrders = useMemo(
    () => orders.filter((order) => !order.deletedAt && (typeFilter === "all" || order.type === typeFilter)),
    [orders, typeFilter]
  );

  const eventsByDay = useMemo(() => {
    const map = new Map<string, Order[]>();
    visibleOrders.forEach((order) => {
      const list = map.get(order.date) || [];
      list.push(order);
      map.set(order.date, list);
    });
    return map;
  }, [visibleOrders]);

  const days = useMemo(() => getCalendarDays(month), [month]);
  const selectedEvents = (eventsByDay.get(selectedDate) || []).sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  const weekEvents = visibleOrders.filter((order) => {
    const now = new Date();
    const target = new Date(`${order.date}T00:00:00`);
    const diff = target.getTime() - now.setHours(0, 0, 0, 0);
    return diff >= 0 && diff < 7 * 86400000;
  });

  const changeMonth = (direction: number) => {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-white md:text-4xl">Календарь</h1>
        <p className="mt-2 text-slate-400">Планируйте события, встречи и задачи вашей команды.</p>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setTypeFilter("all")}
          className={`secondary-button px-3 py-2 ${typeFilter === "all" ? "border-accent/50 bg-accent/20" : ""}`}
        >
          <Grid2X2 className="h-4 w-4" /> Все
        </button>
        {ORDER_TYPES.map((type) => (
          <button
            key={type.key}
            type="button"
            onClick={() => setTypeFilter(type.key)}
            className={`secondary-button px-3 py-2 ${typeFilter === type.key ? "border-accent/50 bg-accent/20" : ""}`}
          >
            <TypeBadge type={type.key} compact />
            {type.label}
          </button>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(360px,1fr)]">
        <section className="panel overflow-hidden p-4 md:p-6">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => changeMonth(-1)} className="icon-button" aria-label="Предыдущий месяц">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button type="button" onClick={() => changeMonth(1)} className="icon-button" aria-label="Следующий месяц">
                <ChevronRight className="h-5 w-5" />
              </button>
              <h2 className="min-w-[190px] text-center text-2xl font-bold capitalize text-white">{formatMonth(month)}</h2>
            </div>
            <div className="flex rounded-lg border border-white/10 bg-white/5 p-1 text-sm text-slate-400">
              <span className="rounded-lg bg-accent px-4 py-2 font-semibold text-white">Месяц</span>
              <span className="px-4 py-2">Неделя</span>
              <span className="px-4 py-2">День</span>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-l border-white/10 text-sm">
            {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day) => (
              <div key={day} className="border-r border-t border-white/10 px-2 py-3 text-center text-slate-400">
                {day}
              </div>
            ))}
            {days.map((day) => {
              const key = toDateKey(day);
              const dayEvents = eventsByDay.get(key) || [];
              const selected = key === selectedDate;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDate(key)}
                  className={`min-h-[118px] border-r border-t border-white/10 p-2 text-left transition hover:bg-white/5 ${
                    selected ? "bg-accent/10" : ""
                  }`}
                >
                  <span
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold ${
                      isSameDay(day, new Date())
                        ? "bg-accent text-white"
                        : isSameMonth(day, month)
                          ? "text-white"
                          : "text-slate-600"
                    }`}
                  >
                    {day.getDate()}
                  </span>
                  <div className="mt-2 space-y-1">
                    {dayEvents.slice(0, 2).map((order) => (
                      <span key={order.id} className="block truncate rounded-lg border border-white/10 bg-white/[0.06] px-2 py-1 text-xs text-slate-200">
                        {order.time?.slice(0, 5)} {order.clientName}
                      </span>
                    ))}
                    {dayEvents.length > 2 && <span className="block text-xs text-blue-300">+{dayEvents.length - 2} события</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <aside className="space-y-5">
          <section className="panel grid grid-cols-2 divide-x divide-white/10 p-5">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-lg border border-blue-400/25 bg-blue-500/10 text-blue-200">
                <CalendarDays className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm text-slate-400">События сегодня</p>
                <p className="text-3xl font-bold text-white">{eventsByDay.get(toDateKey(new Date()))?.length || 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 pl-5">
              <span className="flex h-14 w-14 items-center justify-center rounded-lg border border-violet-400/25 bg-violet-500/10 text-violet-200">
                <ListChecks className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm text-slate-400">На этой неделе</p>
                <p className="text-3xl font-bold text-white">{weekEvents.length}</p>
              </div>
            </div>
          </section>

          <section className="panel p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">События дня</h2>
                <p className="text-sm text-slate-400">{new Date(`${selectedDate}T00:00:00`).toLocaleDateString("ru-RU")}</p>
              </div>
              <CalendarDays className="h-5 w-5 text-slate-500" />
            </div>
            <div className="space-y-3">
              {selectedEvents.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => navigate(`/orders/${order.id}`)}
                  className="grid w-full grid-cols-[72px_1fr_auto] items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:border-accent/40"
                >
                  <div className="text-sm">
                    <p className="font-semibold text-white">{order.time?.slice(0, 5) || "--:--"}</p>
                    <p className="text-slate-500">{formatOrderDate(order.date).split(",")[0]}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">{order.serviceType}</p>
                    <p className="truncate text-sm text-slate-400">{order.clientName}</p>
                  </div>
                  <TypeBadge type={order.type} compact />
                </button>
              ))}
              {!selectedEvents.length && <p className="py-6 text-center text-sm text-slate-400">На выбранный день событий нет.</p>}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
