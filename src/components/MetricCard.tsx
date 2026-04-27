import type { LucideIcon } from "lucide-react";

export function MetricCard({
  icon: Icon,
  label,
  value,
  helper,
  tone = "blue"
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  helper?: string;
  tone?: "blue" | "violet" | "orange" | "green";
}) {
  const tones = {
    blue: "text-blue-300 bg-blue-500/10 border-blue-400/25",
    violet: "text-violet-300 bg-violet-500/10 border-violet-400/25",
    orange: "text-orange-300 bg-orange-500/10 border-orange-400/25",
    green: "text-emerald-300 bg-emerald-500/10 border-emerald-400/25"
  };

  return (
    <section className="panel flex min-h-[118px] items-center gap-5 p-5">
      <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border ${tones[tone]}`}>
        <Icon className="h-7 w-7" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-slate-400">{label}</p>
        <p className="mt-1 text-2xl font-bold text-white md:text-3xl">{value}</p>
        {helper && <p className="mt-1 text-sm font-medium text-accent">{helper}</p>}
      </div>
    </section>
  );
}
