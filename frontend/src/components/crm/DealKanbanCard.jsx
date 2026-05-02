import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, User, Calendar } from "lucide-react";
import { formatCompactCurrency, formatRelativeTime } from "@/lib/formatters";
import { cn } from "@/lib/utils";

export function DealKanbanCard({ deal, onSelect }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "kanban-card group rounded-xl border border-border bg-card p-3.5 shadow-sm cursor-pointer select-none",
        "transition-all duration-150",
        isDragging && "opacity-50 shadow-xl scale-[1.02] border-primary/30"
      )}
      onClick={() => !isDragging && onSelect?.(deal)}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2 flex-1">
          {deal.title}
        </p>
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
          className="shrink-0 cursor-grab active:cursor-grabbing rounded p-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity touch-none"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={14} />
        </button>
      </div>

      {deal.company && (
        <p className="mt-1 text-xs text-muted-foreground truncate">{deal.company}</p>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-foreground">
          {formatCompactCurrency(deal.value ?? 0)}
        </span>
        {deal.probability !== undefined && (
          <span className="text-xs text-muted-foreground">{deal.probability}%</span>
        )}
      </div>

      {(deal.owner || deal.closeDate) && (
        <div className="mt-2.5 flex items-center gap-3 text-xs text-muted-foreground">
          {deal.owner && (
            <span className="flex items-center gap-1">
              <User size={11} /> {deal.owner}
            </span>
          )}
          {deal.closeDate && (
            <span className="flex items-center gap-1 ml-auto">
              <Calendar size={11} /> {formatRelativeTime(deal.closeDate)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
