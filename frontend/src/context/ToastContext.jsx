import { createContext, useContext, useState, useCallback, useRef } from "react";
import * as RadixToast from "@radix-ui/react-toast";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const ToastContext = createContext(null);

const VARIANTS = {
  default:     "bg-card border-border text-foreground",
  success:     "bg-green-50 border-green-200 text-green-900 dark:bg-green-950 dark:border-green-800 dark:text-green-100",
  error:       "bg-red-50 border-red-200 text-red-900 dark:bg-red-950 dark:border-red-800 dark:text-red-100",
  warning:     "bg-yellow-50 border-yellow-200 text-yellow-900 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-100",
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);

  const toast = useCallback(({ title, description, variant = "default", duration = 4000 }) => {
    const id = ++counter.current;
    setToasts((prev) => [...prev, { id, title, description, variant, duration, open: true }]);
  }, []);

  function dismiss(id) {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, open: false } : t)));
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 300);
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      <RadixToast.Provider swipeDirection="right">
        {children}

        {toasts.map((t) => (
          <RadixToast.Root
            key={t.id}
            open={t.open}
            onOpenChange={(open) => !open && dismiss(t.id)}
            duration={t.duration}
            className={cn(
              "flex items-start gap-3 p-4 pr-8 rounded-xl border shadow-lg",
              "data-[state=open]:animate-fade-up data-[state=closed]:opacity-0",
              "transition-all duration-200 relative",
              VARIANTS[t.variant] ?? VARIANTS.default
            )}
          >
            <div className="flex-1 min-w-0">
              {t.title && (
                <RadixToast.Title className="text-sm font-semibold leading-tight">
                  {t.title}
                </RadixToast.Title>
              )}
              {t.description && (
                <RadixToast.Description className="text-xs mt-0.5 opacity-80">
                  {t.description}
                </RadixToast.Description>
              )}
            </div>
            <RadixToast.Close
              onClick={() => dismiss(t.id)}
              className="absolute top-3 right-3 opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </RadixToast.Close>
          </RadixToast.Root>
        ))}

        <RadixToast.Viewport className="fixed bottom-4 right-4 z-[700] flex flex-col gap-2 w-80 max-w-[100vw]" />
      </RadixToast.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
