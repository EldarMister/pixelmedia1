import { useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { AiAssistant } from "./components/AiAssistant";
import { Layout } from "./components/Layout";
import { OrderFormDrawer } from "./components/OrderFormDrawer";
import { useCrmData } from "./hooks/useCrmData";
import { CalendarPage } from "./pages/CalendarPage";
import { Dashboard } from "./pages/Dashboard";
import { OrderDetails } from "./pages/OrderDetails";
import { OrdersPage } from "./pages/OrdersPage";
import { ReportsPage } from "./pages/ReportsPage";
import type { Order, OrderPayload } from "./types";

export default function App() {
  const navigate = useNavigate();
  const {
    orders,
    loading,
    error,
    dbAvailable,
    createOrder,
    updateOrder,
    softDeleteOrder,
    restoreOrder,
    addNote,
    deleteNote,
    addExpense,
    deleteExpense
  } = useCrmData();
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const openNewOrder = () => {
    setEditingOrder(null);
    setDrawerOpen(true);
  };

  const openEditOrder = (order: Order) => {
    setEditingOrder(order);
    setDrawerOpen(true);
  };

  const submitOrder = async (payload: OrderPayload, orderId?: string) => {
    if (orderId) {
      await updateOrder(orderId, payload);
      return;
    }
    const order = await createOrder(payload);
    navigate(`/orders/${order.id}`);
  };

  const deleteOrder = async (orderId: string) => {
    await softDeleteOrder(orderId);
  };

  const restoreDeletedOrder = async (orderId: string) => {
    await restoreOrder(orderId);
  };

  const addOrderNote = async (orderId: string, text: string) => {
    await addNote(orderId, text);
  };

  const addReportExpense = async (payload: Parameters<typeof addExpense>[0]) => {
    await addExpense(payload);
  };

  return (
    <Layout onNewOrder={openNewOrder} search={search} onSearchChange={setSearch}>
      {dbAvailable === false && (
        <div className="mb-4 rounded-lg border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          PostgreSQL не подключён: интерфейс работает через localStorage fallback. Для постоянного хранения задайте DATABASE_URL.
        </div>
      )}

      {error ? (
        <div className="panel p-8">
          <h1 className="text-xl font-bold text-white">CRM не подключилась к данным</h1>
          <p className="mt-2 max-w-2xl text-slate-300">{error}</p>
          <button type="button" onClick={() => window.location.reload()} className="primary-button mt-5">
            Повторить
          </button>
        </div>
      ) : loading ? (
        <div className="panel p-8 text-slate-300">Загрузка CRM...</div>
      ) : (
        <Routes>
          <Route path="/" element={<Dashboard orders={orders} />} />
          <Route
            path="/orders"
            element={
              <OrdersPage
                orders={orders}
                search={search}
                onSearchChange={setSearch}
                onNewOrder={openNewOrder}
                onEditOrder={openEditOrder}
                onDeleteOrder={deleteOrder}
                onRestoreOrder={restoreDeletedOrder}
              />
            }
          />
          <Route
            path="/orders/:id"
            element={
              <OrderDetails
                orders={orders}
                onEditOrder={openEditOrder}
                onDeleteOrder={deleteOrder}
                onRestoreOrder={restoreDeletedOrder}
                onAddNote={addOrderNote}
                onDeleteNote={deleteNote}
              />
            }
          />
          <Route path="/calendar" element={<CalendarPage orders={orders} />} />
          <Route path="/reports" element={<ReportsPage onAddExpense={addReportExpense} onDeleteExpense={deleteExpense} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}

      <OrderFormDrawer
        open={drawerOpen}
        order={editingOrder}
        onClose={() => setDrawerOpen(false)}
        onSubmit={submitOrder}
      />
      <AiAssistant orders={orders} />
    </Layout>
  );
}
