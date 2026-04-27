import { CalendarDays, ClipboardList, FileText, MapPin, PenLine, Phone, Trash2, UserRound, WalletCards } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import { StatusBadge, TypeBadge } from "../components/Badges";
import { formatLongDate } from "../lib/date";
import { money } from "../lib/format";
import type { Order } from "../types";

export function OrderDetails({
  orders,
  onEditOrder,
  onDeleteOrder,
  onRestoreOrder,
  onAddNote,
  onDeleteNote
}: {
  orders: Order[];
  onEditOrder: (order: Order) => void;
  onDeleteOrder: (id: string) => Promise<void>;
  onRestoreOrder: (id: string) => Promise<void>;
  onAddNote: (orderId: string, text: string) => Promise<void>;
  onDeleteNote: (noteId: string) => Promise<void>;
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(() => orders.find((item) => item.id === id) || null);
  const [noteText, setNoteText] = useState("");

  useEffect(() => {
    if (!id) return;
    const localOrder = orders.find((item) => item.id === id);
    if (localOrder) setOrder((current) => (current ? { ...localOrder, ...current } : localOrder));
    api.getOrder(id).then(setOrder).catch(() => undefined);
  }, [id, orders]);

  const balance = useMemo(() => (order ? Math.max(order.amount - order.deposit, 0) : 0), [order]);

  if (!order) {
    return (
      <div className="panel p-8 text-center">
        <h1 className="text-xl font-bold text-white">Заказ не найден</h1>
        <button type="button" onClick={() => navigate("/orders")} className="primary-button mt-4">
          Вернуться к заказам
        </button>
      </div>
    );
  }

  const submitNote = async (event: FormEvent) => {
    event.preventDefault();
    if (!noteText.trim()) return;
    await onAddNote(order.id, noteText.trim());
    setOrder(await api.getOrder(order.id));
    setNoteText("");
  };

  const deleteNote = async (noteId: string) => {
    await onDeleteNote(noteId);
    setOrder((current) =>
      current ? { ...current, notes: (current.notes || []).filter((note) => note.id !== noteId) } : current
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-4 flex items-center gap-2 text-sm">
            <Link to="/orders" className="font-medium text-blue-300 hover:text-white">
              Заказы
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400">{order.clientName}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold text-white">{order.clientName}</h1>
            <StatusBadge status={order.status} />
            <TypeBadge type={order.type} />
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => onEditOrder(order)} className="secondary-button">
            <PenLine className="h-4 w-4" /> Редактировать
          </button>
          {order.deletedAt ? (
            <button type="button" onClick={() => void onRestoreOrder(order.id)} className="secondary-button">
              Восстановить
            </button>
          ) : (
            <button type="button" onClick={() => void onDeleteOrder(order.id)} className="secondary-button">
              <Trash2 className="h-4 w-4" /> В корзину
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.9fr]">
        <div className="space-y-5">
          <section className="panel p-5">
            <h2 className="mb-5 text-xl font-bold text-white">Основная информация</h2>
            <div className="grid gap-1">
              {[
                { icon: UserRound, label: "Клиент", value: order.clientName },
                { icon: Phone, label: "Телефон", value: order.phone },
                { icon: CalendarDays, label: "Дата", value: formatLongDate(order.date, order.time) },
                { icon: MapPin, label: "Место", value: order.location || "Не указано" },
                { icon: ClipboardList, label: "Тип услуги", value: order.serviceType },
                { icon: UserRound, label: "Оператор", value: order.operator || "Не назначен" },
                { icon: FileText, label: "Детали", value: order.details || "Нет деталей" }
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="grid grid-cols-[28px_minmax(110px,180px)_1fr] items-start gap-3 border-b border-white/10 py-3 last:border-0">
                    <Icon className="mt-0.5 h-4 w-4 text-slate-500" />
                    <span className="text-sm text-slate-400">{item.label}</span>
                    <span className="text-sm font-medium text-slate-100">{item.value}</span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="panel p-5">
            <h2 className="mb-5 text-xl font-bold text-white">Финансы</h2>
            <div className="grid gap-4 sm:grid-cols-4">
              <FinanceItem label="Итого" value={money(order.amount)} />
              <FinanceItem label="Аванс" value={money(order.deposit)} helper={order.amount ? `${Math.round((order.deposit / order.amount) * 100)}%` : "0%"} />
              <FinanceItem label="Остаток" value={money(balance)} helper={order.amount ? `${Math.round((balance / order.amount) * 100)}%` : "0%"} />
              <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-4">
                <p className="text-sm text-slate-400">Статус оплаты</p>
                <p className="mt-2 font-semibold text-emerald-200">{order.paymentStatus}</p>
              </div>
            </div>
          </section>

          <section className="panel p-5">
            <h2 className="mb-4 text-xl font-bold text-white">Услуги</h2>
            <div className="space-y-3">
              {(order.services || []).map((service) => (
                <div key={service.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className={`h-2 w-2 rounded-full ${service.completed ? "bg-emerald-400" : "bg-accent"}`} />
                    <span className="text-slate-100">{service.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-white">{money(service.price)}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="panel p-5">
            <h2 className="mb-5 text-xl font-bold text-white">Тайминг</h2>
            <div className="relative space-y-5">
              <span className="absolute bottom-4 left-[18px] top-4 w-px bg-white/10" />
              {(order.timeline || []).map((item) => (
                <div key={item.id} className="relative grid grid-cols-[38px_1fr_auto] gap-3">
                  <span className="z-10 flex h-9 w-9 items-center justify-center rounded-lg border border-blue-400/25 bg-blue-500/10 text-blue-200">
                    <CalendarDays className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-semibold text-white">{item.title}</p>
                    <p className="text-sm text-slate-400">{item.description}</p>
                  </div>
                  <div className="text-right text-sm">
                    <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-slate-200">{item.status}</span>
                    <p className="mt-2 text-slate-500">{new Date(item.eventDate).toLocaleDateString("ru-RU")}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="panel p-5">
            <h2 className="mb-4 text-xl font-bold text-white">Заметки</h2>
            <form onSubmit={submitNote} className="mb-4 space-y-3">
              <textarea
                className="field min-h-[84px]"
                value={noteText}
                onChange={(event) => setNoteText(event.target.value)}
                placeholder="Добавить заметку по заказу"
              />
              <button type="submit" className="primary-button w-full">
                Добавить заметку
              </button>
            </form>
            <div className="space-y-3">
              {(order.notes || []).map((note) => (
                <article key={note.id} className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-slate-100">{note.text}</p>
                  <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500">
                    <span>{new Date(note.createdAt).toLocaleString("ru-RU")}</span>
                    <button type="button" onClick={() => void deleteNote(note.id)} className="text-red-200 hover:text-red-100">
                      Удалить
                    </button>
                  </div>
                </article>
              ))}
              {!order.notes?.length && <p className="text-sm text-slate-400">Заметок пока нет.</p>}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function FinanceItem({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
      <WalletCards className="mb-3 h-5 w-5 text-blue-300" />
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-bold text-white">{value}</p>
      {helper && <p className="mt-1 text-sm text-slate-500">{helper}</p>}
    </div>
  );
}
