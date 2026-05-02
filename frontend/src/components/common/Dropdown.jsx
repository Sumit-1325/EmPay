import { DropdownMenu as DropdownPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

export function Dropdown({ trigger, items = [], onSelect, align = "end", children }) {
  return (
    <DropdownPrimitive.Root>
      <DropdownPrimitive.Trigger asChild>
        {trigger}
      </DropdownPrimitive.Trigger>

      <DropdownPrimitive.Portal>
        <DropdownPrimitive.Content
          align={align}
          sideOffset={6}
          className="z-[100] min-w-[10rem] rounded-xl border border-border bg-popover p-1 shadow-lg animate-fade-down"
        >
          {children
            ? children
            : items.map((item, i) => {
                if (item.separator) {
                  return <DropdownPrimitive.Separator key={i} className="my-1 border-t border-border" />;
                }
                return (
                  <DropdownPrimitive.Item
                    key={i}
                    disabled={item.disabled}
                    onSelect={() => onSelect?.(item)}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none transition-colors",
                      item.destructive
                        ? "text-destructive hover:bg-destructive/10 focus:bg-destructive/10"
                        : "text-foreground hover:bg-muted focus:bg-muted",
                      item.disabled && "pointer-events-none opacity-50"
                    )}
                  >
                    {item.icon && <item.icon size={14} />}
                    {item.label}
                  </DropdownPrimitive.Item>
                );
              })}
        </DropdownPrimitive.Content>
      </DropdownPrimitive.Portal>
    </DropdownPrimitive.Root>
  );
}

export {
  DropdownPrimitive as DropdownMenu,
};
