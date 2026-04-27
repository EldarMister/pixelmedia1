import { addDays, periodRange, toDateKey } from "../lib/date";
import type { Expense, Order, OrderNote, OrderPayload, OrderService, OrderTimelineItem, Period, ReportData } from "../types";

const ORDERS_KEY = "pixelmedia.orders";
const EXPENSES_KEY = "pixelmedia.expenses";
const TRASH_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

const now = new Date();

function id(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function eventDate(date: string, time = "10:00") {
  return `${date || toDateKey(new Date())}T${time || "10:00"}:00.000Z`;
}

function normalizeOrderPayload(payload: OrderPayload): OrderPayload {
  const clientName = payload.clientName?.trim() || payload.title?.trim() || "Без имени";
  const serviceType = payload.serviceType?.trim() || "Без услуги";

  return {
    ...payload,
    title: payload.title?.trim() || clientName,
    clientName,
    phone: payload.phone?.trim() || "",
    email: payload.email?.trim() || "",
    serviceType,
    date: payload.date || toDateKey(new Date()),
    time: payload.time || "",
    location: payload.location?.trim() || "",
    amount: Number.isFinite(Number(payload.amount)) ? Number(payload.amount) : 0,
    deposit: Number.isFinite(Number(payload.deposit)) ? Number(payload.deposit) : 0,
    operator: payload.operator?.trim() || "",
    details: payload.details?.trim() || "",
    note: payload.note?.trim() || "",
    services: payload.services?.length
      ? payload.services.map((service) => ({
          name: service.name?.trim() || serviceType,
          price: Number.isFinite(Number(service.price)) ? Number(service.price) : 0,
          completed: Boolean(service.completed)
        }))
      : [{ name: serviceType, price: Number(payload.amount) || 0, completed: false }]
  };
}

function seedOrders(): Order[] {
  const dates = [0, 1, 3, 5, 7, 10, 12, -2];
  const base = [
    {
      type: "wedding",
      title: "Иван и Мария",
      clientName: "Иван и Мария",
      phone: "+7 999 123-45-67",
      email: "ivan.maria@mail.ru",
      serviceType: "Фото + видео",
      location: "Loft Bloom, Бишкек",
      amount: 245800,
      deposit: 80000,
      status: "Подтверждён",
      paymentStatus: "Частично оплачено",
      operator: "Алексей",
      details: "Полный день. Подготовка, церемония, банкет, первый танец.",
      time: "10:00"
    },
    {
      type: "school",
      title: "Школа №23",
      clientName: "Школа №23",
      phone: "+7 999 222-33-44",
      email: "director@school23.ru",
      serviceType: "Последний звонок",
      location: "Актовый зал школы",
      amount: 48000,
      deposit: 15000,
      status: "В работе",
      paymentStatus: "Аванс",
      operator: "Дарья",
      details: "Фото и видео мероприятия, групповые портреты классов.",
      time: "11:00"
    },
    {
      type: "ads",
      title: "Cafe Bloom",
      clientName: "Cafe Bloom",
      phone: "+7 999 333-44-55",
      email: "marketing@cafebloom.ru",
      serviceType: "Рекламный ролик",
      location: "Cafe Bloom",
      amount: 62000,
      deposit: 30000,
      status: "На согласовании",
      paymentStatus: "Частично оплачено",
      operator: "Алексей",
      details: "Короткий вертикальный ролик для соцсетей и 6 фото блюд.",
      time: "13:00"
    },
    {
      type: "design",
      title: "Studio North",
      clientName: "Studio North",
      phone: "+7 999 444-55-66",
      email: "info@studionorth.ru",
      serviceType: "Брендбук",
      location: "Удалённо",
      amount: 37000,
      deposit: 0,
      status: "Подготовка",
      paymentStatus: "Не оплачено",
      operator: "Дарья",
      details: "Логотип, палитра, типографика и базовые шаблоны.",
      time: "16:00"
    },
    {
      type: "wedding",
      title: "Алексей и Дарья",
      clientName: "Алексей и Дарья",
      phone: "+7 999 555-66-77",
      email: "alex.darya@mail.ru",
      serviceType: "Свадьба",
      location: "Загородный клуб",
      amount: 95000,
      deposit: 40000,
      status: "Подтверждён",
      paymentStatus: "Частично оплачено",
      operator: "Алексей",
      details: "Съёмка церемонии и банкета до 22:00.",
      time: "16:30"
    },
    {
      type: "school",
      title: "Школа №17",
      clientName: "Школа №17",
      phone: "+7 999 666-77-88",
      email: "school17@mail.ru",
      serviceType: "Выпускной альбом",
      location: "Школа №17",
      amount: 31000,
      deposit: 31000,
      status: "Готово",
      paymentStatus: "Оплачено",
      operator: "Дарья",
      details: "Дизайн и подготовка альбома к печати.",
      time: "09:00"
    },
    {
      type: "ads",
      title: "FitLife",
      clientName: "FitLife",
      phone: "+7 999 777-88-99",
      email: "ads@fitlife.ru",
      serviceType: "Рекламная кампания",
      location: "FitLife Studio",
      amount: 120000,
      deposit: 60000,
      status: "В работе",
      paymentStatus: "Частично оплачено",
      operator: "Алексей",
      details: "Видео для Reels, фото тренеров, монтаж 3 версий.",
      time: "13:00"
    },
    {
      type: "design",
      title: "Nord Market",
      clientName: "Nord Market",
      phone: "+7 999 888-99-11",
      email: "hello@nord.market",
      serviceType: "Дизайн упаковки",
      location: "Удалённо",
      amount: 54000,
      deposit: 20000,
      status: "Ожидает оплаты",
      paymentStatus: "Аванс",
      operator: "Дарья",
      details: "Линейка из трёх упаковок и подготовка к печати.",
      time: "15:00"
    }
  ] as const;

  return base.map((item, index) => {
    const date = toDateKey(addDays(now, dates[index]));
    const orderId = `order-${index + 1}`;
    const createdAt = new Date(now.getTime() - (index + 1) * 86400000).toISOString();
    const services: OrderService[] = [
      {
        id: `service-${index + 1}`,
        orderId,
        name: item.serviceType,
        price: item.amount,
        completed: item.status === "Готово"
      }
    ];
    const timeline: OrderTimelineItem[] = [
      {
        id: `timeline-${index + 1}-1`,
        orderId,
        title: "Брифинг",
        description: "Обсудили детали и пожелания",
        eventDate: eventDate(date, "10:00"),
        status: "Выполнено"
      },
      {
        id: `timeline-${index + 1}-2`,
        orderId,
        title: "Съёмка / работа",
        description: item.location,
        eventDate: eventDate(date, item.time),
        status: item.status === "Готово" ? "Выполнено" : "Запланировано"
      }
    ];
    const notes: OrderNote[] = [
      {
        id: `note-${index + 1}`,
        orderId,
        text:
          index === 0
            ? "Пожелание по цветокоррекции: тёплые тона, натуральная кожа."
            : "Клиент просил держать связь в WhatsApp.",
        createdAt
      }
    ];

    return {
      ...item,
      id: orderId,
      date,
      createdAt,
      updatedAt: createdAt,
      deletedAt: null,
      services,
      timeline,
      notes
    };
  });
}

function seedExpenses(): Expense[] {
  return [
    {
      id: "expense-1",
      title: "Аренда света",
      amount: 18500,
      date: toDateKey(addDays(now, 0)),
      category: "Оборудование",
      createdAt: new Date().toISOString()
    },
    {
      id: "expense-2",
      title: "Транспорт на съёмку",
      amount: 7200,
      date: toDateKey(addDays(now, 1)),
      category: "Логистика",
      createdAt: new Date().toISOString()
    },
    {
      id: "expense-3",
      title: "Печать пробников",
      amount: 12400,
      date: toDateKey(addDays(now, 3)),
      category: "Печать",
      createdAt: new Date().toISOString()
    }
  ];
}

function read<T>(key: string, seed: () => T): T {
  const stored = localStorage.getItem(key);
  if (stored) return JSON.parse(stored) as T;
  const value = seed();
  localStorage.setItem(key, JSON.stringify(value));
  return value;
}

function write<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
  return value;
}

