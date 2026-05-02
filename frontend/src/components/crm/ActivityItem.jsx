import { Phone, Mail, Calendar, FileText, Briefcase, Activity } from "lucide-react";
import { formatRelativeTime } from "@/lib/formatters";
import { cn } from "@/lib/utils";

const TYPE_CONFIG = {
  call:    { icon: Phone,     color: "text-blue-500",    bg: "bg-blue-500/10" },
  email:   { icon: Mail,      color: "text-violet-500",  bg: "bg-violet-500/10" },
  meeting: { icon: Calendar,  color: "text-emerald-500", bg: "bg-emerald-500/10" },
  note:    { icon: FileText,  color: "text-amber-500",   bg: "bg-amber-500/10" },
  deal:    { icon: Briefcase, color: "text-primary",     bg: "bg-primary/10" },
  default: { icon: Activity,  color: "text-muted-foreground", bg: "bg-muted" },
};

export function ActivityItem({ activity, onSelect, isLast = false }) {
  const config = TYPE_CONFIG[activity.type] ?? TYPE_CONFIG.default;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "relative flex gap-4 pb-6",
        !isLast && "before:absolute before:left-[19px] before:top-10 before:h-full before:w-px before:bg-border"
      )}
    >
      {/* Icon bubble */}
      <div className={cn("relative z-10 mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full", config.bg)}>
        <Icon size={16} className={config.color} />
      </div>

      {/* Content */}
      <button
        type="button"
        onClick={() => onSelect?.(activity)}
        className="flex-1 text-left rounded-lg p-2 -ml-2 hover:bg-muted/60 transition-colors"
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-foreground leading-snug">{activity.title}</p>
          <time className="shrink-0 text-xs text-muted-foreground">
            {formatRelativeTime(activity.createdAt)}
          </time>
        </div>
        {activity.description && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{activity.description}</p>
        )}
        {activity.contactName && (
          <p className="mt-1 text-xs text-primary">{activity.contactName}</p>
        )}
      </button>
    </div>
  );
}
