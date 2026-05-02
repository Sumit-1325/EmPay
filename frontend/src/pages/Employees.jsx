import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Plane, X, Copy, Check, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/common/Avatar";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { ROLE_LABELS, MANAGER_ROLES, USER_ROLES } from "@/constants/roles";
import { cn } from "@/lib/utils";

// ── Status indicator ──────────────────────────────────────────────────────────
function StatusDot({ status }) {
  if (status === "PRESENT" || status === "HALF_DAY")
    return <span className="h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-background shadow" title="Present" />;
  if (status === "LEAVE")
    return <span title="On leave"><Plane size={14} className="text-primary" /></span>;
  return <span className="h-3 w-3 rounded-full bg-amber-400 ring-2 ring-background shadow" title="Absent" />;
}

// ── Employee card ─────────────────────────────────────────────────────────────
function EmployeeCard({ employee, attendanceStatus, onClick }) {
  const initials = [employee.firstName?.[0], employee.lastName?.[0]]
    .filter(Boolean).join("").toUpperCase() || employee.loginId?.slice(0, 2).toUpperCase() || "?";

  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5 text-center shadow-sm transition-all hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 focus-ring"
    >
      <span className="absolute right-3 top-3">
        <StatusDot status={attendanceStatus} />
      </span>
      <Avatar src={employee.avatarUrl ?? undefined} initials={initials} size="xl" className="mt-1" />
      <div className="w-full min-w-0 space-y-0.5">
        <p className="truncate text-sm font-semibold text-foreground">
          {employee.name || `${employee.firstName} ${employee.lastName}`}
        </p>
        <p className="truncate text-xs text-muted-foreground">{ROLE_LABELS[employee.role] ?? employee.role}</p>
        <p className="truncate text-[0.65rem] text-muted-foreground/60">{employee.loginId}</p>
      </div>
    </button>
  );
}

