import { BarChart3, Download, Plus, Trash2, TrendingUp, WalletCards } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { StatusBadge, TypeBadge } from "../components/Badges";
import { MetricCard } from "../components/MetricCard";
import { ORDER_TYPES, PERIODS, TYPE_LABELS } from "../data/constants";
import { api } from "../api/client";
import { formatOrderDate } from "../lib/date";
import { money, percent } from "../lib/format";
import type { Expense, Period, ReportData } from "../types";

const typeColors = {
  wedding: "#8B5CF6",
  school: "#F59E0B",
  ads: "#3B6CFF",
  design: "#2DD4BF"
};

const emptyReport: ReportData = {
  period: "week",
  revenue: 0,
  expenses: 0,
  profit: 0,
  averageCheck: 0,
  revenueByDay: [],
  byType: [],
  topServices: [],
  recentOrders: [],
  expenseItems: []
};

export function ReportsPage({
  onAddExpense,
  onDeleteExpense
}: {
  onAddExpense: (payload: Omit<Expense, "id" | "createdAt">) => Promise<void>;
  onDeleteExpense: (id: string) => Promise<void>;
}) {
  const [period, setPeriod] = useState<Period>("week");
  const [report, setReport] = useState<ReportData>(emptyReport);
  const [expenseDraft, setExpenseDraft] = useState({
    title: "",
    amount: 0,
    date: new Date().toISOString().slice(0, 10),
    category: "Общее"
  });

  useEffect(() => {
    api.getReports(period).then(setReport).catch(() => setReport(emptyReport));
  }, [period]);

  const totalByType = useMemo(
    () => report.byType.reduce((sum, item) => sum + item.amount, 0),
    [report.byType]
  );

  const addExpense = async (event: FormEvent) => {
    event.preventDefault();
    if (!expenseDraft.title || !expenseDraft.amount) return;
    await onAddExpense(expenseDraft);
    setExpenseDraft({
      title: "",
      amount: 0,
      date: new Date().toISOString().slice(0, 10),
      category: "Общее"
    });
    setReport(await api.getReports(period));
  };

  const deleteExpense = async (id: string) => {
    await onDeleteExpense(id);
    setReport(await api.getReports(period));
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-white md:text-4xl">Отчёты</h1>
      </div>

      <div className="flex w-fit rounded-lg border border-white/10 bg-white/5 p-1">
        {PERIODS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setPeriod(item.key)}
            className={`min-w-[96px] rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
              period === item.key ? "bg-accent text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <MetricCard icon={WalletCards} label="Выручка" value={money(report.revenue)} helper="+ по закрытым и активным заказам" tone="blue" />
        <MetricCard icon={Download} label="Расходы" value={money(report.expenses)} helper="из таблицы expenses" tone="violet" />
        <MetricCard icon={TrendingUp} label="Чистая прибыль" value={money(report.profit)} helper={report.profit >= 0 ? "положительный баланс" : "расходы выше выручки"} tone="green" />
        <MetricCard icon={BarChart3} label="Средний чек" value={money(report.averageCheck)} helper="по заказам периода" tone="orange" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <section className="panel p-5">
          <h2 className="mb-5 text-xl font-bold text-white">Выручка по дням</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.revenueByDay}>
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => new Date(`${value}T00:00:00`).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                  stroke="#8EA0C0"
                  fontSize={12}
                />
                <YAxis stroke="#8EA0C0" fontSize={12} tickFormatter={(value) => `${Math.round(Number(value) / 1000)}к`} />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.05)" }}
                  contentStyle={{ background: "#102344", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }}
                  formatter={(value) => money(Number(value))}
                />
                <Bar dataKey="amount" fill="#3B6CFF" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel p-5">
          <h2 className="mb-5 text-xl font-bold text-white">Распределение по типам</h2>
          <div className="grid gap-6 md:grid-cols-[260px_1fr]">
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={report.byType} dataKey="amount" nameKey="type" innerRadius={72} outerRadius={112} paddingAngle={2}>
                    {report.byType.map((item) => (
                      <Cell key={item.type} fill={typeColors[item.type]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#102344", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }}
                    formatter={(value) => money(Number(value))}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {report.byType.map((item) => (
                <div key={item.type} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-white/10 pb-3 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: typeColors[item.type] }} />
                    <span className="text-slate-100">{TYPE_LABELS[item.type]}</span>
                  </div>
                  <span className="text-slate-300">{percent(totalByType ? (item.amount / totalByType) * 100 : 0)}</span>
                  <span className="font-medium text-white">{money(item.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <section className="panel p-5">
          <h2 className="mb-5 text-xl font-bold text-white">Топ услуг</h2>
          <div className="space-y-4">
            {report.topServices.map((service) => {
              const share = report.revenue ? (service.amount / report.revenue) * 100 : 0;
              return (
                <div key={service.name} className="grid grid-cols-[130px_1fr_auto_auto] items-center gap-4">
                  <span className="truncate text-slate-100">{service.name}</span>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(8, share)}%` }} />
                  </div>
                  <span className="font-medium text-white">{money(service.amount)}</span>
                  <span className="text-slate-500">{percent(share)}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="panel p-5">
          <h2 className="mb-5 text-xl font-bold text-white">Последние заказы</h2>
          <div className="space-y-3">
            {report.recentOrders.map((order) => (
              <div key={order.id} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 border-b border-white/10 pb-3 last:border-0">
                <TypeBadge type={order.type} compact />
                <div className="min-w-0">
                  <p className="truncate font-medium text-white">{order.clientName}</p>
                  <p className="text-sm text-slate-500">{formatOrderDate(order.date, order.time)}</p>
                </div>
                <span className="font-medium text-white">{money(order.amount)}</span>
                <StatusBadge status={order.status} />
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="panel p-5">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Расходы</h2>
            <p className="text-sm text-slate-400">Расходы хранятся отдельно и участвуют в расчёте прибыли.</p>
          </div>
        </div>
        <form onSubmit={addExpense} className="mb-5 grid gap-3 md:grid-cols-[1fr_150px_150px_160px_auto]">
          <input className="field" value={expenseDraft.title} onChange={(event) => setExpenseDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Название расхода" />
          <input className="field" type="number" min="0" value={expenseDraft.amount} onChange={(event) => setExpenseDraft((current) => ({ ...current, amount: Number(event.target.value) }))} />
          <input className="field" type="date" value={expenseDraft.date} onChange={(event) => setExpenseDraft((current) => ({ ...current, date: event.target.value }))} />
          <input className="field" value={expenseDraft.category} onChange={(event) => setExpenseDraft((current) => ({ ...current, category: event.target.value }))} />
          <button type="submit" className="primary-button">
            <Plus className="h-4 w-4" /> Добавить
          </button>
        </form>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {report.expenseItems.map((expense) => (
            <div key={expense.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 p-4">
              <div>
                <p className="font-medium text-white">{expense.title}</p>
                <p className="text-sm text-slate-500">{expense.category} · {new Date(`${expense.date}T00:00:00`).toLocaleDateString("ru-RU")}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-white">{money(expense.amount)}</span>
                <button type="button" onClick={() => void deleteExpense(expense.id)} className="icon-button h-9 w-9" aria-label="Удалить расход">
                  <Trash2 className="h-4 w-4 text-red-200" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
