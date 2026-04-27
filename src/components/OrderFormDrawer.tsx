import { X } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { ORDER_STATUSES, ORDER_TYPES, PAYMENT_STATUSES } from "../data/constants";
import type { Order, OrderPayload, OrderType } from "../types";

const emptyPayload: OrderPayload = {
  type: "wedding",
  title: "",
  clientName: "",
  phone: "",
  email: "",
  serviceType: "",
  date: new Date().toISOString().slice(0, 10),
  time: "10:00",
  location: "",
  amount: 0,
  deposit: 0,
  status: "Новый",
  paymentStatus: "Не оплачено",
  operator: "",
  details: "",
  note: "",
  services: []
};

const moneyInputValue = (value: number) => (value > 0 ? String(value) : "");

const parseMoneyInput = (value: string) => {
  const normalized = value.replace(/[^\d]/g, "");
  return normalized ? Number(normalized) : 0;
};

const typeHints: Record<OrderType, { client: string; date: string; location: string; service: string }> = {
  wedding: {
    client: "Клиент / пара",
    date: "Дата свадьбы",
    location: "Место",
    service: "Пакет съёмки"
  },
  school: {
    client: "Школа / класс",
    date: "Дата события",
    location: "Школа / кабинет",
    service: "Формат съёмки"
  },
  ads: {
    client: "Клиент / бизнес",
    date: "Дата съёмки",
    location: "Локация",
    service: "Тип бизнеса / ролика"
  },
  design: {
    client: "Клиент",
    date: "Дата сдачи",
    location: "Формат / размер",
    service: "Тип дизайна"
  }
};

function payloadFromOrder(order?: Order | null): OrderPayload {
  if (!order) return emptyPayload;
  return {
    type: order.type,
    title: order.title,
    clientName: order.clientName,
    phone: order.phone,
    email: order.email || "",
    serviceType: order.serviceType,
    date: order.date.slice(0, 10),
    time: order.time?.slice(0, 5) || "",
    location: order.location || "",
    amount: order.amount,
    deposit: order.deposit,
    status: order.status,
    paymentStatus: order.paymentStatus,
    operator: order.operator || "",
    details: order.details || "",
    note: "",
    services: order.services?.map((service) => ({
      name: service.name,
      price: service.price,
      completed: service.completed
    })) || []
  };
}

function servicesToText(order?: Order | null) {
  return (order?.services || [])
    .map((service) => `${service.name}${service.price ? ` — ${service.price}` : ""}`)
    .join("\n");
}

function parseServices(text: string, fallbackName: string, fallbackPrice: number) {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) {
    return [{ name: fallbackName || "Без услуги", price: fallbackPrice || 0, completed: false }];
  }
  return lines.map((line) => {
    const [name, price] = line.split(/[—-]/).map((part) => part.trim());
    return {
      name: name || "Без услуги",
      price: Number(price?.replace(/\D/g, "") || 0),
      completed: false
    };
  });
}

function normalizePayload(payload: OrderPayload, servicesText: string): OrderPayload {
  const clientName = payload.clientName.trim() || payload.title.trim() || "Без имени";
  const serviceType = payload.serviceType.trim() || "Без услуги";
  const today = new Date().toISOString().slice(0, 10);

  return {
    ...payload,
    title: payload.title.trim() || clientName,
    clientName,
    phone: payload.phone.trim(),
    email: payload.email?.trim() || "",
    serviceType,
    date: payload.date || today,
    time: payload.time || "",
    location: payload.location?.trim() || "",
    amount: Number.isFinite(Number(payload.amount)) ? Number(payload.amount) : 0,
    deposit: Number.isFinite(Number(payload.deposit)) ? Number(payload.deposit) : 0,
    operator: payload.operator?.trim() || "",
    details: payload.details?.trim() || "",
    note: payload.note?.trim() || "",
    services: parseServices(servicesText, serviceType, Number(payload.amount) || 0)
  };
}

