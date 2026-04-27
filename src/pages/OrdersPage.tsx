import { ChevronDown, ChevronRight, MoreHorizontal, RotateCcw, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { StatusBadge, TypeBadge } from "../components/Badges";
import { ORDER_TYPES } from "../data/constants";
import { formatOrderDate } from "../lib/date";
import { money } from "../lib/format";
import type { Order, OrderType } from "../types";

type Tab = "all" | "active" | "done" | "trash";

const tabs: Array<{ key: Tab; label: string }> = [
  { key: "all", label: "Все" },
  { key: "active", label: "Активные" },
  { key: "done", label: "Готово" },
  { key: "trash", label: "Корзина" }
];

export function OrdersPage({
  orders,
  search,
  onSearchChange,
  onNewOrder,
  onEditOrder,
  onDeleteOrder,
  onRestoreOrder
}: {
  orders: Order[];
  search: string;
  onSearchChange: (value: string) => void;
  onNewOrder: () => void;
  onEditOrder: (order: Order) => void;
  onDeleteOrder: (id: string) => Promise<void>;
  onRestoreOrder: (id: string) => Promise<void>;
}) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("all");
  const [typeFilter, setTypeFilter] = useState<OrderType | "all">("all");
  const [sortAsc, setSortAsc] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const filteredOrders = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return orders
      .filter((order) => {
        if (tab === "trash") return Boolean(order.deletedAt);
        if (order.deletedAt) return false;
        if (tab === "active") return order.status !== "Готово" && order.status !== "Отменён";
        if (tab === "done") return order.status === "Готово";
        return true;
      })
      .filter((order) => (typeFilter === "all" ? true : order.type === typeFilter))
      .filter((order) => {
        if (!normalized) return true;
        return [order.clientName, order.phone, order.serviceType, order.email || ""]
          .join(" ")
          .toLowerCase()
          .includes(normalized);
      })
      .sort((a, b) => {
        const value = `${a.date}${a.time || ""}`.localeCompare(`${b.date}${b.time || ""}`);
        return sortAsc ? value : -value;
      });
  }, [orders, search, sortAsc, tab, typeFilter]);

  const actionMenu = (order: Order) => (
    <div className="absolute right-0 top-11 z-20 w-48 rounded-lg border border-white/10 bg-navy-800 p-1 shadow-soft">
      <button
        type="button"
        onClick={() => {
          setOpenMenuId(null);
          onEditOrder(order);
        }}
        className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/10"
      >
        Редактировать
      </button>
      {order.deletedAt ? (
        <button
          type="button"
          onClick={() => {
            setOpenMenuId(null);
            void onRestoreOrder(order.id);
          }}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-emerald-200 hover:bg-white/10"
        >
          <RotateCcw className="h-4 w-4" /> Восстановить
        </button>
      ) : (
        <button
          type="button"
          onClick={() => {
            setOpenMenuId(null);
            void onDeleteOrder(order.id);
          }}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-200 hover:bg-white/10"
        >
          <Trash2 className="h-4 w-4" /> В корзину
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white md:text-4xl">Заказы</h1>
          <p className="mt-2 text-slate-400">Управляйте заказами и отслеживайте их статус</p>
        </div>
        <button type="button" onClick={onNewOrder} className="primary-button md:hidden">
          Новый заказ
        </button>
      </div>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex overflow-x-auto rounded-lg border border-white/10 bg-white/5 p-1">
          {tabs.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={`min-w-[104px] rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                tab === item.key ? "bg-accent text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setTypeFilter("all")}
            className={`secondary-button px-3 py-2 ${typeFilter === "all" ? "border-accent/50 bg-accent/20" : ""}`}
          >
            Все типы
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
      </div>

      <div className="relative max-w-xl">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
        <input
          className="field h-12 pl-12"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Поиск по клиенту, телефону, услуге"
        />
      </div>

      <section className="panel overflow-visible">
        <div className="hidden overflow-visible md:block">
          <table className="w-full table-fixed">
            <thead className="text-left text-sm text-slate-400">
              <tr className="border-b border-white/10">
                <th className="w-[25%] px-5 py-4 font-medium">Клиент</th>
                <th className="w-[21%] px-5 py-4 font-medium">Услуга / Тип</th>
                <th className="w-[14%] px-5 py-4 font-medium">
                  <button type="button" onClick={() => setSortAsc((value) => !value)} className="inline-flex items-center gap-1">
                    Дата <ChevronDown className={`h-4 w-4 transition ${sortAsc ? "" : "rotate-180"}`} />
                  </button>
                </th>
                <th className="w-[15%] px-5 py-4 font-medium">Статус</th>
                <th className="w-[12%] px-5 py-4 font-medium">Сумма</th>
                <th className="px-5 py-4 font-medium">Действие</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-b border-white/10 last:border-0">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <TypeBadge type={order.type} compact />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-white">{order.clientName}</p>
                        <p className="truncate text-sm text-slate-500">{order.email || order.phone} · {order.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-white">{order.serviceType}</p>
                    <p className="text-sm text-slate-500">{order.title}</p>
                  </td>
                  <td className="px-5 py-4 text-slate-300">{formatOrderDate(order.date, order.time)}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-5 py-4 font-medium text-white">{money(order.amount)}</td>
                  <td className="px-5 py-4">
                    <div className="relative flex items-center gap-3">
                      <button type="button" onClick={() => navigate(`/orders/${order.id}`)} className="inline-flex items-center gap-1 text-sm font-semibold text-blue-300 hover:text-white">
                        Открыть <ChevronRight className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => setOpenMenuId(openMenuId === order.id ? null : order.id)} className="icon-button h-10 w-10" aria-label="Действия">
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                      {openMenuId === order.id && actionMenu(order)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-2 p-2 md:hidden">
          {filteredOrders.map((order) => (
            <article key={order.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="grid grid-cols-[1fr_auto] gap-3">
                <div className="min-w-0">
                  <div className="mb-1.5">
                    <TypeBadge type={order.type} compact />
                  </div>
                  <h2 className="truncate text-sm font-semibold text-white">{order.clientName || "Без имени"}</h2>
                  <p className="truncate text-xs text-slate-400">{order.serviceType || "Без услуги"}</p>
                  <p className="mt-1 truncate text-xs text-slate-500">
                    {formatOrderDate(order.date, order.time)} · {money(order.amount)}
                  </p>
                </div>
                <div className="flex min-w-[116px] flex-col items-end justify-between gap-2">
                  <StatusBadge status={order.status} />
                  <div className="flex gap-1.5">
                    <button type="button" onClick={() => navigate(`/orders/${order.id}`)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-100">
                      Открыть
                    </button>
                    {order.deletedAt ? (
                      <button type="button" onClick={() => void onRestoreOrder(order.id)} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-emerald-200">
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    ) : (
                      <button type="button" onClick={() => onEditOrder(order)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-100">
                        Изм.
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {!filteredOrders.length && (
          <div className="px-5 py-12 text-center text-slate-400">
            Заказов по выбранным фильтрам нет.
          </div>
        )}
      </section>
    </div>
  );
}
