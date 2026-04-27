import { TYPE_LABELS } from "../data/constants";
import { formatOrderDate, startOfWeek, toDateKey } from "./date";
import { money } from "./format";
import type { Expense, Order } from "../types";

function clean(input: string) {
  return input.trim().toLowerCase().replace(/ё/g, "е");
}

function includesAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

function activeOrders(orders: Order[]) {
  return orders.filter((order) => !order.deletedAt);
}

function workOrders(orders: Order[]) {
  return activeOrders(orders).filter((order) => order.status !== "Готово" && order.status !== "Отменён");
}

function upcomingOrders(orders: Order[]) {
  const today = toDateKey(new Date());
  return activeOrders(orders)
    .filter((order) => order.date >= today)
    .sort((a, b) => `${a.date}${a.time || ""}`.localeCompare(`${b.date}${b.time || ""}`));
}

function formatOrderLine(order: Order) {
  return `${formatOrderDate(order.date, order.time)} — ${order.clientName}, ${TYPE_LABELS[order.type]}, ${order.status}, ${money(order.amount)}`;
}

function listOrders(title: string, orders: Order[], emptyText: string) {
  if (!orders.length) return emptyText;
  return `${title}\n${orders.slice(0, 5).map((order, index) => `${index + 1}. ${formatOrderLine(order)}`).join("\n")}`;
}

function getPeriodOrders(orders: Order[], period: "today" | "tomorrow" | "week") {
  const today = new Date();
  const todayKey = toDateKey(today);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = toDateKey(tomorrow);
  const weekStart = startOfWeek(today);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  return activeOrders(orders).filter((order) => {
    if (period === "today") return order.date === todayKey;
    if (period === "tomorrow") return order.date === tomorrowKey;
    const date = new Date(`${order.date}T00:00:00`);
    return date >= weekStart && date < weekEnd;
  });
}

function paymentSummary(orders: Order[]) {
  const waiting = activeOrders(orders).filter((order) => order.paymentStatus !== "Оплачено");
  const total = waiting.reduce((sum, order) => sum + Math.max(order.amount - order.deposit, 0), 0);
  if (!waiting.length) return "По оплатам всё чисто: заказов с неоплаченным остатком нет.";
  const lines = waiting
    .sort((a, b) => Math.max(b.amount - b.deposit, 0) - Math.max(a.amount - a.deposit, 0))
    .slice(0, 5)
    .map((order, index) => `${index + 1}. ${order.clientName} — остаток ${money(Math.max(order.amount - order.deposit, 0))}, статус: ${order.paymentStatus}`);
  return `Ожидается оплата по ${waiting.length} заказам. Общий остаток: ${money(total)}.\n${lines.join("\n")}`;
}

function statusSummary(orders: Order[]) {
  const counts = new Map<string, number>();
  activeOrders(orders).forEach((order) => counts.set(order.status, (counts.get(order.status) || 0) + 1));
  if (!counts.size) return "Заказов пока нет, поэтому статусы ещё не сформированы.";
  return `Статусы заказов:\n${Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([status, count]) => `• ${status}: ${count}`)
    .join("\n")}`;
}

function typeSummary(orders: Order[]) {
  const counts = new Map<string, number>();
  activeOrders(orders).forEach((order) => counts.set(TYPE_LABELS[order.type], (counts.get(TYPE_LABELS[order.type]) || 0) + 1));
  if (!counts.size) return "Типов заказов пока нет. В CRM доступны: Свадьба, Школьный, Реклама и Дизайн.";
  return `Распределение по типам:\n${Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => `• ${type}: ${count}`)
    .join("\n")}`;
}

function financeSummary(orders: Order[], expenses: Expense[]) {
  const active = activeOrders(orders).filter((order) => order.status !== "Отменён");
  const revenue = active.reduce((sum, order) => sum + order.amount, 0);
  const paid = active.reduce((sum, order) => sum + order.deposit, 0);
  const expenseTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const profit = revenue - expenseTotal;
  const average = active.length ? revenue / active.length : 0;

  return [
    "Финансовая сводка по текущим данным:",
    `• Выручка по заказам: ${money(revenue)}`,
    `• Получено авансами: ${money(paid)}`,
    `• Расходы: ${money(expenseTotal)}`,
    `• Чистая прибыль: ${money(profit)}`,
    `• Средний чек: ${money(average)}`
  ].join("\n");
}

