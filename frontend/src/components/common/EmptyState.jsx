import { cn } from "@/lib/utils";

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 py-16 px-6 text-center animate-fade-in",
        className
      )}
    >
      {Icon && (
        <div className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-muted text-muted-foreground">
          <Icon size={24} />
        </div>
      )}
      <p className="text-base font-semibold text-foreground">{title}</p>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground max-w-xs">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
