import { Bot, Send, X } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { api } from "../api/client";
import type { Expense, Order } from "../types";

interface Message {
  role: "user" | "assistant";
  text: string;
}

const quickPrompts = [
  "Что сегодня?",
  "Кто должен оплатить?",
  "Ближайшие заказы",
  "Какая выручка?",
  "Как добавить заказ?"
];

export function AiAssistant({
  orders,
  expenses = [],
  open,
  onClose
}: {
  orders: Order[];
  expenses?: Expense[];
  open: boolean;
  onClose: () => void;
}) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Я помогу по CRM: заказы, оплаты, календарь, отчёты и быстрые действия. Спросите обычным текстом или выберите подсказку ниже."
    }
  ]);
  const [loading, setLoading] = useState(false);

  const ask = async (message: string) => {
    if (!message.trim()) return;
    setMessages((current) => [...current, { role: "user", text: message }]);
    setInput("");
    setLoading(true);
    try {
      const response = await api.askAi(message, orders, expenses);
      setMessages((current) => [...current, { role: "assistant", text: response.answer }]);
    } catch (_error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: "Не удалось получить ответ от AI endpoint. Проверьте API и подключение к базе."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await ask(input.trim());
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/50 p-3 backdrop-blur-sm md:p-6">
          <section className="panel flex h-[620px] max-h-[88vh] w-full max-w-[420px] flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/20 text-violet-200">
                  <Bot className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-semibold text-white">AI помощник</h2>
                  <p className="text-xs text-slate-400">Помощь по заказам и оплатам</p>
                </div>
              </div>
              <button type="button" onClick={onClose} className="icon-button" aria-label="Закрыть">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`max-w-[86%] rounded-lg border px-3 py-2 text-sm ${
                    message.role === "user"
                      ? "ml-auto border-accent/30 bg-accent/20 text-white"
                      : "border-white/10 bg-white/5 text-slate-200"
                  }`}
                >
                  <span className="whitespace-pre-line">{message.text}</span>
                </div>
              ))}
              {loading && <div className="text-sm text-slate-400">Проверяю данные...</div>}
            </div>

            <div className="border-t border-white/10 p-3">
              <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void ask(prompt)}
                    disabled={loading}
                    className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-accent/40 hover:bg-accent/10 disabled:opacity-60"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
              <form onSubmit={submit} className="flex gap-2">
                <input
                  className="field"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Например: кто должен оплатить?"
                />
                <button type="submit" className="icon-button" aria-label="Отправить" disabled={loading}>
                  <Send className="h-5 w-5" />
                </button>
              </form>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
