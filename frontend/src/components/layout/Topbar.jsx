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

// ── Helpers ────────────────────────────────────────────────────────────────
function parseHHMM(str) {
  const [h = 0, m = 0] = (str || "00:00").split(":").map(Number);
  return h * 60 + m;
}
function getNowMinutes() {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
}
function fmt12(hhmm) {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${((h % 12) || 12).toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${ampm}`;
}

// ── Check In / Out button + status dot ───────────────────────────────────────
function CheckInOut() {
  const { user }              = useAuth();
  const { toast }             = useToast();
  const [record, setRecord]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [nowMin, setNowMin]   = useState(getNowMinutes());

  // Refresh current-minute every 60 s so the button auto-enables at start time
  useEffect(() => {
    const id = setInterval(() => setNowMin(getNowMinutes()), 60_000);
    return () => clearInterval(id);
  }, []);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!user?.id) return;
    api.get(`/attendance?date=${today}`)
      .then((res) => {
        const records = res.data?.attendance ?? [];
        const own = records.find((r) => (r.user?.id ?? r.userId) === user.id) ?? null;
        setRecord(own);
      })
      .catch(() => {})
      .finally(() => setFetched(true));
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const isCheckedIn  = !!record?.checkIn;
  const isCheckedOut = !!record?.checkOut;

  // ── Work-hours gate ──────────────────────────────────────────────────────
  const workStart   = user?.company?.workStartTime ?? "09:00";
  const workEnd     = user?.company?.workEndTime   ?? "17:00";
  const startMin    = parseHHMM(workStart);
  const endMin      = parseHHMM(workEnd);
  const withinHours = nowMin >= startMin && nowMin <= endMin;

  async function handleCheckIn() {
    if (!withinHours) {
      toast({
        title: "Outside work hours",
        description: `Check-in is only allowed between ${fmt12(workStart)} and ${fmt12(workEnd)}.`,
        variant: "error",
      });
      return;
    }
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

  // ── Unified toggle ──────────────────────────────────────────────────────────
  // States: not-checked-in | checked-in | done-for-today
  const isOn       = isCheckedIn && !isCheckedOut;
  const isDone     = isCheckedIn && isCheckedOut;
  const canToggle  = !loading && !isDone && (isOn || withinHours);

  function handleToggle() {
    if (isDone || loading) return;
    if (isOn) {
      handleCheckOut();
    } else {
      handleCheckIn();
    }
  }

  // Colour scheme
  const trackCls = isDone
    ? "bg-emerald-500/20 border-emerald-500/30"
    : isOn
    ? "bg-emerald-500 border-emerald-600"
    : withinHours
    ? "bg-muted/60 border-border hover:bg-muted"
    : "bg-muted/30 border-border opacity-50";

  const knobCls = isDone
    ? "translate-x-[22px] bg-emerald-500 shadow-md"
    : isOn
    ? "translate-x-[22px] bg-white shadow-md"
    : "translate-x-[2px] bg-muted-foreground/50";

  const label = isDone
    ? "Done"
    : isOn
    ? `Since ${checkInTime}`
    : withinHours
    ? "Check In"
    : `Opens ${fmt12(workStart)}`;

  const tooltipText = isDone
    ? "Attendance recorded for today"
    : !withinHours && !isOn
    ? `Check-in allowed ${fmt12(workStart)} – ${fmt12(workEnd)}`
    : isOn
    ? "Click to check out"
    : "Click to check in";

  return (
    <button
      onClick={handleToggle}
      disabled={!canToggle}
      aria-label={tooltipText}
      title={tooltipText}
      className={cn(
        "hidden sm:flex items-center gap-2 rounded-full border px-2 py-1.5 pr-3 text-xs font-medium transition-all duration-200 select-none",
        canToggle ? "cursor-pointer" : "cursor-not-allowed",
        trackCls
      )}
    >
      {/* Knob */}
      <span
        className={cn(
          "relative h-5 w-10 rounded-full border transition-colors duration-200 shrink-0",
          isOn ? "bg-emerald-500 border-emerald-600" : isDone ? "bg-emerald-500/40 border-emerald-500/50" : "bg-muted-foreground/20 border-border"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full transition-transform duration-200 flex items-center justify-center",
            knobCls
          )}
        >
          {loading && (
            <span className="h-2.5 w-2.5 rounded-full border-2 border-current border-t-transparent animate-spin opacity-70" />
          )}
        </span>
      </span>

      {/* Label */}
      <span className={cn(
        "text-xs font-medium",
        isDone ? "text-emerald-700 dark:text-emerald-300" : isOn ? "text-emerald-700 dark:text-emerald-300" : "text-muted-foreground"
      )}>
        {label}
      </span>
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
