import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({ label, value, trend, trendValue, icon: Icon, className }) {
  const isUp = trend === "up";
  const isDown = trend === "down";

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
        </div>
        {Icon && (
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <Icon size={20} />
          </div>
        )}
      </div>

      {trendValue !== undefined && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          {isUp && <TrendingUp size={13} className="text-emerald-500" />}
          {isDown && <TrendingDown size={13} className="text-destructive" />}
          {!isUp && !isDown && <Minus size={13} className="text-muted-foreground" />}
          <span
            className={cn(
              "font-medium",
              isUp && "text-emerald-600 dark:text-emerald-400",
              isDown && "text-destructive",
              !isUp && !isDown && "text-muted-foreground"
            )}
          >
            {trendValue}
          </span>
          <span className="text-muted-foreground">vs last month</span>
        </div>
      )}
    </div>
  );
}
