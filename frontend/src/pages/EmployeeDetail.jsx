import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Pencil, Plus, X, Building2, MapPin,
  Mail, Phone, FileText, Star, Award, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/common/Avatar";
import { Tabs } from "@/components/common/Tabs";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { ROLE_LABELS, MANAGER_ROLES, PAYROLL_ROLES } from "@/constants/roles";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

// ── Inline editable text area ─────────────────────────────────────────────────
function EditableSection({ title, value, field, canEdit, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value ?? "");

  useEffect(() => { setDraft(value ?? ""); }, [value]);

  async function handleBlur() {
    setEditing(false);
    if (draft !== (value ?? "")) await onSave(field, draft);
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {canEdit && !editing && (
          <button onClick={() => setEditing(true)} className="text-muted-foreground hover:text-foreground">
            <Pencil size={12} />
          </button>
        )}
      </div>
      {editing ? (
        <textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleBlur}
          rows={4}
          className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      ) : (
        <p className={cn("text-sm leading-relaxed", draft ? "text-foreground" : "text-muted-foreground italic")}>
          {draft || (canEdit ? "Click the pencil to add…" : "—")}
        </p>
      )}
    </div>
  );
}

// ── Skills panel ──────────────────────────────────────────────────────────────
function SkillsPanel({ skills, employeeId, canEdit, onAdded, onDeleted }) {
  const [input, setInput] = useState("");
  const { toast } = useToast();

  async function handleAdd(e) {
    if (e.key !== "Enter" || !input.trim()) return;
    e.preventDefault();
    try {
      const res = await api.post(`/employees/${employeeId}/skills`, { name: input.trim() });
      onAdded(res.data.skill);
      setInput("");
    } catch (err) {
      toast({ title: err.message || "Failed to add skill", variant: "error" });
    }
  }

  async function handleDelete(skillId) {
    try {
      await api.delete(`/employees/${employeeId}/skills/${skillId}`);
      onDeleted(skillId);
    } catch (err) {
      toast({ title: err.message || "Failed to remove skill", variant: "error" });
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Star size={14} /> Skills</h3>
      <div className="flex flex-wrap gap-2">
        {skills.map((s) => (
          <span key={s.id} className="flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-foreground">
            {s.name}
            {canEdit && (
              <button onClick={() => handleDelete(s.id)} className="ml-1 text-muted-foreground hover:text-destructive">
                <X size={10} />
              </button>
            )}
          </span>
        ))}
        {skills.length === 0 && <p className="text-xs text-muted-foreground italic">No skills added yet.</p>}
      </div>
      {canEdit && (
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleAdd}
          placeholder="Type skill and press Enter…"
          className="h-8 w-full rounded-lg border border-border bg-muted/50 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
        />
      )}
    </div>
  );
}

