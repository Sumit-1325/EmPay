import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { TrendingUp, Users, Briefcase, DollarSign } from "lucide-react";

const MONTHLY_REVENUE = [
  { month: "Jan", revenue: 42000, target: 50000 },
  { month: "Feb", revenue: 55000, target: 50000 },
  { month: "Mar", revenue: 48000, target: 55000 },
  { month: "Apr", revenue: 71000, target: 60000 },
  { month: "May", revenue: 63000, target: 65000 },
  { month: "Jun", revenue: 82400, target: 70000 },
];

const DEAL_BY_STAGE = [
  { name: "Prospecting",  value: 24, color: "#6366f1" },
  { name: "Qualified",    value: 18, color: "#a855f7" },
  { name: "Proposal",     value: 12, color: "#14b8a6" },
  { name: "Negotiation",  value: 8,  color: "#f59e0b" },
  { name: "Won",          value: 5,  color: "#22c55e" },
  { name: "Lost",         value: 3,  color: "#ef4444" },
];

const CONTACT_SOURCE = [
  { source: "Inbound",  contacts: 45 },
  { source: "Referral", contacts: 32 },
  { source: "Outbound", contacts: 28 },
  { source: "Social",   contacts: 19 },
  { source: "Event",    contacts: 14 },
];

const STATS = [
  { label: "Total Revenue",    value: "$361.4k", trend: "up",   trendValue: "+18%",  icon: DollarSign },
  { label: "New Contacts",     value: "138",     trend: "up",   trendValue: "+12%",  icon: Users },
  { label: "Deals Closed",     value: "5",       trend: "down", trendValue: "-2",    icon: Briefcase },
  { label: "Win Rate",         value: "64%",     trend: "up",   trendValue: "+7pts", icon: TrendingUp },
];

export default function Reports() {
  return (
    <div className="space-y-8 animate-fade-up">
      <PageHeader title="Reports" breadcrumbs={[{ label: "Reports" }]} />

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Revenue vs Target</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={MONTHLY_REVENUE} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => [`$${v.toLocaleString()}`]} contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", background: "var(--popover)", color: "var(--popover-foreground)" }} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 3 }} name="Revenue" />
              <Line type="monotone" dataKey="target"  stroke="var(--color-secondary)" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Target" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Deals by Stage</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={DEAL_BY_STAGE} cx="50%" cy="50%" outerRadius={90} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {DEAL_BY_STAGE.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", background: "var(--popover)", color: "var(--popover-foreground)" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart row 2 */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-4 text-sm font-semibold text-foreground">Contacts by Source</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={CONTACT_SOURCE} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="source" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", background: "var(--popover)", color: "var(--popover-foreground)" }} />
            <Bar dataKey="contacts" fill="var(--color-accent)" radius={[4, 4, 0, 0]} name="Contacts" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
