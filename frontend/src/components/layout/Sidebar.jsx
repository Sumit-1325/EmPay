import { NavLink } from "react-router-dom";
import {
  Users, CalendarCheck, CalendarOff,
  Banknote, BarChart2, Settings, ChevronLeft, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/hooks/useSidebar";
import { useAuth } from "@/context/AuthContext";
import { ROUTES } from "@/constants/routes";

const NAV_ITEMS = [
  { to: ROUTES.EMPLOYEES,  icon: Users,          label: "Employees"  },
  { to: ROUTES.ATTENDANCE, icon: CalendarCheck,  label: "Attendance" },
  { to: ROUTES.TIME_OFF,   icon: CalendarOff,    label: "Time Off"   },
  { to: ROUTES.PAYROLL,    icon: Banknote,        label: "Payroll"    },
  { to: ROUTES.REPORTS,    icon: BarChart2,       label: "Reports"    },
];

export function Sidebar() {
  const { isOpen, toggle } = useSidebar();
  const { user } = useAuth();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-[300] flex h-full flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out",
        isOpen ? "w-60" : "w-16"
      )}
    >
      {/* Company branding */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-4">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-primary to-secondary text-sm font-bold text-white">
          {user?.company?.code?.slice(0, 1) ?? "E"}
        </div>
        {isOpen && (
          <div className="animate-fade-in min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight">
              {user?.company?.name ?? "EmPay"}
            </p>
            <p className="truncate text-[0.65rem] text-muted-foreground">
              {user?.company?.code ?? "HRMS"}
            </p>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 focus-ring",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
            title={!isOpen ? label : undefined}
          >
            <Icon size={18} className="shrink-0" />
            {isOpen && <span className="animate-fade-in truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Settings + collapse toggle */}
      <div className="border-t border-border p-3 space-y-1">
        <NavLink
          to={ROUTES.SETTINGS}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 focus-ring",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )
          }
          title={!isOpen ? "Settings" : undefined}
        >
          <Settings size={18} className="shrink-0" />
          {isOpen && <span className="animate-fade-in">Settings</span>}
        </NavLink>

        <button
          onClick={toggle}
          aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-ring"
        >
          {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          {isOpen && <span className="animate-fade-in">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
