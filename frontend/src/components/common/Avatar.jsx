import { cn } from "@/lib/utils";

const sizeMap = {
  xs: "h-6 w-6 text-xs",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

export function Avatar({ src, initials = "?", size = "md", className }) {
  if (src) {
    return (
      <img
        src={src}
        alt={initials}
        className={cn(
          "rounded-full object-cover ring-2 ring-border",
          sizeMap[size],
          className
        )}
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary font-semibold text-white",
        sizeMap[size],
        className
      )}
      aria-label={initials}
    >
      {initials.slice(0, 2).toUpperCase()}
    </span>
  );
}
