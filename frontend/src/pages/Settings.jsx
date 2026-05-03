import { useState, useRef } from "react";
import { User, Bell, Sun, Moon, Users, Building2, Pencil } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Avatar } from "@/components/common/Avatar";
import { Tabs } from "@/components/common/Tabs";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useTheme } from "@/hooks/useTheme";
import { useFetch } from "@/hooks/useFetch";
import { api } from "@/lib/api";
import { ROLE_LABELS, USER_ROLES } from "@/constants/roles";
import { cn } from "@/lib/utils";

// ─── Profile Tab ──────────────────────────────────────────────────────────────

function ProfileTab({ user, updateUser }) {
  const { toast } = useToast();
  const fileRef   = useRef(null);

  const [form, setForm]         = useState({
    firstName: user?.firstName ?? "",
    lastName:  user?.lastName  ?? "",
    email:     user?.email     ?? "",
    mobile:    user?.mobile    ?? "",
    location:  user?.location  ?? "",
  });
  const [saved,      setSaved]      = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [avatarUrl,  setAvatarUrl]  = useState(user?.avatarUrl ?? null);

  const initials = [form.firstName?.[0], form.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "U";

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please select an image file", variant: "error" }); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image must be smaller than 5 MB", variant: "error" }); return;
    }
    const fd = new FormData();
    fd.append("avatar", file);
    setUploading(true);
    try {
      const res = await api.patch(`/employees/${user.id}/avatar`, fd);
      const url = res.data.employee.avatarUrl;
      setAvatarUrl(url);
      updateUser({ avatarUrl: url });
      toast({ title: "Profile picture updated", variant: "success" });
    } catch (err) {
      toast({ title: err.message || "Upload failed", variant: "error" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    try {
      const res = await api.put(`/employees/${user.id}`, {
        firstName: form.firstName.trim(),
        lastName:  form.lastName.trim(),
        mobile:    form.mobile.trim()   || null,
        location:  form.location.trim() || null,
      });
      updateUser(res.data.employee);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      toast({ title: err.message || "Failed to save", variant: "error" });
    }
  }

  return (
    <form onSubmit={handleSave} className="max-w-2xl mx-auto space-y-6">
      {/* Avatar + name banner */}
      <div className="flex items-center gap-5 rounded-xl border border-border bg-muted/20 px-5 py-4">
        <div className="relative shrink-0">
          <Avatar src={avatarUrl ?? undefined} initials={initials} size="xl" />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60">
              <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
            </div>
          )}
          {!uploading && (
            <>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 hover:opacity-100 transition-opacity"
                title="Change profile picture"
              >
                <Pencil size={16} className="text-white" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </>
          )}
        </div>
        <div>
          <p className="text-base font-semibold text-foreground">
            {[form.firstName, form.lastName].filter(Boolean).join(" ") || "Your Name"}
          </p>
          <p className="text-sm text-muted-foreground">{form.email}</p>
        </div>
      </div>

      {/* Form fields */}
      <div className="rounded-xl border border-border bg-card px-5 py-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Personal Information</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { key: "firstName", label: "First Name", type: "text",  placeholder: "Jane",            colSpan: false },
            { key: "lastName",  label: "Last Name",  type: "text",  placeholder: "Smith",           colSpan: false },
            { key: "email",     label: "Email",      type: "email", placeholder: "jane@acme.com",   readOnly: true, colSpan: true },
            { key: "mobile",    label: "Mobile",     type: "tel",   placeholder: "+91 98765 43210", colSpan: false },
            { key: "location",  label: "Location",   type: "text",  placeholder: "Mumbai, India",   colSpan: false },
          ].map(({ key, label, type, placeholder, readOnly, colSpan }) => (
            <div key={key} className={cn("grid gap-1.5", colSpan && "col-span-2")}>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</label>
              <input
                type={type}
                value={form[key]}
                onChange={(e) => !readOnly && setForm((f) => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                readOnly={readOnly}
                className={cn(
                  "h-10 w-full rounded-lg border border-border bg-muted/30 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring",
                  readOnly && "cursor-not-allowed opacity-60"
                )}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" size="sm">
          {saved ? "Saved!" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}

// ─── Preferences Tab ──────────────────────────────────────────────────────────

function PreferencesTab() {
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState({ email: true, slack: false });

  const themes = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark",  label: "Dark",  icon: Moon },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="rounded-xl border border-border bg-card px-5 py-5 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Appearance</h3>
        <div className="flex gap-3">
          {themes.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => { if (theme !== value) toggleTheme(); }}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all",
                theme === value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-muted/30 text-muted-foreground hover:bg-muted"
              )}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card px-5 py-5 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
        <div className="space-y-3">
          {[
            { key: "email", label: "Email Notifications", desc: "Receive updates via email" },
            { key: "slack", label: "Slack Notifications", desc: "Receive updates in Slack" },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={notifications[key]}
                onClick={() => setNotifications((n) => ({ ...n, [key]: !n[key] }))}
                className={cn(
                  "relative h-5 w-9 rounded-full transition-colors",
                  notifications[key] ? "bg-primary" : "bg-muted-foreground/30"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                    notifications[key] ? "translate-x-4" : "translate-x-0.5"
                  )}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}



// ─── User Settings Tab (Admin only) ───────────────────────────────────────────

const ASSIGNABLE_ROLES = [
  USER_ROLES.EMPLOYEE,
  USER_ROLES.HR_OFFICER,
  USER_ROLES.PAYROLL_OFFICER,
  USER_ROLES.ADMIN,
];

function UserSettingTab({ currentUserId }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(null); // id of the row being saved

  const { data, loading, error, refetch } = useFetch(() => api.get("/employees"), []);
  const employees = data?.employees ?? [];

  async function handleRoleChange(employeeId, newRole) {
    if (employeeId === currentUserId) {
      toast({ title: "Cannot change your own role", variant: "error" });
      return;
    }
    setSaving(employeeId);
    try {
      await api.put(`/employees/${employeeId}`, { role: newRole });
      toast({ title: "Role updated", description: `Role changed to ${ROLE_LABELS[newRole]}.`, variant: "success" });
      refetch();
    } catch (err) {
      toast({ title: "Failed to update role", description: err.message, variant: "error" });
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-2 max-w-4xl mx-auto">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-muted/40 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-destructive">Failed to load employees.</p>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <p className="text-sm text-muted-foreground">
        Assign roles to control what each employee can access. Changes take effect on their next login.
      </p>

      <div className="rounded-xl border border-border overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_140px_1fr_180px] gap-4 px-4 py-2.5 bg-muted/40 border-b border-border">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">User Name</span>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Login ID</span>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email</span>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Role</span>
        </div>

        {/* Rows */}
        {employees.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">No employees found.</div>
        ) : (
          employees.map((emp) => {
            const isSelf    = emp.id === currentUserId;
            const isSaving  = saving === emp.id;
            const fullName  = [emp.firstName, emp.lastName].filter(Boolean).join(" ") || emp.name;

            return (
              <div
                key={emp.id}
                className="grid grid-cols-[1fr_140px_1fr_180px] gap-4 items-center px-4 py-3 border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
              >
                {/* Name */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                    {fullName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-foreground truncate">{fullName}</span>
                  {isSelf && (
                    <span className="text-[10px] text-muted-foreground border border-border rounded px-1 shrink-0">You</span>
                  )}
                </div>

                {/* Login ID */}
                <span className="text-xs font-mono text-muted-foreground truncate">{emp.loginId}</span>

                {/* Email */}
                <span className="text-sm text-muted-foreground truncate">{emp.email}</span>

                {/* Role dropdown */}
                <div className="relative">
                  <select
                    value={emp.role}
                    disabled={isSelf || isSaving}
                    onChange={(e) => handleRoleChange(emp.id, e.target.value)}
                    className={cn(
                      "w-full h-8 rounded-md border border-border bg-card px-2.5 pr-7 text-xs font-medium text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-ring transition-colors",
                      (isSelf || isSaving) && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {ASSIGNABLE_ROLES.map((r) => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {isSaving ? (
                      <span className="block h-3 w-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    ) : (
                      <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                        <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Company Tab (Admin only) ─────────────────────────────────────────────────

function parseTime(t) {
  const [h, m] = t.split(":").map(Number);
  return h + m / 60;
}

function fmtComputedHours(start, end) {
  const diff = parseTime(end) - parseTime(start);
  if (diff <= 0) return null;
  const h = Math.floor(diff);
  const m = Math.round((diff % 1) * 60);
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function CompanyTab() {
  const { toast, } = useToast();
  const { updateUser } = useAuth();
  const logoRef = useRef(null);

  const [saving,        setSaving]        = useState(false);
  const [seeded,        setSeeded]        = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);

  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime]     = useState("17:00");

  const { data, loading, refetch } = useFetch(() => api.get("/company/settings"), []);
  const company = data?.company;

  // Seed inputs once data arrives
  if (company && !seeded) {
    setStartTime(company.workStartTime ?? "09:00");
    setEndTime(company.workEndTime     ?? "17:00");
    setSeeded(true);
  }

  const computedLabel = fmtComputedHours(startTime, endTime);
  const isInvalid     = !computedLabel;

  async function handleLogoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please select an image file", variant: "error" }); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image must be smaller than 5 MB", variant: "error" }); return;
    }
    const fd = new FormData();
    fd.append("logo", file);
    setLogoUploading(true);
    try {
      const res = await api.patch("/company/logo", fd);
      updateUser({ companyLogoUrl: res.data.company.logoUrl });
      toast({ title: "Company logo updated", variant: "success" });
      refetch();
    } catch (err) {
      toast({ title: err.message || "Upload failed", variant: "error" });
    } finally {
      setLogoUploading(false);
      if (logoRef.current) logoRef.current.value = "";
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    if (isInvalid) {
      toast({ title: "Invalid times", description: "End time must be after start time.", variant: "error" });
      return;
    }
    setSaving(true);
    try {
      await api.put("/company/settings", { workStartTime: startTime, workEndTime: endTime });
      toast({ title: "Settings saved", description: `Work hours set to ${startTime} – ${endTime} (${computedLabel}).`, variant: "success" });
      refetch();
    } catch (err) {
      toast({ title: "Failed to save", description: err.message, variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-3">
        {[...Array(3)].map((_, i) => <div key={i} className="h-10 rounded-lg bg-muted/40 animate-pulse" />)}
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="max-w-2xl mx-auto space-y-6">
      {/* Company info + logo */}
      <div className="rounded-xl border border-border bg-muted/20 px-4 py-4 space-y-4">
        {/* Logo uploader */}
        <div className="flex items-center gap-4">
          <div className="relative h-14 w-14 shrink-0 rounded-xl overflow-hidden border border-border bg-card">
            {company?.logoUrl ? (
              <img src={company.logoUrl} alt="Company logo" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center bg-gradient-to-br from-primary to-secondary text-xl font-bold text-white">
                {company?.code?.slice(0, 1) ?? "E"}
              </div>
            )}
            {logoUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl">
                <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">{company?.name ?? "—"}</p>
            <p className="text-xs text-muted-foreground font-mono">{company?.code ?? "—"}</p>
            <button
              type="button"
              onClick={() => logoRef.current?.click()}
              disabled={logoUploading}
              className="mt-1.5 text-xs text-primary hover:underline disabled:opacity-50"
            >
              {logoUploading ? "Uploading…" : "Change logo"}
            </button>
            <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
          </div>
        </div>
      </div>

      {/* Attendance configuration */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Attendance Configuration</h3>
        <div className="rounded-xl border border-border bg-card px-4 py-4 space-y-5">

          {/* Start + End time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <label htmlFor="startTime" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Work Start Time
              </label>
              <input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="h-10 rounded-lg border border-border bg-muted/30 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="endTime" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Work End Time
              </label>
              <input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="h-10 rounded-lg border border-border bg-muted/30 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Auto-computed standard hours */}
          <div className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Standard Working Hours</p>
              <p className="text-xs text-muted-foreground">Auto-computed from start and end time</p>
            </div>
            <span className={cn(
              "text-lg font-bold",
              isInvalid ? "text-destructive" : "text-primary"
            )}>
              {isInvalid ? "—" : computedLabel}
            </span>
          </div>

          <p className="text-xs text-muted-foreground">
            Any check-out beyond the end time counts as extra hours and is recorded on the attendance record.
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={saving || isInvalid}>
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Settings() {
  const { user, updateUser } = useAuth();
  const isAdmin = user?.role === USER_ROLES.ADMIN;

  const tabs = [
    { value: "profile",      label: "Profile",      icon: User,   content: <ProfileTab user={user} updateUser={updateUser} /> },
    { value: "preferences",  label: "Preferences",  icon: Bell,   content: <PreferencesTab /> },
    ...(isAdmin
      ? [
          { value: "users",   label: "User Settings", icon: Users,     labelClass: "text-[15px]", content: <UserSettingTab currentUserId={user?.id} /> },
          { value: "company", label: "Company",        icon: Building2, content: <CompanyTab /> },
        ]
      : []),
  ];

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader title="Settings" breadcrumbs={[{ label: "Settings" }]} />
      <div className="rounded-xl border border-border bg-card p-6">
        <Tabs tabs={tabs} defaultValue="profile" />
      </div>
    </div>
  );
}
