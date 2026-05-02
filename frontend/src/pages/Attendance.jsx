import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { useFetch } from "@/hooks/useFetch";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmtTime(isoStr) {
  if (!isoStr) return "—";
  return new Date(isoStr).toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata",
  });
}

function fmtHours(h) {
  if (h == null || h === 0 && h !== 0) return "—";
  if (h === 0) return "00:00";
  const hrs  = Math.floor(h);
  const mins = Math.round((h % 1) * 60);
  return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function fmtDateDMY(isoStr) {
  const d = new Date(isoStr);
  return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

// ─── Shared table shell ───────────────────────────────────────────────────────

function AttendanceTable({ cols, gridClass, loading, empty, children }) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className={cn("grid bg-muted/40 border-b border-border", gridClass)}>
        {cols.map((c) => (
          <div key={c} className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {c}
          </div>
        ))}
      </div>
      {loading ? (
        [...Array(4)].map((_, i) => (
          <div key={i} className={cn("grid border-b border-border last:border-0", gridClass)}>
            {cols.map((_, j) => (
              <div key={j} className="px-4 py-3">
                <div className="h-4 rounded bg-muted/40 animate-pulse" />
              </div>
            ))}
          </div>
        ))
      ) : empty ? (
        <div className="px-4 py-10 text-center text-sm text-muted-foreground">{empty}</div>
      ) : (
        children
      )}
    </div>
  );
}

// ─── Admin/HR/Payroll: Day View ───────────────────────────────────────────────

function DayView() {
  const [date, setDate]     = useState(todayISO);
  const [search, setSearch] = useState("");

  const { data, loading } = useFetch(
    () => api.get(`/attendance?date=${date}`),
    [date]
  );
  const records = data?.attendance ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) => {
      const name = [r.user?.firstName, r.user?.lastName].filter(Boolean).join(" ").toLowerCase();
      return name.includes(q) || r.user?.loginId?.toLowerCase().includes(q);
    });
  }, [records, search]);

  function shiftDay(n) {
    const d = new Date(date + "T00:00:00");
    d.setDate(d.getDate() + n);
    setDate(d.toISOString().split("T")[0]);
  }

  const displayDate = (() => {
    const d = new Date(date + "T00:00:00");
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  })();

  const cols      = ["Employee", "Check In", "Check Out", "Work Hours", "Extra Hours"];
  const gridClass = "grid-cols-[1fr_130px_130px_110px_110px]";

  return (
    <div className="space-y-4">
      {/* Controls row */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => shiftDay(-1)} className="h-9 w-9 rounded-md border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors" aria-label="Previous day">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button onClick={() => shiftDay(1)} className="h-9 w-9 rounded-md border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors" aria-label="Next day">
          <ChevronRight className="h-4 w-4" />
        </button>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-9 rounded-md border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or login ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-md border border-border bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <p className="text-sm font-medium text-muted-foreground">{displayDate}</p>

      <AttendanceTable
        cols={cols}
        gridClass={gridClass}
        loading={loading}
        empty={filtered.length === 0 ? "No attendance records for this date." : null}
      >
        {filtered.map((r) => {
          const name = [r.user?.firstName, r.user?.lastName].filter(Boolean).join(" ") || r.user?.loginId;
          return (
            <div key={r.id} className={cn("grid border-b border-border last:border-0 hover:bg-muted/20 transition-colors", gridClass)}>
              <div className="px-4 py-3 flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                  {name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-foreground">{name}</span>
              </div>
              <div className="px-4 py-3 text-sm font-mono text-foreground">{fmtTime(r.checkIn)}</div>
              <div className="px-4 py-3 text-sm font-mono text-foreground">{fmtTime(r.checkOut)}</div>
              <div className="px-4 py-3 text-sm font-mono text-foreground">{fmtHours(r.workHours)}</div>
              <div className={cn("px-4 py-3 text-sm font-mono", r.extraHours > 0 ? "text-green-500" : "text-muted-foreground")}>
                {fmtHours(r.extraHours)}
              </div>
            </div>
          );
        })}
      </AttendanceTable>
    </div>
  );
}

