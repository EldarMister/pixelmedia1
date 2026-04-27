import type { OrderStatus, OrderType, PaymentStatus, Period } from "../types";

export const ORDER_TYPES: Array<{
  key: OrderType;
  label: string;
  shortLabel: string;
  color: string;
  bg: string;
  border: string;
}> = [
  {
    key: "wedding",
    label: "Свадьба",
    shortLabel: "Свадьба",
    color: "text-rose-300",
    bg: "bg-rose-500/10",
    border: "border-rose-400/30"
  },
  {
    key: "school",
    label: "Школьный",
    shortLabel: "Школа",
    color: "text-emerald-300",
    bg: "bg-emerald-500/10",
    border: "border-emerald-400/30"
  },
  {
    key: "ads",
    label: "Реклама",
    shortLabel: "Реклама",
    color: "text-violet-300",
    bg: "bg-violet-500/10",
    border: "border-violet-400/30"
  },
  {
    key: "design",
    label: "Дизайн",
    shortLabel: "Дизайн",
    color: "text-blue-300",
    bg: "bg-blue-500/10",
    border: "border-blue-400/30"
  }
];

export const ORDER_STATUSES: OrderStatus[] = [
  "Новый",
  "Подготовка",
  "В работе",
  "На согласовании",
  "Ожидает оплаты",
  "Подтверждён",
  "Готово",
  "Отменён"
];

export const PAYMENT_STATUSES: PaymentStatus[] = [
  "Не оплачено",
  "Аванс",
  "Частично оплачено",
  "Оплачено"
];

export const PERIODS: Array<{ key: Period; label: string }> = [
  { key: "today", label: "Сегодня" },
  { key: "week", label: "Неделя" },
  { key: "month", label: "Месяц" },
  { key: "year", label: "Год" }
];

export const TYPE_LABELS = ORDER_TYPES.reduce(
  (acc, item) => ({ ...acc, [item.key]: item.label }),
  {} as Record<OrderType, string>
);

export const STATUS_BADGE: Record<OrderStatus, string> = {
  "Новый": "bg-blue-500/10 text-blue-200 border-blue-400/20",
  "Подготовка": "bg-violet-500/10 text-violet-200 border-violet-400/20",
  "В работе": "bg-blue-500/10 text-blue-200 border-blue-400/20",
  "На согласовании": "bg-amber-500/10 text-amber-200 border-amber-400/20",
  "Ожидает оплаты": "bg-slate-400/10 text-slate-200 border-slate-300/20",
  "Подтверждён": "bg-emerald-500/10 text-emerald-200 border-emerald-400/20",
  "Готово": "bg-emerald-500/10 text-emerald-200 border-emerald-400/20",
  "Отменён": "bg-red-500/10 text-red-200 border-red-400/20"
};
