import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  ArrowLeft, Pencil, Plus, X, Building2, MapPin,
  Mail, Phone, FileText, Star, Award, ShieldCheck,
  Lock, Eye, EyeOff, CheckCircle, AlertCircle, RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/common/Avatar";
import { Tabs } from "@/components/common/Tabs";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { ROLE_LABELS, MANAGER_ROLES, PAYROLL_ROLES, USER_ROLES } from "@/constants/roles";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { getPasswordHints } from "@/lib/validators";

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

// ── Field validators ────────────────────────────────────────────────────────
const FIELD_VALIDATORS = {
  bankAccountNumber: (v) => {
    const clean = v.replace(/\s/g, ""); // strip any spaces
    if (!clean) return null;
    if (!/^\d+$/.test(clean))  return "Account number must contain digits only";
    if (clean.length < 6)      return "Account number must be at least 6 digits";
    if (clean.length > 18)     return "Account number cannot exceed 18 digits";
    return null;
  },
  ifscCode: (v) => {
    // Normalise: uppercase, strip spaces, treat letter-O as digit-0 at position 4
    const raw = v.replace(/\s/g, "").toUpperCase();
    const clean = raw.slice(0, 4) + raw.slice(4).replace(/^O/, "0"); // O→0 at pos 4
    if (!clean) return null;
    if (clean.length !== 11)           return "IFSC must be exactly 11 characters";
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(clean))
      return "Invalid IFSC — format: 4 letters + 0 + 6 alphanumeric (e.g. HDFC0001234)";
    return null;
  },
  panNumber: (v) => {
    const clean = v.replace(/\s/g, "").toUpperCase();
    if (!clean) return null;
    if (clean.length !== 10)           return "PAN must be exactly 10 characters";
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(clean))
      return "Invalid PAN — format: 5 letters + 4 digits + 1 letter (e.g. ABCDE1234F)";
    return null;
  },
  uanNumber: (v) => {
    const clean = v.replace(/\s/g, "");
    if (!clean) return null;
    if (!/^\d{12}$/.test(clean)) return "UAN must be exactly 12 digits";
    return null;
  },
};

