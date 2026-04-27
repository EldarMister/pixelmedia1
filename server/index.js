import "dotenv/config";
import cors from "cors";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hasDatabase, pool, query, transaction } from "./db.js";
import { runMigrations } from "./migrate.js";
import { generateAssistantAnswer } from "./assistant.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const app = express();
const port = Number(process.env.PORT || 4000);
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";
const trashRetentionDays = 7;

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || origin === corsOrigin || process.env.NODE_ENV === "production") {
        callback(null, true);
        return;
      }
      callback(null, true);
    }
  })
);
app.use(express.json({ limit: "1mb" }));

const orderColumns = `
  id, type, title, client_name, phone, email, service_type, date, time, location,
  amount::float AS amount, deposit::float AS deposit, status, payment_status,
  operator, details, created_at, updated_at, deleted_at
`;

const purgeExpiredDeletedOrders = async () => {
  if (!hasDatabase) return 0;
  const result = await query(
    "DELETE FROM orders WHERE deleted_at IS NOT NULL AND deleted_at < now() - ($1::int * interval '1 day')",
    [trashRetentionDays]
  );
  return result.rowCount || 0;
};

const parseOrderInput = (body) => ({
  type: body.type || "wedding",
  title: body.title || body.client_name || body.clientName || "Без имени",
  client_name: body.client_name || body.clientName || body.title || "Без имени",
  phone: body.phone || "",
  email: body.email || null,
  service_type: body.service_type || body.serviceType || "Без услуги",
  date: body.date || new Date().toISOString().slice(0, 10),
  time: body.time || null,
  location: body.location || null,
  amount: Number(body.amount || 0),
  deposit: Number(body.deposit || 0),
  status: body.status || "Новый",
  payment_status: body.payment_status || body.paymentStatus || "Не оплачено",
  operator: body.operator || null,
  details: body.details || null
});

const toCamelOrder = (row) => ({
  id: row.id,
  type: row.type,
  title: row.title,
  clientName: row.client_name,
  phone: row.phone,
  email: row.email,
  serviceType: row.service_type,
  date: row.date,
  time: row.time,
  location: row.location,
  amount: Number(row.amount || 0),
  deposit: Number(row.deposit || 0),
  status: row.status,
  paymentStatus: row.payment_status,
  operator: row.operator,
  details: row.details,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  deletedAt: row.deleted_at
});

const toCamelService = (row) => ({
  id: row.id,
  orderId: row.order_id,
  name: row.name,
  price: Number(row.price || 0),
  completed: Boolean(row.completed)
});

const toCamelTimeline = (row) => ({
  id: row.id,
  orderId: row.order_id,
  title: row.title,
  description: row.description,
  eventDate: row.event_date,
  status: row.status
});

const toCamelNote = (row) => ({
  id: row.id,
  orderId: row.order_id,
  text: row.text,
  createdAt: row.created_at
});

const toCamelExpense = (row) => ({
  id: row.id,
  title: row.title,
  amount: Number(row.amount || 0),
  date: row.date,
  category: row.category,
  createdAt: row.created_at
});

const normalizeServices = (body) => {
  if (Array.isArray(body.services) && body.services.length) {
    return body.services.map((service) => ({
      name: service.name,
      price: Number(service.price || 0),
      completed: Boolean(service.completed)
    }));
  }

  const serviceType = body.service_type || body.serviceType || "Без услуги";
  return [
    {
      name: serviceType,
      price: Number(body.amount || 0),
      completed: false
    }
  ];
};

const dateRangeForPeriod = (period) => {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (period === "today") {
    return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
  }
  if (period === "year") {
    start.setMonth(0, 1);
    const end = new Date(start);
    end.setFullYear(end.getFullYear() + 1);
    return { start, end };
  }
  if (period === "month") {
    start.setDate(1);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    return { start, end };
  }

  const day = start.getDay() || 7;
  start.setDate(start.getDate() - day + 1);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { start, end };
};

const asyncRoute = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (error) {
    next(error);
  }
};

app.get("/api/health", asyncRoute(async (_req, res) => {
  let db = false;
  if (hasDatabase) {
    try {
      await query("SELECT 1");
      db = true;
    } catch (_error) {
      db = false;
    }
  }
  res.json({ ok: true, db, service: "pixelmedia-crm" });
}));

