import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

type CardColor = "green" | "blue" | "amber" | "purple";

interface MetricCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  trend?: { value: number; label: string } | null;
  color?: CardColor;
}

const colorMap: Record<CardColor, { icon: string; badge: string }> = {
  green: {
    icon: "bg-[#254F40]/10 text-[#254F40]",
    badge: "bg-emerald-50 text-emerald-700",
  },
  blue: {
    icon: "bg-sky-100 text-sky-700",
    badge: "bg-sky-50 text-sky-700",
  },
  amber: {
    icon: "bg-amber-100 text-amber-700",
    badge: "bg-amber-50 text-amber-700",
  },
  purple: {
    icon: "bg-violet-100 text-violet-700",
    badge: "bg-violet-50 text-violet-700",
  },
};

export function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  color = "green",
}: MetricCardProps) {
  const colors = colorMap[color];

  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className={cn("p-2 rounded-lg", colors.icon)}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div>
        <p className="text-3xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>

      {trend !== null && trend !== undefined && (
        <div
          className={cn(
            "flex items-center gap-1 text-xs font-medium w-fit rounded-full px-2 py-0.5",
            colors.badge
          )}
        >
          {trend.value >= 0 ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          {trend.value >= 0 ? "+" : ""}
          {trend.value}% {trend.label}
        </div>
      )}
    </div>
  );
}
