import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
} from "recharts";
import { AlertTriangle, Users, Wallet, TrendingUp, UserPlus, Play, X } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { useFetch } from "@/hooks/useFetch";
import { useToast } from "@/context/ToastContext";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { PAYROLL_ROLES } from "@/constants/roles";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const FULL_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n ?? 0);

// ─── Tab nav ──────────────────────────────────────────────────────────────────

function TabNav({ active, onChange, tabs }) {
  return (
    <div className="flex gap-1 border-b border-border mb-6">
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
            active === t.value
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ─── Run Payrun modal ─────────────────────────────────────────────────────────

function RunPayrunModal({ onClose, onSuccess }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year,  setYear]  = useState(now.getFullYear());
  const [running, setRunning] = useState(false);
  const [result,  setResult]  = useState(null);
  const { toast } = useToast();

  async function handleRun() {
    setRunning(true);
    try {
      const data = await api.post("/payroll/run", { month, year });
      setResult(data);
      onSuccess?.();
    } catch (err) {
      toast({ title: err.message, variant: "error" });
    } finally {
      setRunning(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        <div className="relative bg-gradient-to-r from-primary to-secondary px-6 py-5">
          <h2 className="text-lg font-semibold text-white">Run Payrun</h2>
          <p className="text-sm text-white/70 mt-0.5">Generate payslips for all employees</p>
          <button onClick={onClose} className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {result ? (
            <div className="space-y-3 text-center">
              <div className="text-4xl font-bold text-primary">{result.employeesProcessed ?? 0}</div>
              <p className="text-sm text-muted-foreground">payslip{(result.employeesProcessed ?? 0) !== 1 ? "s" : ""} generated</p>
              {(result.errors ?? []).length > 0 && (
                <p className="text-xs text-destructive">{result.errors.length} error{result.errors.length !== 1 ? "s" : ""} (already run or missing wage)</p>
              )}
              <button onClick={onClose} className="mt-2 w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors">
                Done
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Month</label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(Number(e.target.value))}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {FULL_MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Year</label>
                  <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {[year - 1, year, year + 1].map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={onClose} className="flex-1 rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleRun}
                  disabled={running}
                  className="flex-1 flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  <Play className="h-3.5 w-3.5" /> {running ? "Running…" : "Run Payroll"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Dashboard tab ────────────────────────────────────────────────────────────

function WarningCard({ count, label, linkTo }) {
  const navigate = useNavigate();
  if (!count) return null;
  return (
    <button
      onClick={() => navigate(linkTo)}
      className="flex items-center gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-left hover:bg-yellow-500/20 transition-colors w-full"
    >
      <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-500" />
      <span className="text-sm font-medium text-foreground">
        <span className="font-bold">{count}</span> {label}
      </span>
    </button>
  );
}

function SummaryTile({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 flex items-center gap-4">
      <div className={cn("rounded-lg p-2.5", color)}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function ChartCard({ title, children, toggle, onToggle, options }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">{title}</h3>
        {options && (
          <div className="flex gap-1 rounded-lg border border-border p-0.5 text-xs">
            {options.map((o) => (
              <button
                key={o.value}
                onClick={() => onToggle(o.value)}
                className={cn(
                  "rounded-md px-3 py-1 transition-colors",
                  toggle === o.value ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

function DashboardTab() {
  const { user }  = useAuth();
  const [costView,    setCostView]    = useState("monthly");
  const [joiningView, setJoiningView] = useState("monthly");
  const [showRunModal, setShowRunModal] = useState(false);

  const canViewPayroll = PAYROLL_ROLES.includes(user?.role);
  const isHR           = user?.role === "HR_OFFICER";

  const { data, loading, error, refetch: refetchDashboard } = useFetch(() => api.get("/payroll/dashboard"), []);

  const summary        = data?.summary        ?? {};
  const recentPayslips = data?.recentPayslips  ?? [];
  const costByMonth    = data?.costByMonth     ?? [];
  const joiningByMonth = data?.joiningByMonth  ?? [];
  const annualCost     = costByMonth.reduce((s, d) => s + d.amount, 0);

  const costChartData    = costView    === "monthly" ? costByMonth    : [{ label: "This Year", amount: annualCost }];
  const joiningChartData = joiningView === "monthly" ? joiningByMonth : [{ label: "YTD", count: joiningByMonth.reduce((s, d) => s + d.count, 0) }];

  if (loading) return <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  if (error)   return <p className="text-sm text-destructive">Failed to load dashboard data.</p>;

  return (
    <div className="space-y-6">
      {showRunModal && (
        <RunPayrunModal onClose={() => setShowRunModal(false)} onSuccess={refetchDashboard} />
      )}

      {canViewPayroll && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowRunModal(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
          >
            <Play className="h-4 w-4" /> Run Payrun
          </button>
        </div>
      )}

      {(summary.missingBank > 0 || summary.missingManager > 0) && (
        <div className="space-y-2">
          <WarningCard count={summary.missingBank}    label="employee(s) without bank account"      linkTo={ROUTES.EMPLOYEES} />
          <WarningCard count={summary.missingManager} label="employee(s) without a manager assigned" linkTo={ROUTES.EMPLOYEES} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryTile icon={Users}      label="Total Employees"   value={summary.totalEmployees ?? 0}                              color="bg-primary" />
        <SummaryTile icon={Wallet}     label="Payslips Run"      value={recentPayslips.length}                                    color="bg-secondary" />
        <SummaryTile icon={TrendingUp} label="Annual Cost"       value={fmt(annualCost)}                                          color="bg-accent" />
        <SummaryTile icon={UserPlus}   label="New Joiners (YTD)" value={joiningByMonth.reduce((s, d) => s + d.count, 0)}         color="bg-muted-foreground" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {canViewPayroll && (
          <div className="rounded-xl border border-border bg-card p-5 lg:col-span-1 space-y-1">
            <h3 className="font-semibold text-foreground mb-3">Recent Payslips</h3>
            {recentPayslips.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No payslips yet.</p>
            ) : (
              recentPayslips.slice(0, 8).map((p) => {
                const name = [p.user?.firstName, p.user?.lastName].filter(Boolean).join(" ") || p.user?.loginId;
                return (
                  <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{name}</p>
                        <p className="text-xs text-muted-foreground">{MONTH_NAMES[(p.month ?? 1) - 1]} {p.year}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">{fmt(p.netPay)}</p>
                      <span className={cn("text-xs font-medium", p.paidAt ? "text-green-500" : "text-yellow-500")}>
                        {p.paidAt ? "Paid" : "Pending"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        <div className={cn("space-y-6", canViewPayroll && !isHR ? "lg:col-span-2" : "lg:col-span-3")}>
          {canViewPayroll && !isHR && (
            <ChartCard title="Employer Cost" toggle={costView} onToggle={setCostView}
              options={[{ label: "Monthly", value: "monthly" }, { label: "Annual", value: "annual" }]}
            >
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={costChartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                  <RechartsTooltip formatter={(v) => [fmt(v), "Cost"]} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="amount" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
          <ChartCard title="New Joiners" toggle={joiningView} onToggle={setJoiningView}
            options={[{ label: "Monthly", value: "monthly" }, { label: "YTD", value: "annual" }]}
          >
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={joiningChartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                <RechartsTooltip formatter={(v) => [v, "Joiners"]} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}

// ─── Payrun tab ───────────────────────────────────────────────────────────────

function PayrunsTable({ onSelectMonth }) {
  const { data, loading } = useFetch(() => api.get("/payroll/payruns"), []);
  const payruns = data?.payruns ?? [];

  if (loading) return (
    <div className="space-y-2">
      {[...Array(3)].map((_, i) => <div key={i} className="h-10 rounded bg-muted/40 animate-pulse" />)}
    </div>
  );

  if (payruns.length === 0) {
    return <div className="py-10 text-center text-sm text-muted-foreground">No payruns yet. Run your first payrun from the Dashboard tab.</div>;
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="grid grid-cols-[1fr_90px_130px_150px_80px] bg-muted/40 border-b border-border">
        {["Period", "Payslips", "Total Net Pay", "Total Employer Cost", ""].map((h) => (
          <div key={h} className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</div>
        ))}
      </div>
      {payruns.map((r) => (
        <div key={`${r.year}-${r.month}`} className="grid grid-cols-[1fr_90px_130px_150px_80px] items-center border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
          <div className="px-4 py-3 text-sm font-medium text-foreground">{r.label}</div>
          <div className="px-4 py-3 text-sm text-muted-foreground">{r.payslipCount}</div>
          <div className="px-4 py-3 text-sm font-mono text-foreground">{fmt(r.totalNet)}</div>
          <div className="px-4 py-3 text-sm font-mono text-foreground">{fmt(r.totalCost)}</div>
          <div className="px-4 py-3">
            <button
              onClick={() => onSelectMonth(r.month, r.year)}
              className="text-xs text-primary hover:underline font-medium"
            >
              View →
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function PayrunTab() {
  const now = new Date();
  const [subTab, setSubTab]   = useState("summary");
  const [month, setMonth]     = useState(now.getMonth() + 1);
  const [year, setYear]       = useState(now.getFullYear());
  const { toast }             = useToast();
  const [paying, setPaying]   = useState(null);

  const { data, loading, refetch } = useFetch(
    () => api.get(`/payroll?month=${month}&year=${year}`),
    [month, year]
  );
  const payslips = data?.payslips ?? [];

  function handleSelectMonth(m, y) {
    setMonth(m);
    setYear(y);
    setSubTab("byEmployee");
  }

  async function markPaid(id) {
    setPaying(id);
    try {
      await api.patch(`/payroll/${id}/pay`, {});
      toast({ title: "Marked as paid", variant: "success" });
      refetch();
    } catch (err) {
      toast({ title: err.message, variant: "error" });
    } finally {
      setPaying(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Inner sub-tabs */}
      <div className="flex gap-1 border-b border-border">
        {[{ value: "summary", label: "Payruns Summary" }, { value: "byEmployee", label: "By Employee" }].map((t) => (
          <button
            key={t.value}
            onClick={() => setSubTab(t.value)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
              subTab === t.value
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subTab === "summary" && <PayrunsTable onSelectMonth={handleSelectMonth} />}

      {subTab === "byEmployee" && (
        <div className="space-y-4">
          {/* Month / Year filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="h-9 rounded-md border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {FULL_MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="h-9 rounded-md border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {[year - 1, year, year + 1].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <span className="text-xs text-muted-foreground ml-1">{payslips.length} record{payslips.length !== 1 ? "s" : ""}</span>
          </div>

          <div className="rounded-xl border border-border overflow-hidden">
            <div className="grid grid-cols-[1fr_100px_120px_120px_110px_70px] bg-muted/40 border-b border-border">
              {["Employee", "Month", "Basic Salary", "Net Pay", "Status", ""].map((h) => (
                <div key={h} className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</div>
              ))}
            </div>

            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="grid grid-cols-[1fr_100px_120px_120px_110px_70px] border-b border-border last:border-0">
                  {[...Array(6)].map((_, j) => (
                    <div key={j} className="px-4 py-3"><div className="h-4 rounded bg-muted/40 animate-pulse" /></div>
                  ))}
                </div>
              ))
            ) : payslips.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">No payslips for this period.</div>
            ) : (
              payslips.map((p) => {
                const name = [p.user?.firstName, p.user?.lastName].filter(Boolean).join(" ") || p.user?.loginId;
                return (
                  <div key={p.id} className="grid grid-cols-[1fr_100px_120px_120px_110px_70px] items-center border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <div className="px-4 py-3 flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-foreground">{name}</span>
                    </div>
                    <div className="px-4 py-3 text-sm text-muted-foreground">{MONTH_NAMES[p.month - 1]}</div>
                    <div className="px-4 py-3 text-sm text-foreground font-mono">{fmt(p.basicSalary)}</div>
                    <div className="px-4 py-3 text-sm font-semibold text-foreground">{fmt(p.netPay)}</div>
                    <div className="px-4 py-3">
                      {p.paidAt ? (
                        <span className="text-xs font-medium text-green-500">✓ Paid</span>
                      ) : (
                        <button
                          onClick={() => markPaid(p.id)}
                          disabled={paying === p.id}
                          className="text-xs rounded-md bg-primary/10 text-primary px-2.5 py-1 hover:bg-primary/20 transition-colors disabled:opacity-50"
                        >
                          {paying === p.id ? "…" : "Mark Paid"}
                        </button>
                      )}
                    </div>
                    <div className="px-4 py-3">
                      <Link
                        to={ROUTES.PAYROLL_DETAIL.replace(":id", p.id)}
                        className="text-xs text-primary hover:underline font-medium"
                      >
                        View →
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Configuration tab ────────────────────────────────────────────────────────

function ConfigurationTab() {
  const { toast }  = useToast();
  const [saving, setSaving]   = useState(false);
  const [seeded, setSeeded]   = useState(false);
  const [startTime, setStart] = useState("09:00");
  const [endTime,   setEnd]   = useState("17:00");

  const { data, loading, refetch } = useFetch(() => api.get("/company/settings"), []);
  const company = data?.company;

  if (company && !seeded) {
    setStart(company.workStartTime ?? "09:00");
    setEnd(company.workEndTime     ?? "17:00");
    setSeeded(true);
  }

  function parseT(t) { const [h, m] = t.split(":").map(Number); return h + m / 60; }
  const diff     = parseT(endTime) - parseT(startTime);
  const isValid  = diff > 0;
  const diffLabel = isValid ? (() => {
    const h = Math.floor(diff), m = Math.round((diff % 1) * 60);
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
  })() : null;

  async function handleSave(e) {
    e.preventDefault();
    if (!isValid) { toast({ title: "End time must be after start time", variant: "error" }); return; }
    setSaving(true);
    try {
      await api.put("/company/settings", { workStartTime: startTime, workEndTime: endTime });
      toast({ title: "Configuration saved", description: `Work hours: ${startTime} – ${endTime} (${diffLabel})`, variant: "success" });
      refetch();
    } catch (err) {
      toast({ title: err.message, variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="space-y-3 max-w-md">{[...Array(3)].map((_, i) => <div key={i} className="h-10 rounded-lg bg-muted/40 animate-pulse" />)}</div>;

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-md">
      {/* Company info */}
      <div className="rounded-xl border border-border bg-muted/20 px-4 py-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Company</span>
          <span className="font-medium text-foreground">{company?.name}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Company Code</span>
          <span className="font-mono text-foreground">{company?.code}</span>
        </div>
      </div>

      {/* Work hours */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Work Hours</h3>
        <div className="rounded-xl border border-border bg-card px-4 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <label htmlFor="cfgStart" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Start Time</label>
              <input id="cfgStart" type="time" value={startTime} onChange={(e) => setStart(e.target.value)}
                className="h-10 rounded-lg border border-border bg-muted/30 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="cfgEnd" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">End Time</label>
              <input id="cfgEnd" type="time" value={endTime} onChange={(e) => setEnd(e.target.value)}
                className="h-10 rounded-lg border border-border bg-muted/30 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Standard Working Hours</p>
              <p className="text-xs text-muted-foreground">Auto-computed · drives extra-hours in attendance</p>
            </div>
            <span className={cn("text-lg font-bold", isValid ? "text-primary" : "text-destructive")}>
              {isValid ? diffLabel : "—"}
            </span>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={saving || !isValid}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save Configuration"}
      </button>
    </form>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS = [
  { value: "dashboard",     label: "Dashboard" },
  { value: "payrun",        label: "Payrun" },
  { value: "configuration", label: "Configuration" },
];

export default function Payroll() {
  const [tab, setTab] = useState("dashboard");

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader title="Payroll" breadcrumbs={[{ label: "Payroll" }]} />
      <div className="rounded-xl border border-border bg-card p-6">
        <TabNav active={tab} onChange={setTab} tabs={TABS} />
        {tab === "dashboard"     && <DashboardTab />}
        {tab === "payrun"        && <PayrunTab />}
        {tab === "configuration" && <ConfigurationTab />}
      </div>
    </div>
  );
}
