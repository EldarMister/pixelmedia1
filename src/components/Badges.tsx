import { BriefcaseBusiness, GraduationCap, Heart, Megaphone, PenTool } from "lucide-react";
import { ORDER_TYPES, STATUS_BADGE, TYPE_LABELS } from "../data/constants";
import type { OrderStatus, OrderType } from "../types";

const iconMap = {
  wedding: Heart,
  school: GraduationCap,
  ads: Megaphone,
  design: PenTool
};

export function TypeIcon({ type, className = "h-4 w-4" }: { type: OrderType; className?: string }) {
  const Icon = iconMap[type] || BriefcaseBusiness;
  return <Icon className={className} />;
}

export function TypeBadge({ type, compact = false }: { type: OrderType; compact?: boolean }) {
  const config = ORDER_TYPES.find((item) => item.key === type)!;
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs font-medium ${config.bg} ${config.border} ${config.color}`}
    >
      <TypeIcon type={type} className="h-4 w-4" />
      {!compact && TYPE_LABELS[type]}
    </span>
  );
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-medium ${STATUS_BADGE[status]}`}>
      {status}
    </span>
  );
}
