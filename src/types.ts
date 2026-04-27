export type OrderType = "wedding" | "school" | "ads" | "design";

export type OrderStatus =
  | "Новый"
  | "Подготовка"
  | "В работе"
  | "На согласовании"
  | "Ожидает оплаты"
  | "Подтверждён"
  | "Готово"
  | "Отменён";

export type PaymentStatus = "Не оплачено" | "Аванс" | "Частично оплачено" | "Оплачено";

export type Period = "today" | "week" | "month" | "year";

export interface OrderService {
  id: string;
  orderId: string;
  name: string;
  price: number;
  completed: boolean;
}

export interface OrderTimelineItem {
  id: string;
  orderId: string;
  title: string;
  description?: string | null;
  eventDate: string;
  status: string;
}

export interface OrderNote {
  id: string;
  orderId: string;
  text: string;
  createdAt: string;
}

export interface Order {
  id: string;
  type: OrderType;
  title: string;
  clientName: string;
  phone: string;
  email?: string | null;
  serviceType: string;
  date: string;
  time?: string | null;
  location?: string | null;
  amount: number;
  deposit: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  operator?: string | null;
  details?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  services?: OrderService[];
  timeline?: OrderTimelineItem[];
  notes?: OrderNote[];
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  date: string;
  category: string;
  createdAt: string;
}

export interface OrderPayload {
  type: OrderType;
  title: string;
  clientName: string;
  phone: string;
  email?: string;
  serviceType: string;
  date: string;
  time?: string;
  location?: string;
  amount: number;
  deposit: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  operator?: string;
  details?: string;
  note?: string;
  services?: Array<Pick<OrderService, "name" | "price" | "completed">>;
}

export interface ReportData {
  period: Period;
  revenue: number;
  expenses: number;
  profit: number;
  averageCheck: number;
  revenueByDay: Array<{ date: string; amount: number }>;
  byType: Array<{ type: OrderType; amount: number }>;
  topServices: Array<{ name: string; amount: number }>;
  recentOrders: Order[];
  expenseItems: Expense[];
}
