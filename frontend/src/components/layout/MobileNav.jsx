import { NavLink } from "react-router-dom";
import { X, LayoutDashboard, Users, Briefcase, Activity, BarChart2, Settings } from "lucide-react";
import { useContext } from "react";
import { LayoutContext } from "@/context/LayoutContext";
import { useAuth } from "@/context/AuthContext";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: ROUTES.DASHBOARD,  icon: LayoutDashboard, label: "Dashboard" },
  { to: ROUTES.CONTACTS,   icon: Users,           label: "Contacts" },
  { to: ROUTES.DEALS,      icon: Briefcase,        label: "Deals" },
  { to: ROUTES.ACTIVITIES, icon: Activity,         label: "Activities" },
  { to: ROUTES.REPORTS,    icon: BarChart2,         label: "Reports" },
  { to: ROUTES.SETTINGS,   icon: Settings,         label: "Settings", adminOnly: true },
];

export function MobileNav() {
  const { mobileNavOpen, closeMobileNav } = useContext(LayoutContext);
  const { user } = useAuth();

  if (!mobileNavOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[350] bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={closeMobileNav}
      />
      {/* Drawer */}
      <nav className="fixed left-0 top-0 z-[400] h-full w-64 border-r border-border bg-sidebar text-sidebar-foreground animate-slide-in-left">
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-secondary text-sm font-bold text-white">
              W
            </div>
            <span className="text-sm font-semibold">WorkspaceOS</span>
          </div>
          <button
            onClick={closeMobileNav}
            aria-label="Close menu"
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors focus-ring"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-1 p-3">
          {NAV_ITEMS.filter(({ adminOnly }) => !adminOnly || user?.role === "ADMIN").map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === ROUTES.DASHBOARD}
              onClick={closeMobileNav}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-ring",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}
