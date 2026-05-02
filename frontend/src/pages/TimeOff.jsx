import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Upload, Plus, Check, XCircle, Trash2, Paperclip } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { useFetch } from "@/hooks/useFetch";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const LEAVE_TYPES = [
  { value: "Paid Time Off",  label: "Paid Time Off",  isPaid: true  },
  { value: "Sick Leave",     label: "Sick Leave",      isPaid: true  },
  { value: "Unpaid Leave",   label: "Unpaid Leave",    isPaid: false },
];

// No static LEAVE_ALLOC — loaded live from /leave/allocations/me

const STATUS_STYLE = {
  PENDING:  "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  APPROVED: "bg-green-500/10  text-green-500  border-green-500/20",
  REJECTED: "bg-red-500/10    text-red-500    border-red-500/20",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function countDays(start, end) {
  const s = new Date(start), e = new Date(end);
  return Math.max(1, Math.ceil((e - s) / 86400000) + 1);
}

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
}

function empName(user) {
  return [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.loginId || "—";
}

// ─── Leave Request Modal (Employee submits own request) ───────────────────────

const MODAL_INPUT = "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-colors";
const MODAL_LABEL = "text-xs font-medium text-muted-foreground uppercase tracking-wide";

function ModalShell({ title, subtitle, onClose, children }) {
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-foreground/40 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl animate-fade-up overflow-hidden max-h-[90vh] flex flex-col">
        {/* Gradient header */}
        <div className="relative bg-gradient-to-r from-primary to-secondary px-6 py-5 shrink-0">
          <div className="absolute inset-0 opacity-10" style={{backgroundImage: "radial-gradient(circle at 80% 50%, white 0%, transparent 60%)"}} />
          <div className="flex items-center justify-between relative">
            <div>
              <h2 className="text-base font-bold text-white">{title}</h2>
              {subtitle && <p className="text-xs text-white/70 mt-0.5">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>,
    document.body
  );
}

function RequestModal({ onClose, onSuccess, currentUser }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    leaveType: "Paid Time Off",
    startDate: "",
    endDate:   "",
    reason:    "",
  });
  const [attachment, setAttachment] = useState(null);
  const [loading, setLoading] = useState(false);

  const allocation = form.startDate && form.endDate && form.endDate >= form.startDate
    ? countDays(form.startDate, form.endDate)
    : null;

  function set(k) { return (e) => setForm((f) => ({ ...f, [k]: e.target.value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.startDate || !form.endDate) {
      toast({ title: "Please fill in all dates", variant: "error" }); return;
    }
    if (form.endDate < form.startDate) {
      toast({ title: "End date must be after start date", variant: "error" }); return;
    }
    setLoading(true);
    try {
      const type = LEAVE_TYPES.find((t) => t.value === form.leaveType);
      const fd = new FormData();
      fd.append("leaveType", form.leaveType);
      fd.append("startDate", form.startDate);
      fd.append("endDate",   form.endDate);
      fd.append("isPaid",    type?.isPaid === false ? "false" : "true");
      if (form.reason) fd.append("reason", form.reason);
      if (attachment)  fd.append("attachment", attachment);
      await api.post("/leave", fd);
      toast({ title: "Leave request submitted", variant: "success" });
      onSuccess();
    } catch (err) {
      toast({ title: err.message || "Submission failed", variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalShell title="Request Time Off" subtitle={`Submitting for ${empName(currentUser)}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
        {/* Leave type */}
        <div className="space-y-1.5">
          <label className={MODAL_LABEL}>Time Off Type</label>
          <select
            value={form.leaveType}
            onChange={(e) => {
              set("leaveType")(e);
              if (e.target.value !== "Sick Leave") setAttachment(null);
            }}
            className={MODAL_INPUT}
          >
            {LEAVE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Dates */}
        <div className="space-y-1.5">
          <label className={MODAL_LABEL}>Validity Period</label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-[11px] text-muted-foreground">From</p>
              <input type="date" value={form.startDate} onChange={set("startDate")} required className={MODAL_INPUT} />
            </div>
            <div className="space-y-1">
              <p className="text-[11px] text-muted-foreground">To</p>
              <input type="date" value={form.endDate} min={form.startDate} onChange={set("endDate")} required className={MODAL_INPUT} />
            </div>
          </div>
        </div>

        {/* Allocation chip */}
        {allocation != null && (
          <div className="flex items-center gap-2 rounded-lg bg-primary/8 border border-primary/20 px-4 py-2.5">
            <span className="text-xs text-muted-foreground">Duration:</span>
            <span className="text-sm font-bold text-primary">{allocation} {allocation === 1 ? "day" : "days"}</span>
          </div>
        )}

        {/* Note */}
        <div className="space-y-1.5">
          <label className={MODAL_LABEL}>Note <span className="normal-case text-muted-foreground/60">(optional)</span></label>
          <textarea
            value={form.reason}
            onChange={set("reason")}
            placeholder="Reason for leave…"
            rows={2}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
          />
        </div>

        {/* Attachment — only for Sick Leave */}
        {form.leaveType === "Sick Leave" && (
          <div className="space-y-1.5">
            <label className={MODAL_LABEL}>Attachment <span className="normal-case text-muted-foreground/60">(sick leave certificate)</span></label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors">
              <Upload size={13} />
              {attachment ? attachment.name : "Attach document image"}
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => setAttachment(e.target.files?.[0] ?? null)}
              />
            </label>
            {attachment && (
              <p className="text-[11px] text-muted-foreground truncate">{attachment.name} — {(attachment.size / 1024).toFixed(0)} KB
                <button type="button" onClick={() => setAttachment(null)} className="ml-2 text-destructive hover:underline">remove</button>
              </p>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <button type="button" onClick={onClose}
            className="h-9 rounded-lg border border-border bg-transparent px-4 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
            Discard
          </button>
          <button type="submit" disabled={loading}
            className="h-9 rounded-lg bg-gradient-to-r from-primary to-secondary px-5 text-sm font-semibold text-white hover:brightness-110 transition-all disabled:opacity-60">
            {loading ? "Submitting…" : "Submit Request"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ─── Admin/HR New Request Form (create on behalf of employee) ─────────────────

function AdminRequestForm({ onClose, onSuccess }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    targetUserId: "",
    leaveType:    "Paid Time Off",
    startDate:    "",
    endDate:      "",
    reason:       "",
  });
  const [attachment, setAttachment] = useState(null);

  const { data: empData } = useFetch(() => api.get("/employees"), []);
  const employees = empData?.employees ?? [];

  const allocation = form.startDate && form.endDate && form.endDate >= form.startDate
    ? countDays(form.startDate, form.endDate)
    : null;

  function set(k) { return (e) => setForm((f) => ({ ...f, [k]: e.target.value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.targetUserId) { toast({ title: "Select an employee", variant: "error" }); return; }
    if (!form.startDate || !form.endDate) { toast({ title: "Fill in both dates", variant: "error" }); return; }
    setLoading(true);
    try {
      const type = LEAVE_TYPES.find((t) => t.value === form.leaveType);
      const fd = new FormData();
      fd.append("targetUserId", form.targetUserId);
      fd.append("leaveType",    form.leaveType);
      fd.append("startDate",    form.startDate);
      fd.append("endDate",      form.endDate);
      fd.append("isPaid",       type?.isPaid === false ? "false" : "true");
      if (form.reason) fd.append("reason", form.reason);
      if (attachment)  fd.append("attachment", attachment);
      await api.post("/leave", fd);
      toast({ title: "Leave request created", variant: "success" });
      onSuccess();
    } catch (err) {
      toast({ title: err.message || "Failed", variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalShell title="New Leave Request" subtitle="Create a leave request on behalf of an employee" onClose={onClose}>
      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
        {/* Employee */}
        <div className="space-y-1.5">
          <label className={MODAL_LABEL}>Employee</label>
          <select value={form.targetUserId} onChange={set("targetUserId")} required className={MODAL_INPUT}>
            <option value="">Select employee…</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{empName(e)}</option>
            ))}
          </select>
        </div>

        {/* Leave type */}
        <div className="space-y-1.5">
          <label className={MODAL_LABEL}>Time Off Type</label>
          <select
            value={form.leaveType}
            onChange={(e) => {
              set("leaveType")(e);
              if (e.target.value !== "Sick Leave") setAttachment(null);
            }}
            className={MODAL_INPUT}
          >
            {LEAVE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        {/* Dates */}
        <div className="space-y-1.5">
          <label className={MODAL_LABEL}>Validity Period</label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-[11px] text-muted-foreground">From</p>
              <input type="date" value={form.startDate} onChange={set("startDate")} required className={MODAL_INPUT} />
            </div>
            <div className="space-y-1">
              <p className="text-[11px] text-muted-foreground">To</p>
              <input type="date" value={form.endDate} min={form.startDate} onChange={set("endDate")} required className={MODAL_INPUT} />
            </div>
          </div>
        </div>

        {/* Allocation chip */}
        {allocation != null && (
          <div className="flex items-center gap-2 rounded-lg bg-primary/8 border border-primary/20 px-4 py-2.5">
            <span className="text-xs text-muted-foreground">Duration:</span>
            <span className="text-sm font-bold text-primary">{allocation} {allocation === 1 ? "day" : "days"}</span>
          </div>
        )}

        {/* Note */}
        <div className="space-y-1.5">
          <label className={MODAL_LABEL}>Note <span className="normal-case text-muted-foreground/60">(optional)</span></label>
          <textarea value={form.reason} onChange={set("reason")} placeholder="Reason for leave…" rows={2}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
        </div>

        {/* Attachment — only for Sick Leave */}
        {form.leaveType === "Sick Leave" && (
          <div className="space-y-1.5">
            <label className={MODAL_LABEL}>Attachment <span className="normal-case text-muted-foreground/60">(sick leave certificate)</span></label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors">
              <Upload size={13} />
              {attachment ? attachment.name : "Attach document image"}
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => setAttachment(e.target.files?.[0] ?? null)}
              />
            </label>
            {attachment && (
              <p className="text-[11px] text-muted-foreground truncate">{attachment.name} — {(attachment.size / 1024).toFixed(0)} KB
                <button type="button" onClick={() => setAttachment(null)} className="ml-2 text-destructive hover:underline">remove</button>
              </p>
            )}
          </div>
        )}
        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <button type="button" onClick={onClose}
            className="h-9 rounded-lg border border-border bg-transparent px-4 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
            Discard
          </button>
          <button type="submit" disabled={loading}
            className="h-9 rounded-lg bg-gradient-to-r from-primary to-secondary px-5 text-sm font-semibold text-white hover:brightness-110 transition-all disabled:opacity-60">
            {loading ? "Saving…" : "Submit Request"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ─── Leave table row ──────────────────────────────────────────────────────────

function LeaveRow({ request, canApprove, isEmployee, onApprove, onDelete }) {
  const [acting, setActing] = useState(null);

  async function act(action) {
    setActing(action);
    await onApprove(request.id, action);
    setActing(null);
  }

  return (
    <div className={cn(
      "grid items-center border-b border-border last:border-0 hover:bg-muted/20 transition-colors",
      isEmployee
        ? "grid-cols-[1fr_110px_110px_140px_100px_80px]"
        : "grid-cols-[1fr_110px_110px_140px_100px_140px]"
    )}>
      <div className="px-4 py-3 text-sm font-medium text-foreground">
        {isEmployee ? request.leaveType : empName(request.user)}
      </div>
      <div className="px-4 py-3 text-sm text-muted-foreground">{fmtDate(request.startDate)}</div>
      <div className="px-4 py-3 text-sm text-muted-foreground">{fmtDate(request.endDate)}</div>
      <div className="px-4 py-3">
        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border", isEmployee ? "text-muted-foreground" : "text-primary")}>
          {isEmployee ? `${countDays(request.startDate, request.endDate)} day(s)` : request.leaveType}
        </span>
      </div>
      <div className="px-4 py-3">
        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border", STATUS_STYLE[request.status])}>
          {request.status}
        </span>
      </div>
      <div className="px-4 py-3 flex items-center justify-end gap-1.5">
        {/* Attachment — fixed-width slot so action buttons never shift */}
        <span className="w-7 flex items-center justify-center">
          {request.attachmentUrl && (
            <a
              href={request.attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-7 w-7 rounded-md bg-muted text-muted-foreground flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors"
              title="View attachment"
            >
              <Paperclip size={13} />
            </a>
          )}
        </span>
        {canApprove && request.status === "PENDING" && (
          <>
            <button onClick={() => act("approve")} disabled={!!acting} aria-label="Approve"
              className="h-7 w-7 rounded-md bg-green-500/10 text-green-500 flex items-center justify-center hover:bg-green-500/20 transition-colors disabled:opacity-50">
              {acting === "approve" ? <span className="h-3 w-3 rounded-full border-2 border-green-500 border-t-transparent animate-spin" /> : <Check size={14} />}
            </button>
            <button onClick={() => act("reject")} disabled={!!acting} aria-label="Reject"
              className="h-7 w-7 rounded-md bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20 transition-colors disabled:opacity-50">
              {acting === "reject" ? <span className="h-3 w-3 rounded-full border-2 border-red-500 border-t-transparent animate-spin" /> : <XCircle size={14} />}
            </button>
          </>
        )}
        {isEmployee && request.status === "PENDING" && (
          <button onClick={() => onDelete(request.id)} aria-label="Cancel request"
            className="h-7 w-7 rounded-md bg-muted text-muted-foreground flex items-center justify-center hover:bg-destructive/10 hover:text-destructive transition-colors">
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TimeOff() {
  const { user }    = useAuth();
  const { toast }   = useToast();
  const [modal, setModal] = useState(false);

  const isEmployee  = user?.role === "EMPLOYEE";
  const canApprove  = ["ADMIN", "HR_OFFICER"].includes(user?.role);

  const { data, loading, refetch } = useFetch(() => api.get("/leave"), []);
  const requests = data?.requests ?? [];

  // ── My allocations (live from DB) ───────────────────────────────────────────
  const { data: allocData } = useFetch(() => isEmployee ? api.get("/leave/allocations/me") : Promise.resolve(null), [isEmployee]);
  const myAllocations = allocData?.allocations ?? [];

  // Build a map: leaveType → allocated days (sum if multiple records)
  const allocMap = useMemo(() => {
    const map = {};
    for (const a of myAllocations) {
      map[a.leaveType] = (map[a.leaveType] ?? 0) + a.days;
    }
    return map;
  }, [myAllocations]);

  // ── Leave balance (allocated − approved used) ────────────────────────────
  const balance = useMemo(() => {
    const approved = requests.filter((r) => r.status === "APPROVED");
    return Object.fromEntries(
      Object.entries(allocMap).map(([type, total]) => {
        const used = approved
          .filter((r) => r.leaveType === type)
          .reduce((s, r) => s + countDays(r.startDate, r.endDate), 0);
        return [type, { total, remaining: Math.max(0, total - used), used }];
      })
    );
  }, [requests, allocMap]);

  async function handleApprove(id, action) {
    try {
      await api.put(`/leave/${id}/${action}`, {});
      toast({ title: `Request ${action === "approve" ? "approved" : "rejected"}`, variant: "success" });
      refetch();
    } catch (err) {
      toast({ title: err.message, variant: "error" });
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/leave/${id}`);
      toast({ title: "Request cancelled", variant: "success" });
      refetch();
    } catch (err) {
      toast({ title: err.message, variant: "error" });
    }
  }

  const colHeaders = isEmployee
    ? ["Time off Type", "Start Date", "End Date", "Duration", "Status", ""]
    : ["Employee",      "Start Date", "End Date", "Time off Type", "Status", "Actions"];

  const gridClass = isEmployee
    ? "grid-cols-[1fr_110px_110px_140px_100px_80px]"
    : "grid-cols-[1fr_110px_110px_140px_100px_140px]";

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader title="Time Off" breadcrumbs={[{ label: "Time Off" }]} />

      {/* Action bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-white hover:bg-secondary/90 transition-colors"
        >
          <Plus size={16} /> NEW
        </button>
      </div>

      {/* Leave balance cards (employee only) */}
      {isEmployee && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {myAllocations.length === 0 ? (
            <div className="sm:col-span-3 rounded-xl border border-border bg-card px-5 py-4 text-sm text-muted-foreground">
              No leave allocations assigned yet. Contact HR to set up your leave balance.
            </div>
          ) : (
            Object.entries(balance).map(([type, { total, remaining, used }]) => (
              <div key={type} className="rounded-xl border border-border bg-card px-5 py-4">
                <p className="text-sm font-semibold text-primary">{type}</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {String(remaining).padStart(2, "0")}
                  <span className="text-sm font-normal text-muted-foreground ml-1">Days Available</span>
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {used} used · {total} allocated
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className={cn("grid bg-muted/40 border-b border-border", gridClass)}>
          {colHeaders.map((h) => (
            <div key={h} className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</div>
          ))}
        </div>

        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className={cn("grid border-b border-border last:border-0", gridClass)}>
              {colHeaders.map((_, j) => (
                <div key={j} className="px-4 py-3"><div className="h-4 rounded bg-muted/40 animate-pulse" /></div>
              ))}
            </div>
          ))
        ) : requests.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">No leave requests found.</div>
        ) : (
          requests.map((r) => (
            <LeaveRow
              key={r.id}
              request={r}
              canApprove={canApprove}
              isEmployee={isEmployee}
              onApprove={handleApprove}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* Modal */}
      {modal && (
        isEmployee
          ? <RequestModal currentUser={user} onClose={() => setModal(false)} onSuccess={() => { setModal(false); refetch(); }} />
          : <AdminRequestForm onClose={() => setModal(false)} onSuccess={() => { setModal(false); refetch(); }} />
      )}
    </div>
  );
}
