import { Users, Briefcase, Activity, TrendingUp } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { ActivityFeed } from "@/components/crm/ActivityFeed";
import { DealPipeline } from "@/components/crm/DealPipeline";

// ── Demo data ──────────────────────────────────────────────────
const STATS = [
  { label: "Total Contacts", value: "1,284",  trend: "up",   trendValue: "+12%", icon: Users },
  { label: "Open Deals",     value: "47",     trend: "up",   trendValue: "+5",   icon: Briefcase },
  { label: "Activities",     value: "318",    trend: "down", trendValue: "-3%",  icon: Activity },
  { label: "Revenue",        value: "$82.4k", trend: "up",   trendValue: "+18%", icon: TrendingUp },
];

const REVENUE_DATA = [
  { month: "Jan", revenue: 42000 },
  { month: "Feb", revenue: 55000 },
  { month: "Mar", revenue: 48000 },
  { month: "Apr", revenue: 71000 },
  { month: "May", revenue: 63000 },
  { month: "Jun", revenue: 82400 },
];

const CONVERSION_DATA = [
  { stage: "Prospecting", count: 24 },
  { stage: "Qualified",   count: 18 },
  { stage: "Proposal",    count: 12 },
  { stage: "Negotiation", count: 8 },
  { stage: "Won",         count: 5 },
];

const SAMPLE_ACTIVITIES = [
  { id: 1, type: "call",    title: "Call with Priya Shah",        description: "Discussed Q2 renewal pricing.",    contactName: "Priya Shah",   createdAt: new Date().toISOString() },
  { id: 2, type: "email",   title: "Proposal sent to Acme Corp",  description: "Sent updated pricing proposal.",   contactName: "Acme Corp",    createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 3, type: "meeting", title: "Product demo with TechCo",    description: "Walkthrough of new dashboard.",    contactName: "TechCo",       createdAt: new Date(Date.now() - 7200000).toISOString() },
];

const SAMPLE_DEALS = [
  { id: "d1", title: "Acme Corp ERP",      company: "Acme Corp",   value: 50000, probability: 70, stage: "negotiation", owner: "Alice" },
  { id: "d2", title: "TechCo Platform",    company: "TechCo",      value: 80000, probability: 50, stage: "proposal",    owner: "Bob" },
  { id: "d3", title: "GlobalBiz Migration",company: "GlobalBiz",   value: 30000, probability: 90, stage: "won",         owner: "Carol" },
  { id: "d4", title: "StartupX Seed Deal", company: "StartupX",    value: 15000, probability: 30, stage: "prospecting", owner: "Dave" },
];
// ── Component ──────────────────────────────────────────────────

export default function Dashboard() {
  return (
    <div className="space-y-8 animate-fade-up">
      <PageHeader title="Dashboard" />

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Pipeline + Activity */}
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <h2 className="mb-4 text-base font-semibold text-foreground">Deal Pipeline</h2>
          <DealPipeline deals={SAMPLE_DEALS} />
        </div>
        <div>
          <h2 className="mb-4 text-base font-semibold text-foreground">Recent Activity</h2>
          <ActivityFeed activities={SAMPLE_ACTIVITIES} />
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue trend */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={REVENUE_DATA} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => [`$${v.toLocaleString()}`, "Revenue"]} contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", background: "var(--popover)", color: "var(--popover-foreground)" }} />
              <Line type="monotone" dataKey="revenue" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Deal conversion */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Deal Conversion by Stage</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={CONVERSION_DATA} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="stage" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", background: "var(--popover)", color: "var(--popover-foreground)" }} />
              <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
