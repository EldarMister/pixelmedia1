import { BriefcaseBusiness, CalendarDays, ChevronRight, WalletCards } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { StatusBadge, TypeBadge } from "../components/Badges";
import { MetricCard } from "../components/MetricCard";
import { MiniCalendar } from "../components/MiniCalendar";
import { formatOrderDate, startOfWeek, toDateKey } from "../lib/date";
import { money } from "../lib/format";
import type { Order } from "../types";

export function Dashboard({ orders }: { orders: Order[] }) {
  const navigate = useNavigate();
  const today = toDateKey(new Date());
  const weekStart = startOfWeek(new Date());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const activeOrders = orders.filter((order) => !order.deletedAt && order.status !== "Готово" && order.status !== "Отменён");
  const weekOrders = orders.filter((order) => {
    const date = new Date(`${order.date}T00:00:00`);
    return !order.deletedAt && date >= weekStart && date < weekEnd;
  });
  const paymentDue = orders
    .filter((order) => !order.deletedAt && order.paymentStatus !== "Оплачено")
    .reduce((sum, order) => sum + Math.max(order.amount - order.deposit, 0), 0);
  const upcoming = orders
    .filter((order) => !order.deletedAt && order.date >= today)
    .sort((a, b) => `${a.date}${a.time || ""}`.localeCompare(`${b.date}${b.time || ""}`))
    .slice(0, 6);
  const todayOrders = orders
    .filter((order) => !order.deletedAt && order.date === today)
    .sort((a, b) => (a.time || "").localeCompare(b.time || ""));

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-3">
        <MetricCard icon={BriefcaseBusiness} label="Активные заказы" value={String(activeOrders.length)} helper="+ данные из CRM" tone="blue" />
        <MetricCard icon={CalendarDays} label="На этой неделе" value={String(weekOrders.length)} helper="событий и задач" tone="violet" />
        <MetricCard icon={WalletCards} label="Ожидается оплата" value={money(paymentDue)} helper={`${orders.filter((order) => !order.deletedAt && order.paymentStatus !== "Оплачено").length} заказа`} tone="orange" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(360px,1fr)]">
        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <h1 className="text-xl font-bold text-white">Ближайшие заказы</h1>
            <Link to="/orders" className="inline-flex items-center gap-1 text-sm font-medium text-slate-300 hover:text-white">
              Все заказы <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="hidden md:block">
            <table className="w-full table-fixed">
              <thead className="text-left text-sm text-slate-400">
                <tr className="border-b border-white/10">
                  <th className="w-[23%] px-5 py-4 font-medium">Тип</th>
                  <th className="w-[25%] px-5 py-4 font-medium">Клиент</th>
                  <th className="w-[20%] px-5 py-4 font-medium">Дата</th>
                  <th className="w-[20%] px-5 py-4 font-medium">Статус</th>
                  <th className="px-5 py-4 font-medium">Действие</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((order) => (
                  <tr key={order.id} className="border-b border-white/10 last:border-0">
                    <td className="px-5 py-4">
                      <TypeBadge type={order.type} />
                    </td>
                    <td className="px-5 py-4 font-medium text-white">{order.clientName}</td>
                    <td className="px-5 py-4 text-slate-300">{formatOrderDate(order.date, order.time)}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-4">
                      <button type="button" onClick={() => navigate(`/orders/${order.id}`)} className="secondary-button px-3 py-2">
                        Открыть
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-3 p-4 md:hidden">
            {upcoming.map((order) => (
              <button
                key={order.id}
                type="button"
                onClick={() => navigate(`/orders/${order.id}`)}
                className="w-full rounded-lg border border-white/10 bg-white/5 p-4 text-left"
              >
                <div className="flex items-center justify-between gap-3">
                  <TypeBadge type={order.type} />
                  <StatusBadge status={order.status} />
                </div>
                <p className="mt-3 font-semibold text-white">{order.clientName}</p>
                <p className="mt-1 text-sm text-slate-400">{formatOrderDate(order.date, order.time)}</p>
              </button>
            ))}
          </div>
        </section>

        <aside className="space-y-5">
          <section className="panel p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Сегодня</h2>
              <Link to="/calendar" className="text-sm text-slate-400 hover:text-white">
                Все события
              </Link>
            </div>
            <div className="space-y-4">
              {todayOrders.length ? (
                todayOrders.map((order) => (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => navigate(`/orders/${order.id}`)}
                    className="grid w-full grid-cols-[70px_1fr] gap-3 text-left"
                  >
                    <div className="text-sm">
                      <p className="font-semibold text-white">{order.time?.slice(0, 5) || "--:--"}</p>
                      <p className="text-slate-500">{order.serviceType}</p>
                    </div>
                    <div className="border-l border-white/10 pl-4">
                      <p className="font-medium text-white">{order.clientName}</p>
                      <p className="text-sm text-slate-400">{order.location || "Локация не указана"}</p>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-sm text-slate-400">На сегодня событий нет.</p>
              )}
            </div>
          </section>
          <MiniCalendar orders={orders} onSelectDate={() => navigate("/calendar")} />
        </aside>
      </div>
    </div>
  );
}
