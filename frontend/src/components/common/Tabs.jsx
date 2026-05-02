import { Tabs as TabsPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

export function Tabs({ tabs = [], defaultValue, value, onValueChange, className }) {
  return (
    <TabsPrimitive.Root
      defaultValue={defaultValue ?? tabs[0]?.value}
      value={value}
      onValueChange={onValueChange}
      className={cn("w-full", className)}
    >
      <TabsPrimitive.List className="flex gap-0.5 border-b border-border mb-6">
        {tabs.map((tab) => (
          <TabsPrimitive.Trigger
            key={tab.value}
            value={tab.value}
            disabled={tab.disabled}
            className={cn(
              "inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-muted-foreground transition-colors border-b-2 border-transparent -mb-px rounded-t-lg outline-none",
              "hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
              "data-[state=active]:border-primary data-[state=active]:text-primary",
              tab.disabled && "pointer-events-none opacity-50"
            )}
          >
            {tab.icon && <tab.icon size={15} />}
            <span className={tab.labelClass}>{tab.label}</span>
            {tab.count !== undefined && (
              <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                {tab.count}
              </span>
            )}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>

      {tabs.map((tab) => (
        <TabsPrimitive.Content
          key={tab.value}
          value={tab.value}
          className="animate-fade-in outline-none"
        >
          {tab.content}
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  );
}