function onboardingAnswer() {
  return [
    "Заказов пока нет. Чтобы начать работать с реальными данными:",
    "1. Нажмите кнопку «Новый заказ» в верхнем меню.",
    "2. Выберите тип: Свадьба, Школьный, Реклама или Дизайн.",
    "3. Заполните клиента, телефон, дату, услугу, сумму и аванс.",
    "4. Нажмите «Сохранить». Заказ появится в списке, календаре и отчётах.",
    "",
    "Для production важно подключить PostgreSQL через DATABASE_URL, тогда данные будут храниться в базе."
  ].join("\n");
}

export function generateAssistantAnswer(message: string, orders: Order[], expenses: Expense[] = []) {
  const text = clean(message);
  const allActive = activeOrders(orders);
  const allWork = workOrders(orders);
  const upcoming = upcomingOrders(orders);

  if (!text) return "Напишите вопрос по заказам, оплатам, календарю или отчётам.";

  if (includesAny(text, ["привет", "здравствуй", "салам", "hello", "hi"])) {
    if (!allActive.length) {
      return `Привет. Я помогу вести CRM Pixe1.media.\n\n${onboardingAnswer()}`;
    }
    return [
      "Привет. Короткая сводка:",
      `• Активных заказов: ${allWork.length}`,
      `• Ближайший заказ: ${upcoming[0] ? formatOrderLine(upcoming[0]) : "не найден"}`,
      `• Ожидают оплату: ${allActive.filter((order) => order.paymentStatus !== "Оплачено").length}`,
      "",
      "Можете спросить: «что сегодня», «кто должен оплатить», «ближайшие заказы», «статусы», «выручка»."
    ].join("\n");
  }

  if (includesAny(text, ["как добавить", "создать заказ", "новый заказ", "добавить заказ", "завести заказ"])) {
    return [
      "Как добавить заказ:",
      "1. Нажмите «Новый заказ» в верхнем меню.",
      "2. Выберите тип заказа.",
      "3. Заполните клиента, телефон, дату, услугу, сумму, аванс и статус.",
      "4. При необходимости добавьте место, оператора, детали и заметку.",
      "5. Нажмите «Сохранить».",
      "",
      "После сохранения заказ автоматически попадёт в список, календарь и отчёты."
    ].join("\n");
  }

  if (includesAny(text, ["как редакт", "изменить", "поменять"])) {
    return "Чтобы изменить заказ: откройте страницу «Заказы», нажмите меню с тремя точками у нужного заказа и выберите «Редактировать». В карточке заказа также есть кнопка «Редактировать».";
  }

  if (includesAny(text, ["удалить", "корзин", "восстановить"])) {
    return "Удаление работает как soft delete: заказ переносится во вкладку «Корзина» на странице «Заказы». Там его можно восстановить. Из базы он сразу не удаляется.";
  }

  if (includesAny(text, ["сегодня", "today"])) {
    return listOrders("События на сегодня:", getPeriodOrders(orders, "today"), "На сегодня заказов и событий нет.");
  }

  if (includesAny(text, ["завтра", "tomorrow"])) {
    return listOrders("События на завтра:", getPeriodOrders(orders, "tomorrow"), "На завтра заказов нет.");
  }

  if (includesAny(text, ["недел", "на этой неделе"])) {
    return listOrders("Заказы на этой неделе:", getPeriodOrders(orders, "week"), "На этой неделе заказов нет.");
  }

  if (includesAny(text, ["ближай", "следующ", "скоро", "что дальше"])) {
    return listOrders("Ближайшие заказы:", upcoming, "Ближайших заказов нет.");
  }

  if (includesAny(text, ["оплат", "долг", "остаток", "аванс", "должен"])) {
    return paymentSummary(orders);
  }

  if (includesAny(text, ["статус", "этап"])) {
    return statusSummary(orders);
  }

  if (includesAny(text, ["тип", "свад", "школ", "реклам", "дизайн"])) {
    return typeSummary(orders);
  }

  if (includesAny(text, ["выруч", "доход", "прибыл", "расход", "средний чек", "отчет", "отчёт"])) {
    return financeSummary(orders, expenses);
  }

  if (includesAny(text, ["календар", "дата", "расписан"])) {
    return "Календарь показывает все активные заказы по датам. Можно фильтровать по типу заказа и открыть заказ кликом по событию.";
  }

  if (includesAny(text, ["замет", "коммент"])) {
    return "Заметки добавляются внутри карточки заказа в блоке «Заметки». Они сохраняются вместе с заказом в PostgreSQL, если подключён DATABASE_URL.";
  }

  if (!allActive.length) return onboardingAnswer();

  return [
    "Я могу помочь по CRM, но лучше задайте вопрос конкретнее.",
    "Примеры:",
    "• что сегодня?",
    "• кто должен оплатить?",
    "• ближайшие заказы",
    "• покажи статусы",
    "• какая выручка?",
    "• как добавить заказ?"
  ].join("\n");
}
