import { fallbackStore } from "../data/fallbackStore";
import { generateAssistantAnswer } from "../lib/assistant";
import type { Expense, Order, OrderPayload, OrderNote, Period, ReportData } from "../types";

const API_BASE = "";
const allowLocalFallback = import.meta.env.DEV || import.meta.env.VITE_ENABLE_LOCAL_FALLBACK === "true";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    throw new Error(`API ${response.status}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

async function withFallback<T>(apiCall: () => Promise<T>, fallbackCall: () => T | Promise<T>) {
  try {
    return await apiCall();
  } catch (error) {
    if (!allowLocalFallback) throw error;
    return fallbackCall();
  }
}

const serializeOrder = (payload: OrderPayload) => ({
  ...payload,
  client_name: payload.clientName,
  service_type: payload.serviceType,
  payment_status: payload.paymentStatus
});

export const api = {
  health() {
    return withFallback(
      () => request<{ ok: boolean; db: boolean }>("/api/health"),
      () => ({ ok: true, db: false })
    );
  },

  listOrders(includeDeleted = true) {
    const query = includeDeleted ? "?includeDeleted=true" : "";
    return withFallback<Order[]>(
      () => request<Order[]>(`/api/orders${query}`),
      () => fallbackStore.listOrders(includeDeleted)
    );
  },

  getOrder(orderId: string) {
    return withFallback<Order>(
      () => request<Order>(`/api/orders/${orderId}`),
      () => fallbackStore.getOrder(orderId)
    );
  },

  createOrder(payload: OrderPayload) {
    return withFallback<Order>(
      () =>
        request<Order>("/api/orders", {
          method: "POST",
          body: JSON.stringify(serializeOrder(payload))
        }),
      () => fallbackStore.createOrder(payload)
    );
  },

  updateOrder(orderId: string, payload: OrderPayload) {
    return withFallback<Order>(
      () =>
        request<Order>(`/api/orders/${orderId}`, {
          method: "PATCH",
          body: JSON.stringify(serializeOrder(payload))
        }),
      () => fallbackStore.updateOrder(orderId, payload)
    );
  },

  softDeleteOrder(orderId: string) {
    return withFallback<Order>(
      () => request<Order>(`/api/orders/${orderId}`, { method: "DELETE" }),
      () => fallbackStore.softDeleteOrder(orderId)
    );
  },

  restoreOrder(orderId: string) {
    return withFallback<Order>(
      () => request<Order>(`/api/orders/${orderId}/restore`, { method: "POST" }),
      () => fallbackStore.restoreOrder(orderId)
    );
  },

  addNote(orderId: string, text: string) {
    return withFallback<OrderNote>(
      () =>
        request<OrderNote>(`/api/orders/${orderId}/notes`, {
          method: "POST",
          body: JSON.stringify({ text })
        }),
      () => fallbackStore.addNote(orderId, text)
    );
  },

  deleteNote(noteId: string) {
    return withFallback<void>(
      () => request<void>(`/api/notes/${noteId}`, { method: "DELETE" }),
      () => fallbackStore.deleteNote(noteId)
    );
  },

  listExpenses() {
    return withFallback<Expense[]>(
      () => request<Expense[]>("/api/expenses"),
      () => fallbackStore.expenses()
    );
  },

  addExpense(payload: Omit<Expense, "id" | "createdAt">) {
    return withFallback<Expense>(
      () =>
        request<Expense>("/api/expenses", {
          method: "POST",
          body: JSON.stringify(payload)
        }),
      () => fallbackStore.addExpense(payload)
    );
  },

  deleteExpense(expenseId: string) {
    return withFallback<void>(
      () => request<void>(`/api/expenses/${expenseId}`, { method: "DELETE" }),
      () => fallbackStore.deleteExpense(expenseId)
    );
  },

  getReports(period: Period) {
    return withFallback<ReportData>(
      () => request<ReportData>(`/api/reports?period=${period}`),
      () => fallbackStore.reports(period)
    );
  },

  getCalendar(month: string) {
    return withFallback<Order[]>(
      () => request<Order[]>(`/api/calendar?month=${month}`),
      () => fallbackStore.listOrders(false).filter((order) => order.date.startsWith(month))
    );
  },

  askAi(message: string, orders: Order[], expenses: Expense[] = []) {
    return withFallback<{ answer: string }>(
      () =>
        request<{ answer: string }>("/api/ai/chat", {
          method: "POST",
          body: JSON.stringify({ message, context: { orders, expenses } })
        }),
      () => {
        return { answer: generateAssistantAnswer(message, orders, expenses) };
      }
    );
  }
};
