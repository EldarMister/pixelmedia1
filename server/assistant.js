const typeLabels = {
  wedding: "Свадьба",
  school: "Школьный",
  ads: "Реклама",
  design: "Дизайн"
};

const money = (value) => `${Math.round(Number(value || 0)).toLocaleString("ru-RU")} ₽`;

const clean = (value) => String(value || "").trim().toLowerCase().replace(/ё/g, "е");

const includesAny = (text, words) => words.some((word) => text.includes(word));

const dateKey = (date = new Date()) => {
  const value = typeof date === "string" ? new Date(`${date.slice(0, 10)}T00:00:00`) : date;
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
};

const formatDate = (date, time) => {
  const value = new Date(`${String(date).slice(0, 10)}T00:00:00`);
  const formatted = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    weekday: "short"
  }).format(value).replace(".", "");
  return time ? `${formatted} · ${String(time).slice(0, 5)}` : formatted;
};

const activeOrders = (orders) => orders.filter((order) => !order.deletedAt && !order.deleted_at);
const workOrders = (orders) => activeOrders(orders).filter((order) => order.status !== "Готово" && order.status !== "Отменён");

const orderDate = (order) => String(order.date).slice(0, 10);
const orderTime = (order) => order.time || "";
const orderClient = (order) => order.clientName || order.client_name;
const orderType = (order) => order.type;
const orderPayment = (order) => order.paymentStatus || order.payment_status;
const orderService = (order) => order.serviceType || order.service_type;

const formatOrderLine = (order) =>
  `${formatDate(orderDate(order), orderTime(order))} — ${orderClient(order)}, ${typeLabels[orderType(order)]}, ${order.status}, ${money(order.amount)}`;

const listOrders = (title, orders, emptyText) => {
  if (!orders.length) return emptyText;
  return `${title}\n${orders.slice(0, 5).map((order, index) => `${index + 1}. ${formatOrderLine(order)}`).join("\n")}`;
};

const upcomingOrders = (orders) => {
  const today = dateKey();
  return activeOrders(orders)
    .filter((order) => orderDate(order) >= today)
    .sort((a, b) => `${orderDate(a)}${orderTime(a)}`.localeCompare(`${orderDate(b)}${orderTime(b)}`));
};

const periodOrders = (orders, period) => {
  const today = new Date();
  const todayKey = dateKey(today);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = dateKey(tomorrow);
  const weekStart = new Date(today);
  weekStart.setHours(0, 0, 0, 0);
  const day = weekStart.getDay() || 7;
  weekStart.setDate(weekStart.getDate() - day + 1);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  return activeOrders(orders).filter((order) => {
    if (period === "today") return orderDate(order) === todayKey;
    if (period === "tomorrow") return orderDate(order) === tomorrowKey;
    const date = new Date(`${orderDate(order)}T00:00:00`);
    return date >= weekStart && date < weekEnd;
  });
};

const onboardingAnswer = () =>
  [
    "Заказов пока нет. Чтобы начать:",
    "1. Нажмите «Новый заказ» в верхнем меню.",
    "2. Выберите тип: Свадьба, Школьный, Реклама или Дизайн.",
    "3. Заполните клиента, телефон, дату, услугу, сумму и аванс.",
    "4. Нажмите «Сохранить». Заказ появится в списке, календаре и отчётах."
  ].join("\n");

const paymentSummary = (orders) => {
  const waiting = activeOrders(orders).filter((order) => orderPayment(order) !== "Оплачено");
  const total = waiting.reduce((sum, order) => sum + Math.max(Number(order.amount) - Number(order.deposit || 0), 0), 0);
  if (!waiting.length) return "По оплатам всё чисто: неоплаченных остатков нет.";
  return `Ожидается оплата по ${waiting.length} заказам. Общий остаток: ${money(total)}.\n${waiting
    .slice(0, 5)
    .map((order, index) => `${index + 1}. ${orderClient(order)} — ${money(Math.max(Number(order.amount) - Number(order.deposit || 0), 0))}, ${orderPayment(order)}`)
    .join("\n")}`;
};

