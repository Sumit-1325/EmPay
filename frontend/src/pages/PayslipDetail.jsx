import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Printer, ChevronLeft, CheckCircle } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { useFetch } from "@/hooks/useFetch";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { PAYROLL_ROLES } from "@/constants/roles";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n ?? 0);

function InfoRow({ label, value, bold, green }) {
  return (
    <div className={cn("flex items-center justify-between py-2.5 border-b border-border last:border-0", bold && "font-semibold")}>
      <span className={cn("text-sm", bold ? "text-foreground" : "text-muted-foreground")}>{label}</span>
      <span className={cn("text-sm font-mono", green ? "text-green-500 font-bold text-base" : bold ? "text-foreground" : "text-foreground")}>
        {value}
      </span>
    </div>
  );
}

function SectionHeader({ title }) {
  return (
    <div className="bg-muted/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b border-border">
      {title}
    </div>
  );
}

export default function PayslipDetail() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { user }     = useAuth();
  const { toast }    = useToast();
  const [marking, setMarking] = useState(false);

  const { data, loading, error, refetch } = useFetch(
    () => api.get(`/payroll/${id}`),
    [id]
  );
  const p = data?.payslip;

  async function handleMarkPaid() {
    setMarking(true);
    try {
      await api.patch(`/payroll/${id}/pay`, {});
      toast({ title: "Payslip marked as paid", variant: "success" });
      refetch();
    } catch (err) {
      toast({ title: err.message, variant: "error" });
    } finally {
      setMarking(false);
    }
  }

  function handlePrint() {
    const base = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";
    const accessToken = localStorage.getItem("accessToken");
    window.open(`${base}/payroll/${id}/pdf?token=${accessToken}`, "_blank");
  }

  const canPay = PAYROLL_ROLES.includes(user?.role);
  const name   = p ? [p.user?.firstName, p.user?.lastName].filter(Boolean).join(" ") || p.user?.loginId : "";

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-up">
        <PageHeader title="Payslip" breadcrumbs={[{ label: "Payroll", href: ROUTES.PAYROLL }, { label: "Payslip Detail" }]} />
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 rounded-xl bg-muted/40 animate-pulse" />)}</div>
      </div>
    );
  }

  if (error || !p) {
    return (
      <div className="space-y-6 animate-fade-up">
        <PageHeader title="Payslip" breadcrumbs={[{ label: "Payroll", href: ROUTES.PAYROLL }, { label: "Payslip Detail" }]} />
        <p className="text-sm text-destructive">Failed to load payslip.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader
        title="Payslip"
        breadcrumbs={[{ label: "Payroll", href: ROUTES.PAYROLL }, { label: `${MONTH_NAMES[(p.month ?? 1) - 1]} ${p.year}` }]}
      />

      {/* Header card */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary shrink-0">
              {name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">{name}</p>
              <p className="text-sm text-muted-foreground font-mono">{p.user?.loginId}</p>
              <p className="text-sm text-muted-foreground">{MONTH_NAMES[(p.month ?? 1) - 1]} {p.year} · {p.company?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {p.paidAt ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1.5 text-xs font-semibold text-green-500">
                <CheckCircle className="h-3.5 w-3.5" /> Paid
              </span>
            ) : (
              <span className="rounded-full bg-yellow-500/10 px-3 py-1.5 text-xs font-semibold text-yellow-500">Pending</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column: worked days + computation */}
        <div className="space-y-4 lg:col-span-2">
          {/* Worked days */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="bg-muted/40 px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Attendance Summary</h3>
            </div>
            <div className="grid grid-cols-3 divide-x divide-border sm:grid-cols-5">
              {[
                { label: "Present",      value: p.attendancePresent ?? 0 },
                { label: "Half Day",     value: p.attendanceHalf ?? 0 },
                { label: "Paid Leave",   value: p.paidLeaveDays ?? 0 },
                { label: "Unpaid Leave", value: p.unpaidLeaveDays ?? 0 },
                { label: "Payable Days", value: `${p.payableDays ?? 0} / ${p.totalWorkingDays ?? 0}` },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col items-center justify-center py-4 px-2 gap-1">
                  <span className="text-xl font-bold text-foreground">{value}</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide text-center">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Salary computation */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <SectionHeader title="Earnings" />
            <div className="px-4 divide-y divide-border">
              <InfoRow label="Basic Salary"         value={fmt(p.basicSalary)}         />
              <InfoRow label="HRA"                  value={fmt(p.hra)}                  />
              <InfoRow label="Standard Allowance"   value={fmt(p.standardAllowance)}   />
              <InfoRow label="Performance Bonus"    value={fmt(p.performanceBonus)}    />
              <InfoRow label="Leave Travel Allowance" value={fmt(p.lta)}               />
              <InfoRow label="Fixed Allowance"      value={fmt(p.fixedAllowance)}      />
              <InfoRow label="Gross Pay"            value={fmt(p.grossPay)}            bold />
            </div>

            <SectionHeader title="Deductions" />
            <div className="px-4 divide-y divide-border">
              <InfoRow label="PF (Employee)"        value={fmt(p.pfEmployee)}          />
              <InfoRow label="PF (Employer)"        value={fmt(p.pfEmployer)}          />
              <InfoRow label="Professional Tax"     value={fmt(p.professionalTax)}     />
              <InfoRow label="Total Deductions"     value={fmt(p.totalDeductions)}     bold />
            </div>

            <SectionHeader title="Net Pay" />
            <div className="px-4 py-1">
              <InfoRow label="Net Pay" value={fmt(p.netPay)} bold green />
            </div>
          </div>
        </div>

        {/* Right column: actions + employer cost */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h3 className="text-sm font-semibold text-foreground mb-1">Actions</h3>
            <button
              onClick={handlePrint}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/60 transition-colors"
            >
              <Printer className="h-4 w-4" /> Print / Download PDF
            </button>
            {canPay && !p.paidAt && (
              <button
                onClick={handleMarkPaid}
                disabled={marking}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" /> {marking ? "Processing…" : "Mark as Paid"}
              </button>
            )}
            <Link
              to={ROUTES.PAYROLL}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-border bg-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" /> Back to Payroll
            </Link>
          </div>

          {/* Employer cost summary */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-2">
            <h3 className="text-sm font-semibold text-foreground mb-3">Employer Cost</h3>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Gross Pay</span>
              <span className="font-mono text-foreground">{fmt(p.grossPay)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">PF (Employer)</span>
              <span className="font-mono text-foreground">{fmt(p.pfEmployer)}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between text-sm font-semibold">
              <span className="text-foreground">Total Cost</span>
              <span className="font-mono text-foreground">{fmt(p.employerCost)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
