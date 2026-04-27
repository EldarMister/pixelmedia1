import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import type { Expense, Order, OrderPayload } from "../types";

export function useCrmData() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dbAvailable, setDbAvailable] = useState<boolean | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [health, nextOrders, nextExpenses] = await Promise.all([
        api.health(),
        api.listOrders(true),
        api.listExpenses()
      ]);
      setDbAvailable(health.db);
      setOrders(nextOrders);
      setExpenses(nextExpenses);
    } catch (_error) {
      setError("Не удалось подключиться к API или PostgreSQL. Проверьте DATABASE_URL и состояние backend.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh().catch(() => setLoading(false));
  }, [refresh]);

  const activeOrders = useMemo(
    () => orders.filter((order) => !order.deletedAt && order.status !== "Готово" && order.status !== "Отменён"),
    [orders]
  );

  const actions = useMemo(
    () => ({
      async createOrder(payload: OrderPayload) {
        const order = await api.createOrder(payload);
        setOrders((current) => [order, ...current]);
        return order;
      },

      async updateOrder(orderId: string, payload: OrderPayload) {
        const order = await api.updateOrder(orderId, payload);
        setOrders((current) => current.map((item) => (item.id === orderId ? { ...item, ...order } : item)));
        return order;
      },

      async softDeleteOrder(orderId: string) {
        const order = await api.softDeleteOrder(orderId);
        setOrders((current) => current.map((item) => (item.id === orderId ? { ...item, ...order } : item)));
        return order;
      },

      async restoreOrder(orderId: string) {
        const order = await api.restoreOrder(orderId);
        setOrders((current) => current.map((item) => (item.id === orderId ? { ...item, ...order } : item)));
        return order;
      },

      async addNote(orderId: string, text: string) {
        const note = await api.addNote(orderId, text);
        setOrders((current) =>
          current.map((order) =>
            order.id === orderId ? { ...order, notes: [note, ...(order.notes || [])] } : order
          )
        );
        return note;
      },

      async deleteNote(noteId: string) {
        await api.deleteNote(noteId);
        setOrders((current) =>
          current.map((order) => ({
            ...order,
            notes: (order.notes || []).filter((note) => note.id !== noteId)
          }))
        );
      },

      async addExpense(payload: Omit<Expense, "id" | "createdAt">) {
        const expense = await api.addExpense(payload);
        setExpenses((current) => [expense, ...current]);
        return expense;
      },

      async deleteExpense(expenseId: string) {
        await api.deleteExpense(expenseId);
        setExpenses((current) => current.filter((expense) => expense.id !== expenseId));
      }
    }),
    []
  );

  return {
    orders,
    expenses,
    activeOrders,
    loading,
    error,
    dbAvailable,
    refresh,
    ...actions
  };
}