export function OrderFormDrawer({
  open,
  order,
  onClose,
  onSubmit
}: {
  open: boolean;
  order?: Order | null;
  onClose: () => void;
  onSubmit: (payload: OrderPayload, orderId?: string) => Promise<void>;
}) {
  const [payload, setPayload] = useState<OrderPayload>(emptyPayload);
  const [servicesText, setServicesText] = useState("");
  const [saving, setSaving] = useState(false);
  const hints = useMemo(() => typeHints[payload.type], [payload.type]);

  useEffect(() => {
    if (!open) return;
    setPayload(payloadFromOrder(order));
    setServicesText(servicesToText(order));
  }, [open, order]);

  if (!open) return null;

  const update = <K extends keyof OrderPayload>(key: K, value: OrderPayload[K]) => {
    setPayload((current) => ({ ...current, [key]: value }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await onSubmit(normalizePayload(payload, servicesText), order?.id);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 p-3 backdrop-blur-sm">
      <form onSubmit={submit} className="panel flex h-full w-full max-w-[660px] flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-sm text-slate-400">{order ? "Редактирование" : "Новый заказ"}</p>
            <h2 className="text-xl font-bold text-white">{order ? order.clientName : "Добавить заказ"}</h2>
          </div>
          <button type="button" onClick={onClose} className="icon-button" aria-label="Закрыть">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="dark-scrollbar flex-1 overflow-y-auto p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="label">Тип заказа</span>
              <select className="field" value={payload.type} onChange={(event) => update("type", event.target.value as OrderType)}>
                {ORDER_TYPES.map((type) => (
                  <option key={type.key} value={type.key}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="label">Название заказа</span>
              <input className="field" value={payload.title} onChange={(event) => update("title", event.target.value)} placeholder="Например, Иван и Мария" />
            </label>

            <label>
              <span className="label">{hints.client}</span>
              <input className="field" value={payload.clientName} onChange={(event) => update("clientName", event.target.value)} placeholder="Можно оставить пустым" />
            </label>

            <label>
              <span className="label">Телефон</span>
              <input className="field" value={payload.phone} onChange={(event) => update("phone", event.target.value)} placeholder="Можно добавить позже" />
            </label>

            <label>
              <span className="label">Email</span>
              <input className="field" value={payload.email} onChange={(event) => update("email", event.target.value)} />
            </label>

            <label>
              <span className="label">{hints.service}</span>
              <input className="field" value={payload.serviceType} onChange={(event) => update("serviceType", event.target.value)} placeholder="Например: фото + видео" />
            </label>

            <label>
              <span className="label">{hints.date}</span>
              <input className="field" type="date" value={payload.date} onChange={(event) => update("date", event.target.value)} />
            </label>

            <label>
              <span className="label">Время</span>
              <input className="field" type="time" value={payload.time} onChange={(event) => update("time", event.target.value)} />
            </label>

            <label>
              <span className="label">Сумма</span>
              <input
                className="field"
                inputMode="numeric"
                value={moneyInputValue(payload.amount)}
                onChange={(event) => update("amount", parseMoneyInput(event.target.value))}
                placeholder="Например: 85000"
              />
            </label>

            <label>
              <span className="label">Аванс</span>
              <input
                className="field"
                inputMode="numeric"
                value={moneyInputValue(payload.deposit)}
                onChange={(event) => update("deposit", parseMoneyInput(event.target.value))}
                placeholder="Например: 20000"
              />
            </label>

            <label>
              <span className="label">Статус</span>
              <select className="field" value={payload.status} onChange={(event) => update("status", event.target.value as OrderPayload["status"])}>
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="label">Статус оплаты</span>
              <select className="field" value={payload.paymentStatus} onChange={(event) => update("paymentStatus", event.target.value as OrderPayload["paymentStatus"])}>
                {PAYMENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="label">{hints.location}</span>
              <input className="field" value={payload.location} onChange={(event) => update("location", event.target.value)} />
            </label>

            <label>
              <span className="label">Оператор</span>
              <input className="field" value={payload.operator} onChange={(event) => update("operator", event.target.value)} />
            </label>
          </div>

          <label className="mt-4 block">
            <span className="label">Услуги внутри заказа</span>
            <textarea
              className="field min-h-[96px]"
              value={servicesText}
              onChange={(event) => setServicesText(event.target.value)}
              placeholder="Одна услуга на строку. Можно указать цену через тире."
            />
          </label>

          <label className="mt-4 block">
            <span className="label">Детали</span>
            <textarea className="field min-h-[96px]" value={payload.details} onChange={(event) => update("details", event.target.value)} />
          </label>

          {!order && (
            <label className="mt-4 block">
              <span className="label">Заметка</span>
              <textarea className="field min-h-[78px]" value={payload.note} onChange={(event) => update("note", event.target.value)} />
            </label>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-white/10 p-5">
          <button type="button" onClick={onClose} className="secondary-button">
            Отмена
          </button>
          <button type="submit" disabled={saving} className="primary-button">
            {saving ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </form>
    </div>
  );
}