// ── Certifications panel ──────────────────────────────────────────────────────
function CertsPanel({ certs, employeeId, canEdit, onAdded, onDeleted }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm]     = useState({ name: "", issuedBy: "", issuedDate: "" });
  const { toast } = useToast();

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    try {
      const res = await api.post(`/employees/${employeeId}/certifications`, form);
      onAdded(res.data.certification);
      setForm({ name: "", issuedBy: "", issuedDate: "" });
      setAdding(false);
    } catch (err) {
      toast({ title: err.message || "Failed to add certification", variant: "error" });
    }
  }

  async function handleDelete(certId) {
    try {
      await api.delete(`/employees/${employeeId}/certifications/${certId}`);
      onDeleted(certId);
    } catch (err) {
      toast({ title: err.message || "Failed to remove certification", variant: "error" });
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Award size={14} /> Certifications</h3>
      <div className="space-y-2">
        {certs.map((c) => (
          <div key={c.id} className="flex items-start justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{c.name}</p>
              {c.issuedBy && <p className="text-[0.65rem] text-muted-foreground">{c.issuedBy}</p>}
              {c.issuedDate && (
                <p className="text-[0.65rem] text-muted-foreground">
                  {new Date(c.issuedDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                </p>
              )}
            </div>
            {canEdit && (
              <button onClick={() => handleDelete(c.id)} className="shrink-0 text-muted-foreground hover:text-destructive">
                <X size={12} />
              </button>
            )}
          </div>
        ))}
        {certs.length === 0 && <p className="text-xs text-muted-foreground italic">No certifications added yet.</p>}
      </div>
      {canEdit && !adding && (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <Plus size={12} /> Add Certification
        </button>
      )}
      {canEdit && adding && (
        <form onSubmit={handleAdd} className="space-y-2 pt-1">
          <input
            required autoFocus
            placeholder="Certification name *"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className="h-8 w-full rounded-lg border border-border bg-muted/50 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            placeholder="Issued by"
            value={form.issuedBy}
            onChange={(e) => setForm((p) => ({ ...p, issuedBy: e.target.value }))}
            className="h-8 w-full rounded-lg border border-border bg-muted/50 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            type="date"
            value={form.issuedDate}
            onChange={(e) => setForm((p) => ({ ...p, issuedDate: e.target.value }))}
            className="h-8 w-full rounded-lg border border-border bg-muted/50 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="flex gap-2">
            <Button type="submit" className="h-7 px-3 text-xs bg-gradient-to-r from-primary to-secondary text-white">Add</Button>
            <Button type="button" variant="ghost" onClick={() => setAdding(false)} className="h-7 px-3 text-xs">Cancel</Button>
          </div>
        </form>
      )}
    </div>
  );
}

// ── Private Info field ────────────────────────────────────────────────────────
function PrivateField({ label, value, field, canEdit, onSave, type = "text" }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value ?? "");

  useEffect(() => { setDraft(value ?? ""); }, [value]);

  async function handleBlur() {
    setEditing(false);
    if (draft !== (value ?? "")) await onSave(field, draft || null);
  }

  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-border last:border-0">
      <p className="text-xs text-muted-foreground shrink-0 w-36">{label}</p>
      {canEdit && editing ? (
        <input
          autoFocus
          type={type}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleBlur}
          className="flex-1 h-7 rounded-lg border border-border bg-muted/50 px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      ) : (
        <button
          onClick={() => canEdit && setEditing(true)}
          className={`flex-1 text-right text-sm ${value ? "text-foreground" : "text-muted-foreground italic"} ${canEdit ? "hover:text-primary transition-colors" : ""}`}
        >
          {value || (canEdit ? "Add…" : "—")}
        </button>
      )}
    </div>
  );
}

function PrivateSelectField({ label, value, field, canEdit, onSave, options }) {
  async function handleChange(e) {
    await onSave(field, e.target.value || null);
  }

  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-border last:border-0">
      <p className="text-xs text-muted-foreground shrink-0 w-36">{label}</p>
      {canEdit ? (
        <select
          value={value ?? ""}
          onChange={handleChange}
          className="flex-1 h-7 rounded-lg border border-border bg-muted/50 px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
        >
          <option value="">—</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <span className={`text-sm ${value ? "text-foreground" : "text-muted-foreground italic"}`}>{value || "—"}</span>
      )}
    </div>
  );
}

// ── Private Info Tab ──────────────────────────────────────────────────────────
function PrivateInfoTab({ employee, canEdit, onSave }) {
  const dob = employee.dateOfBirth
    ? new Date(employee.dateOfBirth).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Personal details */}
      <div className="rounded-xl border border-border bg-card px-5 py-2">
        <h3 className="text-sm font-semibold text-foreground py-3 border-b border-border">Personal Information</h3>
        <PrivateField    label="Date of Birth"   value={employee.dateOfBirth ? employee.dateOfBirth.split("T")[0] : null} field="dateOfBirth"   type="date"  canEdit={canEdit} onSave={onSave} />
        <PrivateField    label="Residing Address" value={employee.address}      field="address"       canEdit={canEdit} onSave={onSave} />
        <PrivateField    label="Nationality"      value={employee.nationality}  field="nationality"   canEdit={canEdit} onSave={onSave} />
        <PrivateField    label="Personal Email"   value={employee.personalEmail} field="personalEmail" type="email" canEdit={canEdit} onSave={onSave} />
        <PrivateSelectField label="Gender"        value={employee.gender}       field="gender"        canEdit={canEdit} onSave={onSave}
          options={["Male", "Female", "Non-binary", "Prefer not to say"]} />
        <PrivateSelectField label="Marital Status" value={employee.maritalStatus} field="maritalStatus" canEdit={canEdit} onSave={onSave}
          options={["Single", "Married", "Divorced", "Widowed"]} />
        <PrivateField    label="Date of Joining"  value={employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString("en-IN") : null} field="_" canEdit={false} onSave={onSave} />
      </div>

      {/* Bank details */}
      <div className="rounded-xl border border-border bg-card px-5 py-2">
        <h3 className="text-sm font-semibold text-foreground py-3 border-b border-border">Bank Details</h3>
        <PrivateField label="Account Number" value={employee.bankAccountNumber} field="bankAccountNumber" canEdit={canEdit} onSave={onSave} />
        <PrivateField label="Bank Name"      value={employee.bankName}          field="bankName"          canEdit={canEdit} onSave={onSave} />
        <PrivateField label="IFSC Code"      value={employee.ifscCode}          field="ifscCode"          canEdit={canEdit} onSave={onSave} />
        <PrivateField label="PAN No"         value={employee.panNumber}         field="panNumber"         canEdit={canEdit} onSave={onSave} />
        <PrivateField label="UAN No"         value={employee.uanNumber}         field="uanNumber"         canEdit={canEdit} onSave={onSave} />
        <PrivateField label="Emp Code"       value={employee.empCode}           field="empCode"           canEdit={canEdit} onSave={onSave} />
      </div>
    </div>
  );
}

