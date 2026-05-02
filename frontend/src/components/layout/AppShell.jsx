import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { MobileNav } from "./MobileNav";
import { useSidebar } from "@/hooks/useSidebar";
import { cn } from "@/lib/utils";

export function AppShell() {
  const { isOpen } = useSidebar();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile nav drawer */}
      <MobileNav />

      {/* Topbar */}
      <Topbar />

      {/* Main content */}
      <main
        className={cn(
          "min-h-screen pt-16 transition-all duration-300",
          "md:ml-16",
          isOpen && "md:ml-60"
        )}
      >
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
