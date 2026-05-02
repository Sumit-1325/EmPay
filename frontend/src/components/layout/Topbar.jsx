import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Sun, Moon, Menu, LogOut, User, LogOut as LogOutIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { useSidebar } from "@/hooks/useSidebar";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { LayoutContext } from "@/context/LayoutContext";
import { api } from "@/lib/api";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

// ── Check In / Out button + status dot ───────────────────────────────────────
function CheckInOut() {
  const { user }                    = useAuth();
  const { toast }                   = useToast();
  const [record, setRecord]         = useState(null);
  const [loading, setLoading]       = useState(false);
  const [fetched, setFetched]       = useState(false);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!user?.id) return;
    api.get(`/attendance?date=${today}`)
      .then((res) => {
        const records = res.data?.attendance ?? [];
        // find current user's own record regardless of role
        const own = records.find((r) => (r.user?.id ?? r.userId) === user.id) ?? null;
        setRecord(own);
      })
      .catch(() => {})
      .finally(() => setFetched(true));
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const isCheckedIn  = !!record?.checkIn;
  const isCheckedOut = !!record?.checkOut;

  async function handleCheckIn() {
    setLoading(true);
    try {
      const res = await api.post("/attendance/check-in", {});
      setRecord(res.data.attendance);
      toast({ title: "Checked in!", description: "Have a great day.", variant: "success" });
    } catch (err) {
      toast({ title: err.message || "Check-in failed", variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckOut() {
    setLoading(true);
    try {
      const res = await api.post("/attendance/check-out", {});
      setRecord(res.data.attendance);
      toast({ title: "Checked out!", description: "See you tomorrow.", variant: "success" });
    } catch (err) {
      toast({ title: err.message || "Check-out failed", variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  if (!fetched) return null;

  const checkInTime = record?.checkIn
    ? new Date(record.checkIn).toLocaleTimeString("en-IN", {
        hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata",
      })
    : null;

  // "Done for today"
  if (isCheckedIn && isCheckedOut) {
    return (
      <div className="hidden sm:flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-1.5">
        <span className="h-2 w-2 rounded-full bg-rose-500" />
        <span className="text-xs font-medium text-muted-foreground">Done for today</span>
      </div>
    );
  }

  // Checked in — show "Since HH:MM" + Check Out button
  if (isCheckedIn) {
    return (
      <div className="hidden sm:flex items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-muted-foreground">Since {checkInTime}</span>
        </div>
        <button
          onClick={handleCheckOut}
          disabled={loading}
          aria-label="Check out"
          className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-white hover:bg-primary/90 transition-colors disabled:opacity-60 shadow-sm"
        >
          <LogOutIcon size={15} />
        </button>
      </div>
    );
  }

  // Not checked in — show Check In button
  return (
    <button
      onClick={handleCheckIn}
      disabled={loading}
      aria-label="Check in"
      className="hidden sm:flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-60"
    >
      <span className="h-2 w-2 rounded-full bg-rose-400" />
      Check In
    </button>
  );
}

// ── Topbar ────────────────────────────────────────────────────────────────────
export function Topbar() {
  const { theme, toggleTheme }    = useTheme();
  const { isOpen }                = useSidebar();
  const { toggleMobileNav }       = useContext(LayoutContext);
  const { user, logout }          = useAuth();
  const { toast }                 = useToast();
  const navigate                  = useNavigate();
  const [menuOpen, setMenuOpen]   = useState(false);

  const handleLogout = async () => {
    try { await api.post("/auth/logout", {}); } catch { /* ignore */ }
    logout();
    navigate(ROUTES.LOGIN);
  };

  const initials = [user?.firstName?.[0], user?.lastName?.[0]]
    .filter(Boolean).join("").toUpperCase() || user?.loginId?.slice(0, 2).toUpperCase() || "U";
  const avatarSrc = user?.avatarUrl ?? null;

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

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Check In / Out */}
        <CheckInOut />

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

        {/* Avatar + dropdown */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="User menu"
            aria-expanded={menuOpen}
            className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-secondary text-sm font-semibold text-white focus-ring"
          >
            {avatarSrc
              ? <img src={avatarSrc} alt={initials} className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
              : initials}
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
                  <p className="text-sm font-semibold text-foreground truncate">{user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>

                <button
                  onClick={() => { navigate(`/employees/${user?.id}`); setMenuOpen(false); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <User size={15} /> My Profile
                </button>

                <div className="my-1 border-t border-border" />

                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut size={15} /> Log Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