function isExpiredTrash(order: Order) {
  if (!order.deletedAt) return false;
  const deletedAt = new Date(order.deletedAt).getTime();
  return Number.isFinite(deletedAt) && Date.now() - deletedAt > TRASH_RETENTION_MS;
}

export const fallbackStore = {
  orders() {
    const orders = read<Order[]>(ORDERS_KEY, seedOrders);
    const retainedOrders = orders.filter((order) => !isExpiredTrash(order));
    if (retainedOrders.length !== orders.length) {
      write(ORDERS_KEY, retainedOrders);
    }
    return retainedOrders;
  },

  saveOrders(orders: Order[]) {
    return write(ORDERS_KEY, orders);
  },

  expenses() {
    return read<Expense[]>(EXPENSES_KEY, seedExpenses);
  },

  saveExpenses(expenses: Expense[]) {
    return write(EXPENSES_KEY, expenses);
  },

  listOrders(includeDeleted = true) {
    const orders = this.orders();
    return includeDeleted ? orders : orders.filter((order) => !order.deletedAt);
  },

  getOrder(orderId: string) {
    const order = this.orders().find((item) => item.id === orderId);
    if (!order) throw new Error("Order not found");
    return order;
  },

  createOrder(payload: OrderPayload) {
    const normalizedPayload = normalizeOrderPayload(payload);
    const orderId = id("order");
    const createdAt = new Date().toISOString();
    const services =
      normalizedPayload.services?.length
        ? normalizedPayload.services.map((service) => ({
            ...service,
            id: id("service"),
            orderId
          }))
        : [
            {
              id: id("service"),
              orderId,
              name: normalizedPayload.serviceType,
              price: normalizedPayload.amount,
              completed: false
            }
          ];

    const order: Order = {
      ...normalizedPayload,
      id: orderId,
      createdAt,
      updatedAt: createdAt,
      deletedAt: null,
      email: payload.email || null,
      time: payload.time || null,
      location: payload.location || null,
      operator: payload.operator || null,
      details: payload.details || null,
      services,
      timeline: [
        {
          id: id("timeline"),
          orderId,
          title: "Заказ создан",
          description: "Первичная заявка добавлена в CRM",
          eventDate: eventDate(payload.date, payload.time || "10:00"),
          status: "Выполнено"
        }
      ],
      notes: normalizedPayload.note
        ? [{ id: id("note"), orderId, text: normalizedPayload.note, createdAt }]
        : []
    };

    this.saveOrders([order, ...this.orders()]);
    return order;
  },

  updateOrder(orderId: string, payload: OrderPayload) {
    const normalizedPayload = normalizeOrderPayload(payload);
    let updatedOrder: Order | undefined;
    const orders = this.orders().map((order) => {
      if (order.id !== orderId) return order;
      updatedOrder = {
        ...order,
        ...normalizedPayload,
        updatedAt: new Date().toISOString(),
        email: normalizedPayload.email || null,
        time: normalizedPayload.time || null,
        location: normalizedPayload.location || null,
        operator: normalizedPayload.operator || null,
        details: normalizedPayload.details || null,
        services: normalizedPayload.services?.map((service) => ({
          id: id("service"),
          orderId,
          ...service
        }))
      };
      return updatedOrder;
    });
    this.saveOrders(orders);
    if (!updatedOrder) throw new Error("Order not found");
    return updatedOrder;
  },

  softDeleteOrder(orderId: string) {
    let updatedOrder: Order | undefined;
    const orders = this.orders().map((order) => {
      if (order.id !== orderId) return order;
      updatedOrder = { ...order, deletedAt: new Date().toISOString() };
      return updatedOrder;
    });
    this.saveOrders(orders);
    if (!updatedOrder) throw new Error("Order not found");
    return updatedOrder;
  },

  restoreOrder(orderId: string) {
    let updatedOrder: Order | undefined;
    const orders = this.orders().map((order) => {
      if (order.id !== orderId) return order;
      updatedOrder = { ...order, deletedAt: null };
      return updatedOrder;
    });
    this.saveOrders(orders);
    if (!updatedOrder) throw new Error("Order not found");
    return updatedOrder;
  },

  addNote(orderId: string, text: string) {
    const note = {
      id: id("note"),
      orderId,
      text,
      createdAt: new Date().toISOString()
    };
    const orders = this.orders().map((order) =>
      order.id === orderId ? { ...order, notes: [note, ...(order.notes || [])] } : order
    );
    this.saveOrders(orders);
    return note;
  },

  deleteNote(noteId: string) {
    const orders = this.orders().map((order) => ({
      ...order,
      notes: (order.notes || []).filter((note) => note.id !== noteId)
    }));
    this.saveOrders(orders);
  },

  addExpense(payload: Omit<Expense, "id" | "createdAt">) {
    const expense = { ...payload, id: id("expense"), createdAt: new Date().toISOString() };
    this.saveExpenses([expense, ...this.expenses()]);
    return expense;
  },

  deleteExpense(expenseId: string) {
    this.saveExpenses(this.expenses().filter((expense) => expense.id !== expenseId));
  },

  reports(period: Period): ReportData {
    const { start, end } = periodRange(period);
    const orders = this.orders().filter((order) => {
      const date = new Date(`${order.date}T00:00:00`);
      return !order.deletedAt && order.status !== "Отменён" && date >= start && date < end;
    });
    const expenses = this.expenses().filter((expense) => {
      const date = new Date(`${expense.date}T00:00:00`);
      return date >= start && date < end;
    });
    const revenue = orders.reduce((sum, order) => sum + order.amount, 0);
    const expenseTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const revenueByDay = new Map<string, number>();
    const byType = new Map<string, number>();
    const topServices = new Map<string, number>();

    orders.forEach((order) => {
      revenueByDay.set(order.date, (revenueByDay.get(order.date) || 0) + order.amount);
      byType.set(order.type, (byType.get(order.type) || 0) + order.amount);
      topServices.set(order.serviceType, (topServices.get(order.serviceType) || 0) + order.amount);
    });

    return {
      period,
      revenue,
      expenses: expenseTotal,
      profit: revenue - expenseTotal,
      averageCheck: orders.length ? revenue / orders.length : 0,
      revenueByDay: Array.from(revenueByDay, ([date, amount]) => ({ date, amount })),
      byType: Array.from(byType, ([type, amount]) => ({ type: type as ReportData["byType"][number]["type"], amount })),
      topServices: Array.from(topServices, ([name, amount]) => ({ name, amount })).sort(
        (a, b) => b.amount - a.amount
      ),
      recentOrders: orders.slice(-6).reverse(),
      expenseItems: expenses
    };
  }
};