// ── Salary row ────────────────────────────────────────────────────────────────
function SalaryRow({ label, desc, amount, pct }) {
  const fmt = (n) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return (
    <div className="py-3 border-b border-border last:border-0">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <div className="flex items-center gap-6 shrink-0">
          <span className="text-sm font-semibold text-foreground tabular-nums">{fmt(amount)}</span>
          <span className="text-xs text-muted-foreground w-12 text-right">{pct.toFixed(2)} %</span>
        </div>
      </div>
      {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
    </div>
  );
}

// ── Salary Info Tab ───────────────────────────────────────────────────────────
function SalaryInfoTab({ employee, canEdit, onSaveField }) {
  const wage  = employee.monthlyWage ?? 0;
  const basic = wage * 0.50;
  const hra   = basic * 0.50;
  const sa    = 4167;  // fixed amount per mockup spec
  const pb    = basic * 0.0833;
  const lta   = basic * 0.0833;
  const fixed = wage - (basic + hra + sa + pb + lta);
  const pfRate = employee.pfRate ?? 12;
  const pfEmp  = basic * (pfRate / 100);
  const pfEr   = basic * (pfRate / 100);
  const fmt    = (n) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      {/* Wage + schedule */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          <WageField label="Month Wage (₹)" value={employee.monthlyWage} field="monthlyWage" canEdit={canEdit} onSave={onSaveField} />
          <div>
            <p className="text-xs text-muted-foreground mb-1">Yearly Wage</p>
            <p className="text-lg font-bold text-foreground">{fmt(wage * 12)}</p>
          </div>
          <WageField label="Working Days / Week" value={employee.workingDaysPerWeek} field="workingDaysPerWeek" canEdit={canEdit} onSave={onSaveField} integer />
          <WageField label="Break Time (hrs)" value={employee.breakTimeHours} field="breakTimeHours" canEdit={canEdit} onSave={onSaveField} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Salary Components */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-1">Salary Components</h3>
          <p className="text-xs text-muted-foreground mb-3">Based on monthly wage of {fmt(wage)}</p>
          <SalaryRow label="Basic Salary"        desc="50% of monthly wage"                       amount={basic} pct={wage ? (basic/wage)*100 : 0} />
          <SalaryRow label="House Rent Allowance" desc="50% of basic salary"                      amount={hra}   pct={wage ? (hra/wage)*100 : 0} />
          <SalaryRow label="Standard Allowance"  desc="Fixed amount"                              amount={sa}    pct={wage ? (sa/wage)*100 : 0} />
          <SalaryRow label="Performance Bonus"   desc="8.33% of basic — variable during payroll" amount={pb}    pct={wage ? (pb/wage)*100 : 0} />
          <SalaryRow label="Leave Travel Allowance" desc="8.33% of basic salary"                 amount={lta}   pct={wage ? (lta/wage)*100 : 0} />
          <SalaryRow label="Fixed Allowance"     desc="Remainder after all components"            amount={fixed} pct={wage ? (fixed/wage)*100 : 0} />
        </div>

        <div className="space-y-4">
          {/* PF */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Provident Fund (PF) Contribution</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Employee</span>
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-foreground tabular-nums">{fmt(pfEmp)} / month</span>
                  <span className="text-xs text-muted-foreground w-12 text-right">{pfRate.toFixed(2)} %</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">PF calculated on basic salary</p>
              <div className="flex items-center justify-between text-sm pt-1">
                <span className="text-muted-foreground">Employer</span>
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-foreground tabular-nums">{fmt(pfEr)} / month</span>
                  <span className="text-xs text-muted-foreground w-12 text-right">{pfRate.toFixed(2)} %</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">PF calculated on basic salary</p>
              {canEdit && (
                <div className="pt-2 flex items-center gap-2">
                  <label className="text-xs text-muted-foreground">PF Rate (%)</label>
                  <PFRateField value={employee.pfRate} onSave={onSaveField} />
                </div>
              )}
            </div>
          </div>

          {/* Tax */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Tax Deductions</h3>
            <div className="flex items-center justify-between text-sm">
              <div>
                <p className="font-medium text-foreground">Professional Tax</p>
                <p className="text-xs text-muted-foreground">Deducted from gross salary</p>
              </div>
              <span className="font-semibold text-foreground">₹200.00 / month</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WageField({ label, value, field, canEdit, onSave, integer }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value ?? "");

  useEffect(() => { setDraft(value ?? ""); }, [value]);

  async function handleBlur() {
    setEditing(false);
    const parsed = integer ? parseInt(draft) : parseFloat(draft);
    if (!isNaN(parsed) && parsed !== value) await onSave(field, parsed);
  }

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {canEdit && editing ? (
        <input
          autoFocus
          type="number"
          min="0"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleBlur}
          className="h-8 w-full rounded-lg border border-border bg-muted/50 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      ) : (
        <button
          onClick={() => canEdit && setEditing(true)}
          className={cn("text-lg font-bold text-foreground", canEdit && "hover:text-primary transition-colors")}
        >
          {value != null ? value : <span className="text-sm text-muted-foreground italic">Not set</span>}
        </button>
      )}
    </div>
  );
}

function PFRateField({ value, onSave }) {
  const [draft, setDraft] = useState(value ?? 12);

  async function handleBlur() {
    const parsed = parseFloat(draft);
    if (!isNaN(parsed) && parsed !== value) await onSave("pfRate", parsed);
  }

  return (
    <input
      type="number"
      min="0"
      max="100"
      step="0.01"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={handleBlur}
      className="h-7 w-20 rounded-lg border border-border bg-muted/50 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
    />
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function EmployeeDetail() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { user }     = useAuth();
  const { toast }    = useToast();
  const fileRef      = useRef(null);

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading]   = useState(true);

  const canEdit       = MANAGER_ROLES.includes(user?.role) || user?.id === employee?.id;
  const canViewSalary = PAYROLL_ROLES.includes(user?.role);
  const canEditSalary = user?.role === "ADMIN";

  useEffect(() => {
    api.get(`/employees/${id}`)
      .then((res) => setEmployee(res.data.employee))
      .catch(() => {
        toast({ title: "Employee not found", variant: "error" });
        navigate(ROUTES.EMPLOYEES, { replace: true });
      })
      .finally(() => setLoading(false));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function saveField(field, value) {
    try {
      const res = await api.put(`/employees/${id}`, { [field]: value });
      setEmployee(res.data.employee);
    } catch (err) {
      toast({ title: err.message || "Failed to save", variant: "error" });
    }
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("avatar", file);
    try {
      const res = await api.patch(`/employees/${id}/avatar`, form);
      setEmployee(res.data.employee);
      toast({ title: "Avatar updated", variant: "success" });
    } catch (err) {
      toast({ title: err.message || "Upload failed", variant: "error" });
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 animate-pulse">
        <div className="h-8 w-32 rounded bg-muted" />
        <div className="h-40 rounded-2xl bg-muted" />
        <div className="h-96 rounded-2xl bg-muted" />
      </div>
    );
  }

  if (!employee) return null;

  const initials = [employee.firstName?.[0], employee.lastName?.[0]]
    .filter(Boolean).join("").toUpperCase() || "?";

  const joiningDate = employee.joiningDate
    ? new Date(employee.joiningDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : null;

  const tabs = [
    {
      value: "resume",
      label: "Resume",
      icon: FileText,
      content: (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Bio sections */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 space-y-6">
            <EditableSection title="About"                    value={employee.about}      field="about"      canEdit={canEdit} onSave={saveField} />
            <EditableSection title="What I love about my job" value={employee.jobPassion} field="jobPassion" canEdit={canEdit} onSave={saveField} />
            <EditableSection title="My interests and hobbies" value={employee.interests}  field="interests"  canEdit={canEdit} onSave={saveField} />
          </div>
          {/* Skills + Certs */}
          <div className="space-y-4">
            <SkillsPanel
              skills={employee.skills ?? []}
              employeeId={id}
              canEdit={canEdit}
              onAdded={(skill) => setEmployee((p) => ({ ...p, skills: [...(p.skills ?? []), skill] }))}
              onDeleted={(skillId) => setEmployee((p) => ({ ...p, skills: (p.skills ?? []).filter((s) => s.id !== skillId) }))}
            />
            <CertsPanel
              certs={employee.certifications ?? []}
              employeeId={id}
              canEdit={canEdit}
              onAdded={(cert) => setEmployee((p) => ({ ...p, certifications: [...(p.certifications ?? []), cert] }))}
              onDeleted={(certId) => setEmployee((p) => ({ ...p, certifications: (p.certifications ?? []).filter((c) => c.id !== certId) }))}
            />
          </div>
        </div>
      ),
    },
    {
      value: "private",
      label: "Private Info",
      icon: ShieldCheck,
      content: (
        <PrivateInfoTab
          employee={employee}
          canEdit={canEdit || user?.id === employee?.id}
          onSave={saveField}
        />
      ),
    },
    ...(canViewSalary ? [{
      value: "salary",
      label: "Salary Info",
      content: (
        <SalaryInfoTab
          employee={employee}
          canEdit={canEditSalary}
          onSaveField={saveField}
        />
      ),
    }] : []),
    {
      value: "security",
      label: "Security",
      content: (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground text-sm">
          Security settings (2FA, password reset) — coming soon.
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-up">
      {/* Back */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(ROUTES.EMPLOYEES)}
        className="gap-2 text-muted-foreground hover:text-foreground -ml-2"
      >
        <ArrowLeft size={15} /> Back to Employees
      </Button>

      {/* Profile header card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          {/* Avatar with edit overlay */}
          <div className="relative shrink-0 self-center sm:self-start">
            <Avatar src={employee.avatarUrl ?? undefined} initials={initials} size="xl" />
            {canEdit && (
              <>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 hover:opacity-100 transition-opacity"
                  title="Change avatar"
                >
                  <Pencil size={16} className="text-white" />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </>
            )}
          </div>

          {/* Name + quick fields */}
          <div className="flex-1 min-w-0 space-y-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{employee.name}</h1>
              <p className="text-sm text-muted-foreground">
                {employee.jobTitle || (ROLE_LABELS[employee.role] ?? employee.role)}
              </p>
              <span className="mt-1 inline-block rounded-full border border-border bg-muted px-3 py-0.5 text-xs text-muted-foreground font-mono">
                {employee.loginId}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail size={14} className="shrink-0" />
                <span className="truncate">{employee.email}</span>
              </div>
              {employee.mobile && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone size={14} className="shrink-0" />
                  <span>{employee.mobile}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right meta */}
          <div className="shrink-0 space-y-2 text-sm sm:text-right">
            <div className="flex items-center gap-2 text-muted-foreground sm:justify-end">
              <Building2 size={14} className="shrink-0" />
              <span>{employee.companyName}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground sm:justify-end">
              <span className="text-xs">Dept:</span>
              <span className="text-xs">{ROLE_LABELS[employee.role] ?? employee.role}</span>
            </div>
            {employee.managerName && (
              <div className="flex items-center gap-2 text-muted-foreground sm:justify-end">
                <span className="text-xs">Manager:</span>
                <span className="text-xs">{employee.managerName}</span>
              </div>
            )}
            {employee.location && (
              <div className="flex items-center gap-2 text-muted-foreground sm:justify-end">
                <MapPin size={14} className="shrink-0" />
                <span>{employee.location}</span>
              </div>
            )}
            {joiningDate && (
              <p className="text-xs text-muted-foreground">Joined {joiningDate}</p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} defaultValue="resume" />
    </div>
  );
}
