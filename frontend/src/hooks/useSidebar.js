import { useContext } from "react";
import { LayoutContext } from "@/context/LayoutContext";

export function useSidebar() {
  const ctx = useContext(LayoutContext);
  if (!ctx) throw new Error("useSidebar must be used inside LayoutProvider");
  return { isOpen: ctx.sidebarOpen, toggle: ctx.toggleSidebar, setOpen: ctx.setSidebarOpen };
}
