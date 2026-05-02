import { useState } from "react";
import { Printer, FileText, User, CalendarDays, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { useFetch } from "@/hooks/useFetch";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { USER_ROLES } from "@/constants/roles";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - i);

function empName(user) {
  return [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.loginId || "—";
}

// ─── Shared input / select style ─────────────────────────────────────────────

const INPUT_CLS =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground " +
  "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 " +
  "focus:border-primary/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Reports() {
  const { user }  = useAuth();
  const { toast } = useToast();

  const [employeeId, setEmployeeId] = useState("");
  const [year, setYear]             = useState(String(CURRENT_YEAR));
  const [generating, setGenerating] = useState(false);

  // Payroll roles can generate reports; HR can see but not generate (backend enforces anyway)
  const canGenerate = [USER_ROLES.ADMIN, USER_ROLES.PAYROLL_OFFICER].includes(user?.role);

  // Fetch employees list
  const { data: empData, loading: empLoading } = useFetch(() => api.get("/employees"), []);
  const employees = empData?.employees ?? [];

  // ── Print handler ────────────────────────────────────────────────────────────
  async function handleGenerate() {
    if (!employeeId || !year) {
      toast({ title: "Please select an employee and year", variant: "error" });
      return;
    }

    setGenerating(true);
    try {
      const token = localStorage.getItem("accessToken");
      const url   = `${BASE_URL}/reports/salary-statement?employeeId=${employeeId}&year=${year}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Error ${res.status}`);
      }

      const html    = await res.text();
      const blob    = new Blob([html], { type: "text/html" });
      const blobUrl = URL.createObjectURL(blob);
      const win     = window.open(blobUrl, "_blank");

      if (!win) {
        toast({ title: "Popup blocked", description: "Please allow popups for this site.", variant: "error" });
      } else {
        // Revoke object URL after 60 s to free memory
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
      }
    } catch (err) {
      toast({ title: err.message || "Failed to generate report", variant: "error" });
    } finally {
      setGenerating(false);
    }
  }

  const selectedEmp = employees.find((e) => String(e.id) === employeeId);
  const canSubmit   = canGenerate && !!employeeId && !!year && !generating;

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader title="Reports" breadcrumbs={[{ label: "Reports" }]} />

      {/* ── Report cards grid ───────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">

        {/* Main: Salary Statement form */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {/* Card header */}
          <div className="flex items-center gap-3 border-b border-border bg-gradient-to-r from-primary/10 to-secondary/10 px-6 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <FileText size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Salary Statement Report</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Full yearly pay breakdown per employee, ready for print
              </p>
            </div>
          </div>

          {/* Form body */}
          <div className="px-6 py-6 space-y-5">

            {/* Access gate notice */}
            {!canGenerate && (
              <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/8 px-4 py-3">
                <AlertCircle size={15} className="text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Only <strong>Admin</strong> and <strong>Payroll Officers</strong> can generate salary statement reports.
                </p>
              </div>
            )}

            {/* Employee select */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <User size={12} />
                Employee Name
              </label>
              {empLoading ? (
                <div className="h-10 rounded-lg bg-muted animate-pulse" />
              ) : (
                <select
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  disabled={!canGenerate}
                  className={INPUT_CLS}
                >
                  <option value="">Select employee…</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={String(emp.id)}>
                      {empName(emp)} — {emp.loginId}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Year select */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <CalendarDays size={12} />
                Financial Year
              </label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                disabled={!canGenerate}
                className={INPUT_CLS}
              >
                {YEARS.map((y) => (
                  <option key={y} value={String(y)}>{y}</option>
                ))}
              </select>
            </div>

            {/* Selected preview pill */}
            {selectedEmp && (
              <div className="flex items-center gap-2 rounded-lg bg-primary/8 border border-primary/20 px-4 py-2.5">
                <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center text-[11px] font-bold text-primary shrink-0">
                  {empName(selectedEmp).slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{empName(selectedEmp)}</p>
                  <p className="text-[11px] text-muted-foreground">{selectedEmp.loginId} · {year}</p>
                </div>
              </div>
            )}

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={!canSubmit}
              className={cn(
                "w-full flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-semibold transition-all",
                canSubmit
                  ? "bg-gradient-to-r from-primary to-secondary text-white hover:brightness-110 shadow-sm"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              {generating ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Printer size={15} />
                  Generate & Print
                </>
              )}
            </button>

            <p className="text-[11px] text-muted-foreground text-center">
              Opens in a new tab — use your browser's print function (Ctrl+P / ⌘P) to print or save as PDF.
            </p>
          </div>
        </div>

        {/* Right panel: info / tips */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card px-5 py-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">What's included</h3>
            <ul className="space-y-2">
              {[
                "Monthly earnings breakdown (Basic, HRA, Allowances)",
                "Deductions (PF, Professional Tax, TDS)",
                "Net pay per month + yearly totals",
                "Company logo and employee details",
                "Print-optimised A3 landscape layout",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-border bg-card px-5 py-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Access</h3>
            <div className="space-y-2">
              {[
                { role: "Admin", allowed: true },
                { role: "Payroll Officer", allowed: true },
                { role: "HR Officer", allowed: false },
                { role: "Employee", allowed: false },
              ].map(({ role, allowed }) => (
                <div key={role} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{role}</span>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-medium border",
                    allowed
                      ? "bg-green-500/10 text-green-600 border-green-500/20"
                      : "bg-red-500/10 text-red-500 border-red-500/20"
                  )}>
                    {allowed ? "Allowed" : "Restricted"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
