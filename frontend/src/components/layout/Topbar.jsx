import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, Sun, Moon, Menu, LogOut, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { useSidebar } from "@/hooks/useSidebar";
import { useAuth } from "@/context/AuthContext";
import { LayoutContext } from "@/context/LayoutContext";
import { getInitials } from "@/lib/formatters";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

export function Topbar() {
  const { theme, toggleTheme } = useTheme();
  const { isOpen } = useSidebar();
  const { toggleMobileNav } = useContext(LayoutContext);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-[200] flex h-16 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur-sm transition-all duration-300",
        "left-0",
        isOpen ? "md:left-60" : "md:left-16"
      )}
    >
      {/* Mobile hamburger */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleMobileNav}
        aria-label="Open menu"
        className="md:hidden h-9 w-9 text-muted-foreground hover:text-foreground"
      >
        <Menu size={20} />
      </Button>

      {/* Search */}
      <div className="relative flex-1 max-w-sm hidden sm:block">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…"
          className="h-9 w-full rounded-lg border border-border bg-muted/50 pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0"
        />
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="h-9 w-9 text-muted-foreground hover:text-foreground"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </Button>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifications"
          className="relative h-9 w-9 text-muted-foreground hover:text-foreground"
        >
          <Bell size={18} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
        </Button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="User menu"
            aria-expanded={menuOpen}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-sm font-semibold text-white focus-ring"
          >
            {getInitials(user?.name || user?.loginId || "U")}
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-[90]"
                onClick={() => setMenuOpen(false)}
                aria-hidden
              />
              <div className="absolute right-0 top-11 z-[100] w-52 rounded-xl border border-border bg-popover p-1 shadow-lg animate-fade-down">
                <div className="px-3 py-2 border-b border-border mb-1">
                  <p className="text-sm font-semibold text-foreground truncate">{user?.name || user?.loginId}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => { navigate(ROUTES.SETTINGS); setMenuOpen(false); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <User size={15} /> Profile
                </button>
                <button
                  onClick={() => { navigate(ROUTES.SETTINGS); setMenuOpen(false); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <Settings size={15} /> Settings
                </button>
                <div className="my-1 border-t border-border" />
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut size={15} /> Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
