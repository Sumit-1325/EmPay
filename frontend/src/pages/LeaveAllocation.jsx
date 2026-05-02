import { useState } from "react";
import { createPortal } from "react-dom";
import { Plus, X, ClipboardList, User, CalendarDays, Hash, StickyNote, Infinity } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { useFetch } from "@/hooks/useFetch";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const LEAVE_TYPES = [
  { value: "Paid Time Off",  label: "Paid Time Off",  defaultDays: 24 },
  { value: "Sick Leave",     label: "Sick Leave",      defaultDays: 7  },
  { value: "Unpaid Leave",   label: "Unpaid Leave",    defaultDays: 0  },
];

const TYPE_STYLE = {
  "Paid Time Off": "bg-blue-500/10  text-blue-500  border-blue-500/20",
  "Sick Leave":    "bg-amber-500/10 text-amber-500 border-amber-500/20",
  "Unpaid Leave":  "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function empName(user) {
  return [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.loginId || "—";
}

function fmtDate(iso) {
  if (!iso) return "No Limit";
  const d = new Date(iso);
  return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
}

// ─── Modal Shell ──────────────────────────────────────────────────────────────

const MODAL_INPUT = "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-colors";
const MODAL_LABEL = "text-xs font-medium text-muted-foreground uppercase tracking-wide";

function ModalShell({ title, subtitle, onClose, children }) {
  return createPortal(
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md mx-4 rounded-2xl border border-border bg-background shadow-2xl animate-scale-in overflow-hidden">
        <div className="flex items-start justify-between border-b border-border px-6 py-4 bg-muted/30">
          <div>
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="h-7 w-7 rounded-md text-muted-foreground hover:bg-muted flex items-center justify-center transition-colors">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}

// ─── Allocation Modal ─────────────────────────────────────────────────────────

function AllocationModal({ employees, onClose, onSuccess }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    targetUserId: "",
    leaveType:    "Paid Time Off",
    startDate:    new Date().toISOString().slice(0, 10),
    endDate:      "",
    noLimit:      false,
    days:         24,
    note:         "",
  });
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // ── Max days = calendar days in the chosen period (unlimited when noLimit) ──
  function calcMax(start, end, noLimit) {
    if (noLimit || !end || !start) return 365;
    const ms = new Date(end) - new Date(start);
    return Math.max(0, Math.round(ms / 86_400_000) + 1); // inclusive
  }

  const maxDays = calcMax(form.startDate, form.endDate, form.noLimit);

  // Clamp days when dates change
  function handleDateChange(key) {
    return (e) => {
      const newVal = e.target.value;
      setForm((f) => {
        const start  = key === "startDate" ? newVal : f.startDate;
        const end    = key === "endDate"   ? newVal : f.endDate;
        const newMax = calcMax(start, end, f.noLimit);
        return { ...f, [key]: newVal, days: Math.min(Number(f.days), newMax) };
      });
    };
  }

  function handleNoLimitChange(e) {
    const checked = e.target.checked;
    setForm((f) => ({ ...f, noLimit: checked, endDate: "", days: checked ? f.days : Math.min(Number(f.days), 365) }));
  }

  function handleTypeChange(e) {
    const t = LEAVE_TYPES.find((x) => x.value === e.target.value);
    setForm((f) => ({ ...f, leaveType: e.target.value, days: t?.defaultDays ?? f.days }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.targetUserId) { toast({ title: "Please select an employee", variant: "error" }); return; }
    if (!form.days || Number(form.days) < 0) { toast({ title: "Allocation days must be 0 or more", variant: "error" }); return; }

    setLoading(true);
    try {
      await api.post("/leave/allocations", {
        targetUserId: parseInt(form.targetUserId),
        leaveType:    form.leaveType,
        startDate:    form.startDate,
        endDate:      form.noLimit ? null : (form.endDate || null),
        days:         Number(form.days),
        note:         form.note || null,
      });
      toast({ title: "Leave allocation created", variant: "success" });
      onSuccess();
    } catch (err) {
      toast({ title: err.message || "Failed to create allocation", variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalShell
      title="New Leave Allocation"
      subtitle="Allocate leave days for an employee"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
        {/* Employee */}
        <div className="space-y-1.5">
          <label className={MODAL_LABEL}>Employee</label>
          <select value={form.targetUserId} onChange={set("targetUserId")} required className={MODAL_INPUT}>
            <option value="">Select employee…</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{empName(emp)} — {emp.loginId}</option>
            ))}
          </select>
        </div>

        {/* Leave Type */}
        <div className="space-y-1.5">
          <label className={MODAL_LABEL}>Time Off Type</label>
          <select value={form.leaveType} onChange={handleTypeChange} className={MODAL_INPUT}>
            {LEAVE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Validity Period */}
        <div className="space-y-1.5">
          <label className={MODAL_LABEL}>Validity Period</label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-[11px] text-muted-foreground">From</p>
              <input type="date" value={form.startDate} onChange={handleDateChange("startDate")} required className={MODAL_INPUT} />
            </div>
            <div className="space-y-1">
              <p className="text-[11px] text-muted-foreground">To</p>
              {form.noLimit ? (
                <div className={cn(MODAL_INPUT, "flex items-center gap-2 text-muted-foreground cursor-default select-none")}>
                  <Infinity size={14} /> No Limit
                </div>
              ) : (
                <input type="date" value={form.endDate} min={form.startDate} onChange={handleDateChange("endDate")} className={MODAL_INPUT} />
              )}
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer mt-1">
            <input
              type="checkbox"
              checked={form.noLimit}
              onChange={handleNoLimitChange}
              className="h-3.5 w-3.5 rounded accent-primary"
            />
            <span className="text-xs text-muted-foreground">No end limit</span>
          </label>
        </div>

        {/* Allocation Days */}
        <div className="space-y-1.5">
          <label className={MODAL_LABEL}>Allocation (Days)</label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="0"
              max={maxDays}
              value={form.days}
              onChange={(e) => {
                const v = Math.min(Number(e.target.value), maxDays);
                setForm((f) => ({ ...f, days: v }));
              }}
              required
              className={cn(MODAL_INPUT, "w-32")}
            />
            <span className="text-sm text-muted-foreground">days</span>
          </div>
          {!form.noLimit && form.endDate && (
            <p className="text-[11px] text-muted-foreground">
              Max allowed: <span className="font-medium text-foreground">{maxDays} day{maxDays !== 1 ? "s" : ""}</span> (based on validity period)
            </p>
          )}
        </div>

        {/* Note */}
        <div className="space-y-1.5">
          <label className={MODAL_LABEL}>Note <span className="normal-case text-muted-foreground/60">(optional)</span></label>
          <textarea
            value={form.note}
            onChange={set("note")}
            placeholder="Allocation notes…"
            rows={2}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <button type="button" onClick={onClose}
            className="h-9 rounded-lg border border-border bg-transparent px-4 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
            Discard
          </button>
          <button type="submit" disabled={loading}
            className="h-9 rounded-lg bg-gradient-to-r from-primary to-secondary px-5 text-sm font-semibold text-white hover:brightness-110 transition-all disabled:opacity-60">
            {loading ? "Saving…" : "Save Allocation"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onNew }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <ClipboardList size={28} />
      </div>
      <h3 className="text-base font-semibold text-foreground">No allocations yet</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-xs">
        Create a leave allocation to define how many days an employee is entitled to for a given leave type.
      </p>
      <button
        onClick={onNew}
        className="mt-5 flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-secondary px-4 py-2 text-sm font-semibold text-white hover:brightness-110 transition-all"
      >
        <Plus size={15} /> New Allocation
      </button>
    </div>
  );
}

// ─── Allocation Row ───────────────────────────────────────────────────────────

function AllocationRow({ alloc }) {
  return (
    <div className="grid grid-cols-[1.5fr_130px_110px_110px_80px_1fr] items-center border-b border-border last:border-0 hover:bg-muted/20 transition-colors px-4 py-3">
      <div className="flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-bold text-primary shrink-0">
          {empName(alloc.user).slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{empName(alloc.user)}</p>
          <p className="text-[11px] text-muted-foreground">{alloc.user?.loginId}</p>
        </div>
      </div>
      <div>
        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border", TYPE_STYLE[alloc.leaveType])}>
          {alloc.leaveType}
        </span>
      </div>
      <div className="text-sm text-muted-foreground">{fmtDate(alloc.startDate)}</div>
      <div className="text-sm text-muted-foreground">{fmtDate(alloc.endDate)}</div>
      <div className="text-sm font-semibold text-foreground">{alloc.days} <span className="text-xs font-normal text-muted-foreground">days</span></div>
      <div className="text-xs text-muted-foreground truncate pr-4">{alloc.note || "—"}</div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LeaveAllocation() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");

  const { data: empData }   = useFetch(() => api.get("/employees"), []);
  const { data: allocData, loading, refetch } = useFetch(() => api.get("/leave/allocations"), []);

  const employees   = empData?.employees  ?? [];
  const allocations = allocData?.allocations ?? [];

  const filtered = allocations.filter((a) => {
    const name = empName(a.user).toLowerCase();
    return !search || name.includes(search.toLowerCase()) || a.leaveType.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      <PageHeader
        title="Leave Allocation"
        breadcrumbs={[{ label: "Leave Allocation" }]}
      />

      {/* Info banner */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-3.5 flex items-start gap-3">
        <ClipboardList size={18} className="text-primary mt-0.5 shrink-0" />
        <p className="text-sm text-muted-foreground leading-relaxed">
          Manage leave entitlements for employees. Select an employee, choose a leave type, set the validity period and the number of allocated days.
          Only <span className="font-medium text-foreground">Admin</span> and <span className="font-medium text-foreground">HR Officers</span> can manage allocations.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-secondary px-4 h-9 text-sm font-semibold text-white hover:brightness-110 transition-all"
        >
          <Plus size={15} /> New Allocation
        </button>
        <input
          type="text"
          placeholder="Search employee or leave type…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 flex-1 min-w-[200px] max-w-xs rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors"
        />
        <span className="ml-auto text-xs text-muted-foreground">
          {allocations.length} allocation{allocations.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[1.5fr_130px_110px_110px_80px_1fr] border-b border-border bg-muted/40 px-4 py-2.5">
          {["Employee", "Leave Type", "From", "To", "Days", "Note"].map((h) => (
            <p key={h} className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{h}</p>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <span className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState onNew={() => setShowModal(true)} />
        ) : (
          filtered.map((alloc) => <AllocationRow key={alloc.id} alloc={alloc} />)
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <AllocationModal
          employees={employees}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); refetch(); }}
        />
      )}
    </div>
  );
}
