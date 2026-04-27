import { Bot, Send, Sparkles, X } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { api } from "../api/client";
import type { Order } from "../types";

interface Message {
  role: "user" | "assistant";
  text: string;
}

export function AiAssistant({ orders }: { orders: Order[] }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Я могу быстро подсказать, что сегодня, какие оплаты ожидаются и какие заказы ближайшие."
    }
  ]);
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!input.trim()) return;
    const message = input.trim();
    setMessages((current) => [...current, { role: "user", text: message }]);
    setInput("");
    setLoading(true);
    const response = await api.askAi(message, orders);
    setMessages((current) => [...current, { role: "assistant", text: response.answer }]);
    setLoading(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-[5.3rem] right-4 z-40 inline-flex items-center gap-2 rounded-lg border border-violet-300/30 bg-violet-500/20 px-4 py-3 text-sm font-semibold text-white shadow-soft backdrop-blur transition hover:bg-violet-500/30 md:bottom-8 md:right-8"
      >
        <Sparkles className="h-5 w-5" />
        AI помощник
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/50 p-3 backdrop-blur-sm md:p-6">
          <section className="panel flex h-[620px] max-h-[88vh] w-full max-w-[420px] flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/18 text-violet-200">
                  <Bot className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-semibold text-white">AI помощник</h2>
                  <p className="text-xs text-slate-400">Черновой анализ по данным CRM</p>
                </div>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="icon-button" aria-label="Закрыть">
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
                  {message.text}
                </div>
              ))}
              {loading && <div className="text-sm text-slate-400">Проверяю данные...</div>}
            </div>

            <form onSubmit={submit} className="flex gap-2 border-t border-white/10 p-3">
              <input
                className="field"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Например: что сегодня?"
              />
              <button type="submit" className="icon-button" aria-label="Отправить">
                <Send className="h-5 w-5" />
              </button>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
