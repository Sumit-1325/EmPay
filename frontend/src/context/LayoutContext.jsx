import { createContext, useState } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

export const LayoutContext = createContext(null);

export function LayoutProvider({ children }) {
  const [sidebarOpen, setSidebarOpen] = useLocalStorage("crm-sidebar-open", true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const toggleSidebar   = () => setSidebarOpen((o) => !o);
  const toggleMobileNav = () => setMobileNavOpen((o) => !o);
  const closeMobileNav  = () => setMobileNavOpen(false);

  return (
    <LayoutContext.Provider value={{
      sidebarOpen,
      setSidebarOpen,
      toggleSidebar,
      mobileNavOpen,
      toggleMobileNav,
      closeMobileNav,
    }}>
      {children}
    </LayoutContext.Provider>
  );
}