// ── Private Info field ────────────────────────────────────────────────────────
function PrivateField({ label, value, field, canEdit, onSave, type = "text", digitsOnly = false, uppercase = false }) {
  const [editing, setEditing]   = useState(false);
  const [draft, setDraft]       = useState(value ?? "");
  const [fieldErr, setFieldErr] = useState("");

  useEffect(() => { setDraft(value ?? ""); setFieldErr(""); }, [value]);

  function handleChange(e) {
    let val = e.target.value;
    if (digitsOnly) val = val.replace(/\D/g, "");         // strip non-digits live
    if (uppercase)  val = val.toUpperCase();               // auto-uppercase
    setDraft(val);
    if (fieldErr) setFieldErr("");
  }

  async function handleBlur() {
    setEditing(false);
    let trimmed = draft.trim();
    // Normalise before validating: strip internal spaces, uppercase for text codes
    if (uppercase) trimmed = trimmed.replace(/\s/g, "").toUpperCase();
    const validator = FIELD_VALIDATORS[field];
    if (validator) {
      const err = validator(trimmed);
      if (err) { setFieldErr(err); return; }
    }
    setFieldErr("");
    if (trimmed !== (value ?? "")) await onSave(field, trimmed || null);
  }

  return (
    <div className="py-2.5 border-b border-border last:border-0">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground shrink-0 w-36">{label}</p>
        {canEdit && editing ? (
          <input
            autoFocus
            type={type}
            inputMode={digitsOnly ? "numeric" : undefined}
            value={draft}
            onChange={handleChange}
            onBlur={handleBlur}
            className={cn(
              "flex-1 h-7 rounded-lg border bg-muted/50 px-2 text-sm text-foreground focus:outline-none focus:ring-2 transition-colors",
              fieldErr ? "border-destructive focus:ring-destructive/40" : "border-border focus:ring-ring"
            )}
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
      {fieldErr && <p className="mt-1 text-[11px] text-destructive text-right">{fieldErr}</p>}
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
        <PrivateField label="Account Number" value={employee.bankAccountNumber} field="bankAccountNumber" canEdit={canEdit} onSave={onSave} digitsOnly />
        <PrivateField label="Bank Name"      value={employee.bankName}          field="bankName"          canEdit={canEdit} onSave={onSave} />
        <PrivateField label="IFSC Code"      value={employee.ifscCode}          field="ifscCode"          canEdit={canEdit} onSave={onSave} uppercase />
        <PrivateField label="PAN No"         value={employee.panNumber}         field="panNumber"         canEdit={canEdit} onSave={onSave} uppercase />
        <PrivateField label="UAN No"         value={employee.uanNumber}         field="uanNumber"         canEdit={canEdit} onSave={onSave} digitsOnly />
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
  // monthlyWage is the source of truth; if null but basicSalary is set in DB,
  // derive it back (basicSalary = monthlyWage × 0.5  ⟹  monthlyWage = basicSalary × 2)
  const wage  = employee.monthlyWage != null
    ? employee.monthlyWage
    : (employee.basicSalary != null ? employee.basicSalary * 2 : 0);
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
    if (!isNaN(parsed) && parsed > 0 && parsed !== value) await onSave(field, parsed);
    else setDraft(value ?? ""); // reset if invalid
  }

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {canEdit && editing ? (
        <input
          autoFocus
          type="number"
          min="1"
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

// ── Password field with show/hide toggle ─────────────────────────────────────
function PwField({ id, label, value, onChange, error, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
        <Lock size={12} /> {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={cn(
            "h-10 w-full rounded-lg border bg-muted/30 px-3 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors",
            error ? "border-destructive focus:ring-destructive/40" : "border-border"
          )}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ── Security tab ─────────────────────────────────────────────────────────────
function SecurityTab({ employeeId, employeeEmail, employeeLoginId, isOwnProfile, canReset }) {
  const { login, user } = useAuth();
  const { toast }       = useToast();

  const [showForm, setShowForm]   = useState(false);
  const [fields, setFields]       = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [errors, setErrors]       = useState({});
  const [saving, setSaving]       = useState(false);
  const [serverErr, setServerErr] = useState("");
  const [resetting, setResetting] = useState(false);
  const [sent, setSent]           = useState(false);

  const hints = getPasswordHints(fields.newPassword);

  function set(key) {
    return (e) => {
      setFields((p) => ({ ...p, [key]: e.target.value }));
      setErrors((p) => ({ ...p, [key]: "" }));
      setServerErr("");
    };
  }

  function validate() {
    const errs = {};
    if (!fields.oldPassword)     errs.oldPassword    = "Current password is required";
    if (!fields.newPassword)     errs.newPassword    = "New password is required";
    else if (!hints.every((h) => h.valid)) errs.newPassword = "Password does not meet requirements";
    if (!fields.confirmPassword) errs.confirmPassword = "Please confirm your password";
    else if (fields.confirmPassword !== fields.newPassword) errs.confirmPassword = "Passwords do not match";
    return errs;
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      const res = await api.put("/auth/change-password", {
        oldPassword: fields.oldPassword,
        newPassword: fields.newPassword,
      });
      login(res.data.user, res.data.accessToken, res.data.refreshToken);
      toast({ title: "Password updated", description: "Confirmation sent to your email.", variant: "success" });
      setFields({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setShowForm(false);
    } catch (err) {
      if (err.errors?.length) {
        const mapped = {};
        err.errors.forEach(({ path, msg }) => { if (path) mapped[path] = msg; });
        setErrors(mapped);
      } else {
        setServerErr(err.message || "Failed to update password");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleSendMail() {
    setResetting(true);
    try {
      await api.post(`/employees/${employeeId}/reset-password`, {});
      setSent(true);
      toast({ title: "Email sent", description: `New credentials sent to ${employeeEmail}.`, variant: "success" });
    } catch (err) {
      toast({ title: err.message || "Failed to send email", variant: "error" });
    } finally {
      setResetting(false);
    }
  }

  // ── Admin/HR viewing another employee → credential table + send mail ─────────
  if (!isOwnProfile && canReset) {
    return (
      <div className="space-y-4 max-w-xl">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2.5">
            <ShieldCheck size={18} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Password Management</p>
            <p className="text-xs text-muted-foreground">
              The password change mechanism is different for administrators and regular users.
              Employees receive credentials via email.
            </p>
          </div>
        </div>

        {/* Credential row table */}
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="grid grid-cols-[1fr_1fr_120px_110px] bg-muted/40 border-b border-border">
            {["Email", "Login ID", "Password", ""].map((h) => (
              <div key={h} className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</div>
            ))}
          </div>
          <div className="grid grid-cols-[1fr_1fr_120px_110px] items-center">
            <div className="px-4 py-3 text-sm text-foreground truncate">{employeeEmail}</div>
            <div className="px-4 py-3 text-sm font-mono text-foreground">{employeeLoginId}</div>
            <div className="px-4 py-3 text-sm tracking-widest text-muted-foreground">••••••••</div>
            <div className="px-4 py-3">
              <button
                onClick={handleSendMail}
                disabled={resetting || sent}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
                  sent
                    ? "bg-green-500/10 text-green-600 border border-green-500/20"
                    : "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
                )}
              >
                {sent ? (
                  <><CheckCircle size={12} /> Sent</>
                ) : resetting ? (
                  "Sending…"
                ) : (
                  <>Send Mail →</>
                )}
              </button>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground px-1">
          Clicking <strong>"Send Mail →"</strong> generates a new temporary password and emails it to the employee.
          They will be required to change it on next login.
        </p>
      </div>
    );
  }

  // ── Own profile → button first, then form ────────────────────────────────────
  if (isOwnProfile) {
    return (
      <div className="max-w-md space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2.5">
            <ShieldCheck size={18} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Password Management</p>
            <p className="text-xs text-muted-foreground">Update your login password. A confirmation will be sent to your email.</p>
          </div>
        </div>

        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted/40 transition-colors"
          >
            <Lock size={14} /> Change Password
          </button>
        ) : (
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            {serverErr && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <AlertCircle size={14} /> {serverErr}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              {/* Login ID — read-only, auto-populated */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Login ID</label>
                <input
                  readOnly
                  value={user?.loginId ?? ""}
                  className="h-10 w-full rounded-lg border border-border bg-muted/50 px-3 text-sm text-muted-foreground cursor-default select-all"
                />
              </div>

              <PwField
                id="oldPw" label="Old Password" placeholder="Your current password"
                value={fields.oldPassword} onChange={set("oldPassword")} error={errors.oldPassword}
              />

              <PwField
                id="newPw" label="New Password" placeholder="Strong@123"
                value={fields.newPassword} onChange={set("newPassword")} error={errors.newPassword}
              />

              {fields.newPassword.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {hints.map((h) => (
                    <span key={h.label} className={cn(
                      "flex items-center gap-1 rounded-md border px-2 py-0.5 text-[0.65rem] font-medium transition-colors",
                      h.valid
                        ? "border-green-500/30 bg-green-500/10 text-green-500"
                        : "border-border bg-muted/30 text-muted-foreground"
                    )}>
                      {h.valid && <CheckCircle size={9} />} {h.label}
                    </span>
                  ))}
                </div>
              )}

              <PwField
                id="confirmPw" label="Confirm Password" placeholder="Repeat new password"
                value={fields.confirmPassword} onChange={set("confirmPassword")} error={errors.confirmPassword}
              />

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setFields({ oldPassword: "", newPassword: "", confirmPassword: "" }); setErrors({}); setServerErr(""); }}
                  className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {saving ? "Updating…" : "Reset Password"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  return null;
}

// ── Edit Profile Modal ────────────────────────────────────────────────────────

function EditProfileModal({ employee, onClose, onSaved, currentUserId, isAdmin }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [managerOptions, setManagerOptions] = useState([]);

  const isManagerRole = MANAGER_ROLES.includes(
    employee?.role ?? "EMPLOYEE"
  );

  // Seed form from current employee values
  const [fields, setFields] = useState({
    firstName:   employee.firstName  ?? "",
    lastName:    employee.lastName   ?? "",
    jobTitle:    employee.jobTitle   ?? "",
    role:        employee.role       ?? "EMPLOYEE",
    joiningDate: employee.joiningDate
      ? new Date(employee.joiningDate).toISOString().split("T")[0]
      : "",
    managerId:   employee.managerId  ? String(employee.managerId) : "",
    mobile:      employee.mobile     ?? "",
    location:    employee.location   ?? "",
  });

  const [errors, setErrors] = useState({});

  // Load manager candidates — any employee in the company except self
  useEffect(() => {
    api.get("/employees")
      .then((res) => setManagerOptions(
        (res.data.employees ?? []).filter((e) => e.id !== employee.id)
      ))
      .catch(() => {});
  }, [employee.id]);

  function set(key) {
    return (e) => {
      const val = e.target.value;
      setFields((p) => ({
        ...p,
        [key]: val,
        // Clear managerId when role changes away from EMPLOYEE
        ...(key === "role" && val !== "EMPLOYEE" ? { managerId: "" } : {}),
      }));
      if (errors[key]) setErrors((p) => ({ ...p, [key]: "" }));
    };
  }

  function validate() {
    const errs = {};
    if (!fields.firstName.trim()) errs.firstName = "Required";
    if (!fields.lastName.trim())  errs.lastName  = "Required";
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      const payload = {
        firstName:   fields.firstName.trim(),
        lastName:    fields.lastName.trim(),
        jobTitle:    fields.jobTitle.trim() || null,
        mobile:      fields.mobile.trim()   || null,
        location:    fields.location.trim() || null,
      };
      // Admin-only fields
      if (isAdmin) {
        payload.role        = fields.role;
        payload.joiningDate = fields.joiningDate || null;
        payload.managerId   = fields.managerId ? parseInt(fields.managerId) : null;
      }
      const res = await api.put(`/employees/${employee.id}`, payload);
      toast({ title: "Profile updated", variant: "success" });
      onSaved(res.data.employee);
      onClose();
    } catch (err) {
      toast({ title: err.message || "Failed to update", variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  const INPUT = "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-colors disabled:opacity-60";
  const SELECT = `${INPUT} cursor-pointer`;
  const LABEL = "block text-xs font-medium text-muted-foreground mb-1";

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg animate-fade-up rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold text-foreground">Edit Profile</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[80vh] px-6 py-5 space-y-4">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>First Name <span className="text-destructive">*</span></label>
              <input className={cn(INPUT, errors.firstName && "border-destructive")} value={fields.firstName} onChange={set("firstName")} />
              {errors.firstName && <p className="text-xs text-destructive mt-0.5">{errors.firstName}</p>}
            </div>
            <div>
              <label className={LABEL}>Last Name <span className="text-destructive">*</span></label>
              <input className={cn(INPUT, errors.lastName && "border-destructive")} value={fields.lastName} onChange={set("lastName")} />
              {errors.lastName && <p className="text-xs text-destructive mt-0.5">{errors.lastName}</p>}
            </div>
          </div>

          {/* Job Title */}
          <div>
            <label className={LABEL}>Job Title</label>
            <input className={INPUT} placeholder="e.g. Senior Engineer" value={fields.jobTitle} onChange={set("jobTitle")} />
          </div>

          {/* Mobile + Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Mobile</label>
              <input className={INPUT} placeholder="+91 9999999999" value={fields.mobile} onChange={set("mobile")} />
            </div>
            <div>
              <label className={LABEL}>Location</label>
              <input className={INPUT} placeholder="City, State" value={fields.location} onChange={set("location")} />
            </div>
          </div>

          {/* Admin-only fields */}
          {isAdmin && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Role</label>
                  <select className={SELECT} value={fields.role} onChange={set("role")}>
                    {Object.entries(USER_ROLES)
                      .filter(([k]) => k !== "SUPER_ADMIN")
                      .map(([k]) => (
                        <option key={k} value={k}>{k.replace(/_/g, " ")}</option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Joining Date</label>
                  <input type="date" className={INPUT} value={fields.joiningDate} max={new Date().toISOString().split("T")[0]} onChange={set("joiningDate")} />
                </div>
              </div>

              {fields.role === "EMPLOYEE" && (
                <div>
                  <label className={LABEL}>Manager</label>
                  <select className={SELECT} value={fields.managerId} onChange={set("managerId")}>
                    <option value="">None / No Manager</option>
                    {managerOptions.map((e) => (
                      <option key={e.id} value={String(e.id)}>
                        {[e.firstName, e.lastName].filter(Boolean).join(" ") || e.loginId}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-border pt-4 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded-lg border border-border px-4 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-9 rounded-lg bg-primary px-5 text-sm font-medium text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default function EmployeeDetail() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { user, updateUser } = useAuth();
  const { toast }    = useToast();
  const fileRef      = useRef(null);

  const [employee, setEmployee]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editOpen, setEditOpen]   = useState(false);

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
    // Validate: image only, max 5 MB
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please select an image file", variant: "error" }); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image must be smaller than 5 MB", variant: "error" }); return;
    }
    const form = new FormData();
    form.append("avatar", file);
    setUploading(true);
    try {
      const res = await api.patch(`/employees/${id}/avatar`, form);
      const updated = res.data.employee;
      setEmployee(updated);
      // Sync Topbar/AuthContext if this is the logged-in user's own avatar
      if (user?.id === updated.id) {
        updateUser({ avatarUrl: updated.avatarUrl });
      }
      toast({ title: "Avatar updated", variant: "success" });
    } catch (err) {
      toast({ title: err.message || "Upload failed", variant: "error" });
    } finally {
      setUploading(false);
      // Reset file input so the same file can be re-selected
      if (fileRef.current) fileRef.current.value = "";
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
    ...(user?.id === employee?.id ? [{
      value: "private",
      label: "Private Info",
      icon: ShieldCheck,
      content: (
        <PrivateInfoTab
          employee={employee}
          canEdit={true}
          onSave={saveField}
        />
      ),
    }] : []),
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
      icon: ShieldCheck,
      content: (
        <SecurityTab
          employeeId={employee.id}
          employeeEmail={employee.email}
          employeeLoginId={employee.loginId}
          isOwnProfile={user?.id === employee.id}
          canReset={MANAGER_ROLES.includes(user?.role)}
        />
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
        {/* Edit button */}
        {canEdit && (
          <div className="flex justify-end mb-3">
            <button
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Pencil size={12} /> Edit Profile
            </button>
          </div>
        )}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          {/* Avatar with edit overlay */}
          <div className="relative shrink-0 self-center sm:self-start">
            <Avatar src={employee.avatarUrl ?? undefined} initials={initials} size="xl" />
            {/* Uploading spinner overlay */}
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60">
                <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              </div>
            )}
            {canEdit && !uploading && (
              <>
                <button
                  onClick={() => fileRef.current?.click()}
                  className={cn(
                    "absolute inset-0 flex items-center justify-center rounded-full bg-black/50 transition-opacity",
                    user?.id === employee?.id ? "opacity-100" : "opacity-0 hover:opacity-100"
                  )}
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

      {/* Edit Profile Modal */}
      {editOpen && employee && (
        <EditProfileModal
          employee={employee}
          onClose={() => setEditOpen(false)}
          onSaved={(updated) => setEmployee(updated)}
          currentUserId={user?.id}
          isAdmin={(user?.role === "ADMIN" || user?.role === "HR_OFFICER") && user?.id !== employee?.id}
        />
      )}
    </div>
  );
}