// ── Field component ───────────────────────────────────────────────────────────
function Field({ label, required, children, error }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-foreground">
        {label}{required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

const INPUT_CLS = "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-colors disabled:opacity-60";
const SELECT_CLS = `${INPUT_CLS} cursor-pointer`;

// ── Temp password reveal ──────────────────────────────────────────────────────
function TempPasswordCard({ loginId, tempPassword, onClose }) {
  const [copied, setCopied]   = useState(false);
  const [visible, setVisible] = useState(false);
  const { toast } = useToast();

  function copy() {
    navigator.clipboard.writeText(tempPassword).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
      <div className="w-full max-w-md animate-fade-up rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground">Employee created</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          Save these credentials — the password is shown only once and cannot be recovered.
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 px-4 py-2.5">
            <div>
              <p className="text-[0.65rem] text-muted-foreground uppercase tracking-wide">Login ID</p>
              <p className="text-sm font-mono font-semibold text-foreground">{loginId}</p>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 px-4 py-2.5">
            <div className="flex-1 min-w-0">
              <p className="text-[0.65rem] text-muted-foreground uppercase tracking-wide">Temp Password</p>
              <p className="text-sm font-mono font-semibold text-foreground">
                {visible ? tempPassword : "•".repeat(tempPassword.length)}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-3">
              <button onClick={() => setVisible((v) => !v)} className="text-muted-foreground hover:text-foreground">
                {visible ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
              <button onClick={copy} className="text-muted-foreground hover:text-foreground">
                {copied ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
              </button>
            </div>
          </div>
        </div>

        <Button
          onClick={onClose}
          className="mt-5 h-9 w-full rounded-lg bg-gradient-to-r from-primary to-secondary text-sm font-semibold text-white hover:brightness-110"
        >
          Done
        </Button>
      </div>
    </div>
  );
}

// ── Create employee modal ─────────────────────────────────────────────────────
const INITIAL = {
  firstName: "", lastName: "", email: "",
  role: "EMPLOYEE", monthlyWage: "", joiningDate: "", pfNumber: "",
};

function CreateEmployeeModal({ onClose, onCreated }) {
  const { toast } = useToast();
  const [fields, setFields]   = useState(INITIAL);
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);

  function set(key) {
    return (e) => {
      setFields((p) => ({ ...p, [key]: e.target.value }));
      if (errors[key]) setErrors((p) => ({ ...p, [key]: "" }));
    };
  }

  function validate() {
    const errs = {};
    if (!fields.firstName.trim()) errs.firstName = "First name is required";
    if (!fields.lastName.trim())  errs.lastName  = "Last name is required";
    if (!fields.email.trim())     errs.email     = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) errs.email = "Enter a valid email";
    if (fields.monthlyWage && isNaN(Number(fields.monthlyWage))) errs.monthlyWage = "Must be a number";
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const body = {
        firstName: fields.firstName.trim(),
        lastName:  fields.lastName.trim(),
        email:     fields.email.trim().toLowerCase(),
        role:      fields.role,
        ...(fields.monthlyWage && { monthlyWage: parseFloat(fields.monthlyWage) }),
        ...(fields.joiningDate  && { joiningDate: fields.joiningDate }),
        ...(fields.pfNumber     && { pfNumber: fields.pfNumber.trim() }),
      };
      const res = await api.post("/employees", body);
      onCreated(res.data.employee, res.data.tempPassword);
    } catch (err) {
      if (err.errors?.length) {
        const mapped = {};
        err.errors.forEach(({ path, msg }) => { if (path) mapped[path] = msg; });
        setErrors(mapped);
      } else {
        toast({ title: err.message || "Failed to create employee", variant: "error" });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
      <div className="w-full max-w-lg animate-fade-up rounded-2xl border border-border bg-card shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">

        {/* Gradient header */}
        <div className="relative bg-gradient-to-r from-primary to-secondary px-6 py-5">
          <div className="absolute inset-0 opacity-10" style={{backgroundImage: "radial-gradient(circle at 80% 50%, white 0%, transparent 60%)"}} />
          <div className="flex items-center justify-between relative">
            <div>
              <h2 className="text-base font-bold text-white">New Employee</h2>
              <p className="text-xs text-white/70 mt-0.5">Fill in the details to add a new team member</p>
            </div>
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="px-6 py-5 space-y-4">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="First Name" required error={errors.firstName}>
              <input className={INPUT_CLS} placeholder="Jane" value={fields.firstName} onChange={set("firstName")} />
            </Field>
            <Field label="Last Name" required error={errors.lastName}>
              <input className={INPUT_CLS} placeholder="Smith" value={fields.lastName} onChange={set("lastName")} />
            </Field>
          </div>

          <Field label="Email" required error={errors.email}>
            <input type="email" className={INPUT_CLS} placeholder="jane@company.com" value={fields.email} onChange={set("email")} />
          </Field>

          <Field label="Role" error={errors.role}>
            <select className={SELECT_CLS} value={fields.role} onChange={set("role")}>
              {Object.entries(USER_ROLES)
                .filter(([k]) => k !== "SUPER_ADMIN")
                .map(([k, v]) => (
                  <option key={k} value={v}>{ROLE_LABELS[v]}</option>
                ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Monthly Wage (₹)" error={errors.monthlyWage}>
              <input type="number" min="0" className={INPUT_CLS} placeholder="50000" value={fields.monthlyWage} onChange={set("monthlyWage")} />
            </Field>
            <Field label="Joining Date" error={errors.joiningDate}>
              <input type="date" className={INPUT_CLS} value={fields.joiningDate} onChange={set("joiningDate")} />
            </Field>
          </div>

          <Field label="PF Number" error={errors.pfNumber}>
            <input className={INPUT_CLS} placeholder="Optional" value={fields.pfNumber} onChange={set("pfNumber")} />
          </Field>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-border pt-4 mt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="h-9 px-4 text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-9 gap-2 rounded-lg bg-gradient-to-r from-primary to-secondary px-5 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60"
            >
              {loading ? "Creating…" : "Create Employee"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Employees() {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const { toast } = useToast();

  const [employees,     setEmployees]     = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [search,        setSearch]        = useState("");
  const [loading,       setLoading]       = useState(true);
  const [showCreate,    setShowCreate]    = useState(false);
  const [createdCreds,  setCreatedCreds]  = useState(null); // { loginId, tempPassword }

  const canCreate = MANAGER_ROLES.includes(user?.role);

  function loadData() {
    const today = new Date().toISOString().split("T")[0];
    return Promise.all([
      api.get("/employees"),
      api.get(`/attendance?date=${today}`),
    ]).then(([empRes, attRes]) => {
      setEmployees(empRes.data.employees ?? []);
      const map = {};
      (attRes.data.attendance ?? []).forEach((r) => { map[r.userId] = r.status; });
      setAttendanceMap(map);
    });
  }

  useEffect(() => {
    loadData()
      .catch(() => toast({ title: "Failed to load employees", variant: "error" }))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleCreated(employee, tempPassword) {
    setShowCreate(false);
    setCreatedCreds({ loginId: employee.loginId, tempPassword });
    setEmployees((prev) => [employee, ...prev]);
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return employees;
    return employees.filter((e) =>
      e.name?.toLowerCase().includes(q) ||
      e.loginId?.toLowerCase().includes(q) ||
      e.email?.toLowerCase().includes(q)
    );
  }, [employees, search]);

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center gap-3">
        {canCreate && (
          <Button
            onClick={() => setShowCreate(true)}
            className="h-9 gap-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-sm font-semibold text-white hover:brightness-110 shrink-0"
          >
            <Plus size={15} /> New
          </Button>
        )}
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employees…"
            className="h-9 w-full rounded-lg border border-border bg-muted/50 pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm text-muted-foreground">
            {search ? "No employees match your search." : "No employees yet. Click New to add one."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((emp) => (
            <EmployeeCard
              key={emp.id}
              employee={emp}
              attendanceStatus={attendanceMap[emp.id]}
              onClick={() => navigate(`/employees/${emp.id}`)}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <CreateEmployeeModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}

      {/* Temp password reveal */}
      {createdCreds && (
        <TempPasswordCard
          loginId={createdCreds.loginId}
          tempPassword={createdCreds.tempPassword}
          onClose={() => setCreatedCreds(null)}
        />
      )}
    </div>
  );
}
