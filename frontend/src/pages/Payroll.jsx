import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { AlertTriangle, Users, Wallet, TrendingUp, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { useFetch } from "@/hooks/useFetch";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { PAYROLL_ROLES } from "@/constants/roles";
import { ROUTES } from "@/constants/routes";

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n ?? 0);

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
      <div className={`rounded-lg p-2.5 ${color}`}>
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
                className={`rounded-md px-3 py-1 transition-colors ${
                  toggle === o.value
                    ? "bg-primary text-white"
                    : "text-muted-foreground hover:text-foreground"
                }`}
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

function PayslipRow({ payslip }) {
  const name = [payslip.user?.firstName, payslip.user?.lastName].filter(Boolean).join(" ") || payslip.user?.loginId;
  const monthLabel = MONTH_NAMES[(payslip.month ?? 1) - 1];
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
          {name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{name}</p>
          <p className="text-xs text-muted-foreground">{monthLabel} {payslip.year}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-foreground">{fmt(payslip.netPay)}</p>
        <span className={`text-xs font-medium ${payslip.paidAt ? "text-green-500" : "text-yellow-500"}`}>
          {payslip.paidAt ? "Paid" : "Pending"}
        </span>
      </div>
    </div>
  );
}

export default function Payroll() {
  const { user } = useAuth();
  const [costView,    setCostView]    = useState("monthly");
  const [joiningView, setJoiningView] = useState("monthly");

  const canViewPayroll = PAYROLL_ROLES.includes(user?.role);
  const isHR           = user?.role === "HR_OFFICER";

  const { data, loading, error } = useFetch(
    () => api.get("/payroll/dashboard"),
    []
  );

  const summary       = data?.summary        ?? {};
  const recentPayslips = data?.recentPayslips ?? [];
  const costByMonth   = data?.costByMonth     ?? [];
  const joiningByMonth = data?.joiningByMonth ?? [];

  const annualCost = costByMonth.reduce((s, d) => s + d.amount, 0);

  // For annual toggle we just show the cumulative year total as a single bar
  const costChartData    = costView    === "monthly" ? costByMonth    : [{ label: "This Year", amount: annualCost }];
  const joiningChartData = joiningView === "monthly" ? joiningByMonth : [{ label: "YTD", count: joiningByMonth.reduce((s, d) => s + d.count, 0) }];

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader title="Payroll" breadcrumbs={[{ label: "Payroll" }]} />

      {loading && (
        <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Loading dashboard…</div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Failed to load dashboard data.
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Warnings */}
          {(summary.missingBank > 0 || summary.missingManager > 0) && (
            <div className="space-y-2">
              <WarningCard
                count={summary.missingBank}
                label="employee(s) without bank account"
                linkTo={ROUTES.EMPLOYEES}
              />
              <WarningCard
                count={summary.missingManager}
                label="employee(s) without a manager assigned"
                linkTo={ROUTES.EMPLOYEES}
              />
            </div>
          )}

          {/* Summary tiles */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <SummaryTile icon={Users}      label="Total Employees" value={summary.totalEmployees ?? 0} color="bg-primary"    />
            <SummaryTile icon={Wallet}     label="Payslips Run"    value={recentPayslips.length}        color="bg-secondary"  />
            <SummaryTile icon={TrendingUp} label="Annual Cost"     value={fmt(annualCost)}              color="bg-accent"     />
            <SummaryTile icon={UserPlus}   label="New Joiners (YTD)" value={joiningByMonth.reduce((s, d) => s + d.count, 0)} color="bg-muted-foreground" />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Recent payslips */}
            {canViewPayroll && (
              <div className="rounded-xl border border-border bg-card p-5 space-y-1 lg:col-span-1">
                <h3 className="font-semibold text-foreground mb-3">Recent Payslips</h3>
                {recentPayslips.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No payslips yet.</p>
                ) : (
                  recentPayslips.slice(0, 8).map((p) => <PayslipRow key={p.id} payslip={p} />)
                )}
              </div>
            )}

            {/* Charts */}
            <div className={`space-y-6 ${canViewPayroll && !isHR ? "lg:col-span-2" : "lg:col-span-3"}`}>
              {/* Employer cost chart — Admin + Payroll Officer */}
              {canViewPayroll && !isHR && (
                <ChartCard
                  title="Employer Cost"
                  toggle={costView}
                  onToggle={setCostView}
                  options={[{ label: "Monthly", value: "monthly" }, { label: "Annual", value: "annual" }]}
                >
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={costChartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                      <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                      <RechartsTooltip
                        formatter={(v) => [fmt(v), "Cost"]}
                        contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                      />
                      <Bar dataKey="amount" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}

              {/* Headcount / joining chart — all allowed roles */}
              <ChartCard
                title="New Joiners"
                toggle={joiningView}
                onToggle={setJoiningView}
                options={[{ label: "Monthly", value: "monthly" }, { label: "YTD", value: "annual" }]}
              >
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={joiningChartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                    <RechartsTooltip
                      formatter={(v) => [v, "Joiners"]}
                      contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                    />
                    <Bar dataKey="count" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
