import { BarChart3, CalendarDays, Home, Plus, Search, ShoppingBag, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { initials } from "../lib/format";

const navItems = [
  { to: "/", label: "Главная", icon: Home },
  { to: "/orders", label: "Заказы", icon: ShoppingBag },
  { to: "/calendar", label: "Календарь", icon: CalendarDays },
  { to: "/reports", label: "Отчёты", icon: BarChart3 }
];

export function Layout({
  children,
  onNewOrder,
  search,
  onSearchChange
}: {
  children: ReactNode;
  onNewOrder: () => void;
  search: string;
  onSearchChange: (value: string) => void;
}) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen px-3 py-3 md:px-5">
      <header className="sticky top-3 z-30 mx-auto max-w-[1800px] rounded-lg border border-white/10 bg-navy-950/80 px-4 py-3 shadow-soft backdrop-blur md:px-8">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex min-w-fit items-center text-left text-2xl font-bold text-white"
            aria-label="На главную"
          >
            Pixe<span className="text-accent">1</span><span className="font-medium text-slate-300">.media</span>
          </button>

          <div className="relative ml-auto hidden w-full max-w-[470px] lg:block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              onFocus={() => navigate("/orders")}
              className="field h-12 pl-12 pr-20"
              placeholder="Поиск по заказам и клиентам"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500">Ctrl + K</span>
          </div>

          <nav className="ml-auto hidden items-center gap-2 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `relative px-5 py-3 text-sm font-semibold transition ${
                    isActive ? "text-white" : "text-slate-300 hover:text-white"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {item.label}
                    {isActive && <span className="absolute inset-x-4 -bottom-3 h-0.5 rounded bg-accent" />}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <button type="button" onClick={onNewOrder} className="primary-button ml-auto md:ml-2">
            <span className="hidden sm:inline">Новый заказ</span>
            <span className="sm:hidden">Новый</span>
            <Plus className="h-4 w-4" />
          </button>

          <button type="button" className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-200 md:flex">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-slate-200 to-slate-500 text-xs font-bold text-navy-950">
              {initials("Алексей")}
            </span>
            <UserRound className="h-4 w-4 text-slate-400" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1740px] px-1 py-7 md:px-8 md:py-8">{children}</main>

      <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 rounded-lg border border-white/10 bg-navy-950/90 p-1 shadow-soft backdrop-blur md:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 rounded-lg py-2 text-[11px] font-medium ${
                  isActive ? "bg-accent text-white" : "text-slate-400"
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