export function generateAssistantAnswer(message, orders = [], expenses = []) {
  const text = clean(message);
  const active = activeOrders(orders);
  const work = workOrders(orders);
  const upcoming = upcomingOrders(orders);

  if (!text) return "Напишите вопрос по заказам, оплатам, календарю или отчётам.";

  if (includesAny(text, ["привет", "здравствуй", "салам", "hello", "hi"])) {
    if (!active.length) return `Привет. Я помогу вести CRM Pixe1.media.\n\n${onboardingAnswer()}`;
    return [
      "Привет. Короткая сводка:",
      `• Активных заказов: ${work.length}`,
      `• Ближайший заказ: ${upcoming[0] ? formatOrderLine(upcoming[0]) : "не найден"}`,
      `• Ожидают оплату: ${active.filter((order) => orderPayment(order) !== "Оплачено").length}`,
      "",
      "Спросите: «что сегодня», «кто должен оплатить», «ближайшие заказы», «выручка»."
    ].join("\n");
  }

  if (includesAny(text, ["как добавить", "создать заказ", "новый заказ", "добавить заказ", "завести заказ"])) {
    return [
      "Как добавить заказ:",
      "1. Нажмите «Новый заказ» в верхнем меню.",
      "2. Выберите тип заказа.",
      "3. Заполните клиента, телефон, дату, услугу, сумму, аванс и статус.",
      "4. Добавьте место, оператора, детали и заметку при необходимости.",
      "5. Нажмите «Сохранить»."
    ].join("\n");
  }

  if (includesAny(text, ["как редакт", "изменить", "поменять"])) {
    return "Чтобы изменить заказ: откройте «Заказы», нажмите меню с тремя точками у нужного заказа и выберите «Редактировать». В карточке заказа тоже есть кнопка «Редактировать».";
  }

  if (includesAny(text, ["удалить", "корзин", "восстановить"])) {
    return "Удаление работает через soft delete: заказ переносится во вкладку «Корзина» на странице «Заказы». Оттуда его можно восстановить.";
  }

  if (includesAny(text, ["сегодня", "today"])) {
    return listOrders("События на сегодня:", periodOrders(orders, "today"), "На сегодня заказов и событий нет.");
  }

  if (includesAny(text, ["завтра", "tomorrow"])) {
    return listOrders("События на завтра:", periodOrders(orders, "tomorrow"), "На завтра заказов нет.");
  }

  if (includesAny(text, ["недел", "на этой неделе"])) {
    return listOrders("Заказы на этой неделе:", periodOrders(orders, "week"), "На этой неделе заказов нет.");
  }

  if (includesAny(text, ["ближай", "следующ", "скоро", "что дальше"])) {
    return listOrders("Ближайшие заказы:", upcoming, "Ближайших заказов нет.");
  }

  if (includesAny(text, ["оплат", "долг", "остаток", "аванс", "должен"])) {
    return paymentSummary(orders);
  }

  if (includesAny(text, ["статус", "этап"])) {
    const counts = new Map();
    active.forEach((order) => counts.set(order.status, (counts.get(order.status) || 0) + 1));
    if (!counts.size) return "Заказов пока нет, поэтому статусы ещё не сформированы.";
    return `Статусы заказов:\n${Array.from(counts.entries()).map(([status, count]) => `• ${status}: ${count}`).join("\n")}`;
  }

  if (includesAny(text, ["тип", "свад", "школ", "реклам", "дизайн"])) {
    const counts = new Map();
    active.forEach((order) => counts.set(typeLabels[orderType(order)], (counts.get(typeLabels[orderType(order)]) || 0) + 1));
    if (!counts.size) return "В CRM доступны 4 типа заказов: Свадьба, Школьный, Реклама и Дизайн.";
    return `Распределение по типам:\n${Array.from(counts.entries()).map(([type, count]) => `• ${type}: ${count}`).join("\n")}`;
  }

  if (includesAny(text, ["выруч", "доход", "прибыл", "расход", "средний чек", "отчет", "отчёт"])) {
    const revenue = active.filter((order) => order.status !== "Отменён").reduce((sum, order) => sum + Number(order.amount || 0), 0);
    const paid = active.reduce((sum, order) => sum + Number(order.deposit || 0), 0);
    const expenseTotal = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    return [
      "Финансовая сводка:",
      `• Выручка по заказам: ${money(revenue)}`,
      `• Получено авансами: ${money(paid)}`,
      `• Расходы: ${money(expenseTotal)}`,
      `• Чистая прибыль: ${money(revenue - expenseTotal)}`,
      `• Средний чек: ${money(active.length ? revenue / active.length : 0)}`
    ].join("\n");
  }

  if (includesAny(text, ["календар", "дата", "расписан"])) {
    return "Календарь показывает активные заказы по датам. Можно фильтровать события по типу и открыть заказ кликом по событию.";
  }

  if (includesAny(text, ["замет", "коммент"])) {
    return "Заметки добавляются в карточке заказа в блоке «Заметки» и сохраняются в PostgreSQL при подключённом DATABASE_URL.";
  }

  if (!active.length) return onboardingAnswer();

  return [
    "Я могу помочь по CRM. Лучше задайте вопрос конкретнее:",
    "• что сегодня?",
    "• кто должен оплатить?",
    "• ближайшие заказы",
    "• покажи статусы",
    "• какая выручка?",
    "• как добавить заказ?"
  ].join("\n");
}