// ─── Employee: Month View ─────────────────────────────────────────────────────

function MonthView() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear]   = useState(now.getFullYear());

  const { data: attData, loading: attLoading } = useFetch(
    () => api.get(`/attendance?month=${month}&year=${year}`),
    [month, year]
  );
  const { data: sumData } = useFetch(
    () => api.get(`/attendance/summary?month=${month}&year=${year}`),
    [month, year]
  );

  const records = attData?.attendance ?? [];
  const summary = sumData ?? {};

  function shiftMonth(n) {
    let m = month + n;
    let y = year;
    if (m > 12) { m = 1;  y += 1; }
    if (m < 1)  { m = 12; y -= 1; }
    setMonth(m);
    setYear(y);
  }

  const cols      = ["Date", "Check In", "Check Out", "Work Hours", "Extra Hours"];
  const gridClass = "grid-cols-[120px_130px_130px_110px_110px]";

  const stats = [
    { label: "Count of Days Present", value: summary.daysPresent ?? "—" },
    { label: "Leaves Count",          value: summary.leaveDays   ?? "—" },
    { label: "Total Working Days",    value: (summary.daysPresent ?? 0) + (summary.halfDays ?? 0) * 0.5 || "—" },
    { label: "Total Work Hrs",        value: summary.totalWorkHours  != null ? fmtHours(summary.totalWorkHours)  : "—" },
    { label: "Extra Hrs",             value: summary.totalExtraHours != null ? fmtHours(summary.totalExtraHours) : "—" },
  ];

  return (
    <div className="space-y-4">
      {/* Controls row */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => shiftMonth(-1)} className="h-9 w-9 rounded-md border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors" aria-label="Previous month">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button onClick={() => shiftMonth(1)} className="h-9 w-9 rounded-md border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors" aria-label="Next month">
          <ChevronRight className="h-4 w-4" />
        </button>
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="h-9 rounded-md border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="h-9 rounded-md border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {[year - 1, year, year + 1].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Summary stat chips */}
      <div className="flex gap-3 flex-wrap">
        {stats.map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-border bg-card px-5 py-3 text-center min-w-[100px]">
            <p className="text-xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <p className="text-sm font-medium text-muted-foreground">{MONTHS[month - 1]} {year}</p>

      <AttendanceTable
        cols={cols}
        gridClass={gridClass}
        loading={attLoading}
        empty={records.length === 0 ? "No attendance records this month." : null}
      >
        {records.map((r) => (
          <div key={r.id} className={cn("grid border-b border-border last:border-0 hover:bg-muted/20 transition-colors", gridClass)}>
            <div className="px-4 py-3 text-sm text-foreground">{fmtDateDMY(r.date)}</div>
            <div className="px-4 py-3 text-sm font-mono text-foreground">{fmtTime(r.checkIn)}</div>
            <div className="px-4 py-3 text-sm font-mono text-foreground">{fmtTime(r.checkOut)}</div>
            <div className="px-4 py-3 text-sm font-mono text-foreground">{fmtHours(r.workHours)}</div>
            <div className={cn("px-4 py-3 text-sm font-mono", r.extraHours > 0 ? "text-green-500" : "text-muted-foreground")}>
              {fmtHours(r.extraHours)}
            </div>
          </div>
        ))}
      </AttendanceTable>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Attendance() {
  const { user } = useAuth();
  const isEmployee = user?.role === "EMPLOYEE";

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader title="Attendance" breadcrumbs={[{ label: "Attendance" }]} />
      <div className="rounded-xl border border-border bg-card p-5">
        {isEmployee ? <MonthView /> : <DayView />}
      </div>
    </div>
  );
}