app.get("/api/orders", asyncRoute(async (req, res) => {
  await purgeExpiredDeletedOrders();
  const includeDeleted = req.query.includeDeleted === "true";
  const trashOnly = req.query.trash === "true";
  const clauses = [];
  const params = [];

  if (trashOnly) {
    clauses.push("deleted_at IS NOT NULL");
  } else if (!includeDeleted) {
    clauses.push("deleted_at IS NULL");
  }
  if (req.query.type) {
    params.push(req.query.type);
    clauses.push(`type = $${params.length}`);
  }
  if (req.query.search) {
    params.push(`%${String(req.query.search).toLowerCase()}%`);
    clauses.push(
      `(lower(client_name) LIKE $${params.length} OR lower(phone) LIKE $${params.length} OR lower(service_type) LIKE $${params.length})`
    );
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = await query(
    `SELECT ${orderColumns} FROM orders ${where} ORDER BY date ASC, time ASC NULLS LAST`,
    params
  );
  res.json(rows.rows.map(toCamelOrder));
}));

app.get("/api/orders/:id", asyncRoute(async (req, res) => {
  await purgeExpiredDeletedOrders();
  const orderResult = await query(`SELECT ${orderColumns} FROM orders WHERE id = $1`, [
    req.params.id
  ]);
  if (!orderResult.rowCount) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const [services, timeline, notes] = await Promise.all([
    query("SELECT * FROM order_services WHERE order_id = $1 ORDER BY name", [req.params.id]),
    query("SELECT * FROM order_timeline WHERE order_id = $1 ORDER BY event_date", [req.params.id]),
    query("SELECT * FROM order_notes WHERE order_id = $1 ORDER BY created_at DESC", [req.params.id])
  ]);

  res.json({
    ...toCamelOrder(orderResult.rows[0]),
    services: services.rows.map(toCamelService),
    timeline: timeline.rows.map(toCamelTimeline),
    notes: notes.rows.map(toCamelNote)
  });
}));

app.post("/api/orders", asyncRoute(async (req, res) => {
  const input = parseOrderInput(req.body);
  const services = normalizeServices(req.body);
  const note = req.body.note || req.body.notes;

  const created = await transaction(async (client) => {
    const order = await client.query(
      `INSERT INTO orders
      (type, title, client_name, phone, email, service_type, date, time, location, amount, deposit, status, payment_status, operator, details)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      RETURNING ${orderColumns}`,
      [
        input.type,
        input.title,
        input.client_name,
        input.phone,
        input.email,
        input.service_type,
        input.date,
        input.time,
        input.location,
        input.amount,
        input.deposit,
        input.status,
        input.payment_status,
        input.operator,
        input.details
      ]
    );
    const orderId = order.rows[0].id;

    for (const service of services) {
      await client.query(
        "INSERT INTO order_services (order_id, name, price, completed) VALUES ($1,$2,$3,$4)",
        [orderId, service.name, service.price, service.completed]
      );
    }

    await client.query(
      "INSERT INTO order_timeline (order_id, title, description, event_date, status) VALUES ($1,$2,$3,$4,$5)",
      [
        orderId,
        "Заказ создан",
        "Первичная заявка добавлена в CRM",
        `${input.date}T${input.time || "10:00"}:00`,
        "Выполнено"
      ]
    );

    if (note) {
      await client.query("INSERT INTO order_notes (order_id, text) VALUES ($1,$2)", [
        orderId,
        note
      ]);
    }

    return order.rows[0];
  });

  res.status(201).json(toCamelOrder(created));
}));

app.patch("/api/orders/:id", asyncRoute(async (req, res) => {
  const input = parseOrderInput(req.body);
  const services = Array.isArray(req.body.services) ? normalizeServices(req.body) : null;

  const updated = await transaction(async (client) => {
    const order = await client.query(
      `UPDATE orders SET
        type = $1,
        title = $2,
        client_name = $3,
        phone = $4,
        email = $5,
        service_type = $6,
        date = $7,
        time = $8,
        location = $9,
        amount = $10,
        deposit = $11,
        status = $12,
        payment_status = $13,
        operator = $14,
        details = $15
      WHERE id = $16
      RETURNING ${orderColumns}`,
      [
        input.type,
        input.title,
        input.client_name,
        input.phone,
        input.email,
        input.service_type,
        input.date,
        input.time,
        input.location,
        input.amount,
        input.deposit,
        input.status,
        input.payment_status,
        input.operator,
        input.details,
        req.params.id
      ]
    );

    if (!order.rowCount) return null;

    if (services) {
      await client.query("DELETE FROM order_services WHERE order_id = $1", [req.params.id]);
      for (const service of services) {
        await client.query(
          "INSERT INTO order_services (order_id, name, price, completed) VALUES ($1,$2,$3,$4)",
          [req.params.id, service.name, service.price, service.completed]
        );
      }
    }

    return order.rows[0];
  });

  if (!updated) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(toCamelOrder(updated));
}));

app.delete("/api/orders/:id", asyncRoute(async (req, res) => {
  const result = await query(
    `UPDATE orders SET deleted_at = now() WHERE id = $1 RETURNING ${orderColumns}`,
    [req.params.id]
  );
  if (!result.rowCount) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(toCamelOrder(result.rows[0]));
}));

app.post("/api/orders/:id/restore", asyncRoute(async (req, res) => {
  const result = await query(
    `UPDATE orders SET deleted_at = NULL WHERE id = $1 RETURNING ${orderColumns}`,
    [req.params.id]
  );
  if (!result.rowCount) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(toCamelOrder(result.rows[0]));
}));

app.get("/api/orders/:id/notes", asyncRoute(async (req, res) => {
  const notes = await query("SELECT * FROM order_notes WHERE order_id = $1 ORDER BY created_at DESC", [
    req.params.id
  ]);
  res.json(notes.rows.map(toCamelNote));
}));

app.post("/api/orders/:id/notes", asyncRoute(async (req, res) => {
  const result = await query(
    "INSERT INTO order_notes (order_id, text) VALUES ($1,$2) RETURNING *",
    [req.params.id, req.body.text]
  );
  res.status(201).json(toCamelNote(result.rows[0]));
}));

app.delete("/api/notes/:id", asyncRoute(async (req, res) => {
  await query("DELETE FROM order_notes WHERE id = $1", [req.params.id]);
  res.status(204).end();
}));

app.get("/api/orders/:id/timeline", asyncRoute(async (req, res) => {
  const timeline = await query(
    "SELECT * FROM order_timeline WHERE order_id = $1 ORDER BY event_date",
    [req.params.id]
  );
  res.json(timeline.rows.map(toCamelTimeline));
}));

app.post("/api/orders/:id/timeline", asyncRoute(async (req, res) => {
  const result = await query(
    "INSERT INTO order_timeline (order_id, title, description, event_date, status) VALUES ($1,$2,$3,$4,$5) RETURNING *",
    [req.params.id, req.body.title, req.body.description || null, req.body.eventDate, req.body.status]
  );
  res.status(201).json(toCamelTimeline(result.rows[0]));
}));

app.patch("/api/timeline/:id", asyncRoute(async (req, res) => {
  const result = await query(
    "UPDATE order_timeline SET title = $1, description = $2, event_date = $3, status = $4 WHERE id = $5 RETURNING *",
    [req.body.title, req.body.description || null, req.body.eventDate, req.body.status, req.params.id]
  );
  if (!result.rowCount) {
    res.status(404).json({ error: "Timeline item not found" });
    return;
  }
  res.json(toCamelTimeline(result.rows[0]));
}));

app.get("/api/calendar", asyncRoute(async (req, res) => {
  await purgeExpiredDeletedOrders();
  const month = String(req.query.month || "").match(/^\d{4}-\d{2}$/)
    ? String(req.query.month)
    : new Date().toISOString().slice(0, 7);
  const start = `${month}-01`;
  const endDate = new Date(`${start}T00:00:00`);
  endDate.setMonth(endDate.getMonth() + 1);
  const params = [start, endDate.toISOString().slice(0, 10)];
  const clauses = ["deleted_at IS NULL", "date >= $1", "date < $2"];

  if (req.query.type) {
    params.push(req.query.type);
    clauses.push(`type = $${params.length}`);
  }

  const result = await query(
    `SELECT ${orderColumns} FROM orders WHERE ${clauses.join(" AND ")} ORDER BY date, time ASC NULLS LAST`,
    params
  );
  res.json(result.rows.map(toCamelOrder));
}));

app.get("/api/reports", asyncRoute(async (req, res) => {
  await purgeExpiredDeletedOrders();
  const period = ["today", "week", "month", "year"].includes(req.query.period)
    ? req.query.period
    : "week";
  const { start, end } = dateRangeForPeriod(period);

  const params = [start.toISOString(), end.toISOString()];
  const [orders, expenses] = await Promise.all([
    query(
      `SELECT ${orderColumns}
       FROM orders
       WHERE deleted_at IS NULL AND status != 'Отменён' AND date >= $1 AND date < $2
       ORDER BY date ASC, time ASC NULLS LAST`,
      params
    ),
    query("SELECT * FROM expenses WHERE date >= $1 AND date < $2 ORDER BY date DESC", params)
  ]);

  const normalizedOrders = orders.rows.map(toCamelOrder);
  const normalizedExpenses = expenses.rows.map(toCamelExpense);
  const revenue = normalizedOrders.reduce((sum, order) => sum + order.amount, 0);
  const expenseTotal = normalizedExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const averageCheck = normalizedOrders.length ? revenue / normalizedOrders.length : 0;

  const revenueByDay = new Map();
  for (const order of normalizedOrders) {
    const key = String(order.date).slice(0, 10);
    revenueByDay.set(key, (revenueByDay.get(key) || 0) + order.amount);
  }

  const byType = new Map();
  for (const order of normalizedOrders) {
    byType.set(order.type, (byType.get(order.type) || 0) + order.amount);
  }

  const topServices = new Map();
  for (const order of normalizedOrders) {
    topServices.set(order.serviceType, (topServices.get(order.serviceType) || 0) + order.amount);
  }

  res.json({
    period,
    revenue,
    expenses: expenseTotal,
    profit: revenue - expenseTotal,
    averageCheck,
    revenueByDay: Array.from(revenueByDay, ([date, amount]) => ({ date, amount })),
    byType: Array.from(byType, ([type, amount]) => ({ type, amount })),
    topServices: Array.from(topServices, ([name, amount]) => ({ name, amount })).sort(
      (a, b) => b.amount - a.amount
    ),
    recentOrders: normalizedOrders.slice(-6).reverse(),
    expenseItems: normalizedExpenses
  });
}));

app.get("/api/expenses", asyncRoute(async (_req, res) => {
  const result = await query("SELECT * FROM expenses ORDER BY date DESC, created_at DESC");
  res.json(result.rows.map(toCamelExpense));
}));

app.post("/api/expenses", asyncRoute(async (req, res) => {
  const result = await query(
    "INSERT INTO expenses (title, amount, date, category) VALUES ($1,$2,$3,$4) RETURNING *",
    [req.body.title, Number(req.body.amount || 0), req.body.date, req.body.category || "Общее"]
  );
  res.status(201).json(toCamelExpense(result.rows[0]));
}));

app.delete("/api/expenses/:id", asyncRoute(async (req, res) => {
  await query("DELETE FROM expenses WHERE id = $1", [req.params.id]);
  res.status(204).end();
}));

app.post("/api/ai/chat", asyncRoute(async (req, res) => {
  if (!hasDatabase && req.body?.context?.orders) {
    res.json({
      answer: generateAssistantAnswer(req.body.message, req.body.context.orders, req.body.context.expenses || [])
    });
    return;
  }

  await purgeExpiredDeletedOrders();
  const ordersResult = await query(
    `SELECT ${orderColumns} FROM orders WHERE deleted_at IS NULL ORDER BY date ASC LIMIT 200`
  );
  const orders = ordersResult.rows.map(toCamelOrder);
  const expensesResult = await query("SELECT * FROM expenses ORDER BY date DESC LIMIT 200");
  const expenses = expensesResult.rows.map(toCamelExpense);

  res.json({ answer: generateAssistantAnswer(req.body.message, orders, expenses) });
}));

const distDir = path.join(rootDir, "dist");
app.use(express.static(distDir));
app.get(/.*/, (_req, res, next) => {
  res.sendFile(path.join(distDir, "index.html"), (error) => {
    if (error) next();
  });
});

app.use((error, _req, res, _next) => {
  if (error.code === "NO_DATABASE") {
    res.status(503).json({
      error: "Database is not configured",
      message: "Set DATABASE_URL to enable PostgreSQL persistence."
    });
    return;
  }
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
});

let server;

try {
  const migrationResult = await runMigrations();
  if (migrationResult.skipped) {
    console.log(`Database migration skipped: ${migrationResult.reason}`);
  } else {
    console.log("Database schema is ready.");
  }

  const purgedOrders = await purgeExpiredDeletedOrders();
  if (purgedOrders) {
    console.log(`Purged ${purgedOrders} expired trashed orders.`);
  }

  server = app.listen(port, () => {
    console.log(`Pixe1.media CRM API is running on port ${port}`);
    if (!hasDatabase) {
      console.log("DATABASE_URL is not configured. Local development can use localStorage fallback.");
    }
  });
} catch (error) {
  console.error("Failed to start Pixe1.media CRM API:", error);
  process.exit(1);
}

process.on("SIGTERM", async () => {
  server?.close(async () => {
    if (pool) await pool.end();
  });
});
