import { useState } from "react";
import { User, Bell, Shield, Sun, Moon, Monitor } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Avatar } from "@/components/common/Avatar";
import { Tabs } from "@/components/common/Tabs";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { getInitials } from "@/lib/formatters";
import { cn } from "@/lib/utils";

function ProfileTab({ user, updateUser }) {
  const [form, setForm] = useState({
    name:    user?.name    ?? "",
    email:   user?.email   ?? "",
    phone:   user?.phone   ?? "",
    company: user?.company ?? "",
    title:   user?.title   ?? "",
  });
  const [saved, setSaved] = useState(false);

  function handleSave(e) {
    e.preventDefault();
    updateUser(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <form onSubmit={handleSave} className="space-y-5 max-w-lg">
      <div className="flex items-center gap-4">
        <Avatar initials={getInitials(form.name || "U")} size="xl" />
        <div>
          <p className="text-sm font-semibold text-foreground">{form.name || "Your Name"}</p>
          <p className="text-xs text-muted-foreground">{form.email}</p>
        </div>
      </div>

      {[
        { key: "name",    label: "Full Name",    type: "text",  placeholder: "Jane Smith" },
        { key: "email",   label: "Email",        type: "email", placeholder: "jane@acme.com", readOnly: true },
        { key: "phone",   label: "Phone",        type: "tel",   placeholder: "+1 555-0100" },
        { key: "company", label: "Company",      type: "text",  placeholder: "Acme Corp" },
        { key: "title",   label: "Job Title",    type: "text",  placeholder: "VP of Operations" },
      ].map(({ key, label, type, placeholder, readOnly }) => (
        <div key={key} className="grid gap-1.5">
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

      <div className="flex gap-2 pt-2">
        <Button type="submit" size="sm">
          {saved ? "Saved!" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}

function PreferencesTab() {
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState({ email: true, slack: false });

  const themes = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark",  label: "Dark",  icon: Moon },
  ];

  return (
    <div className="space-y-6 max-w-lg">
      {/* Theme */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Appearance</h3>
        <div className="flex gap-2">
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

      {/* Notifications */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Notifications</h3>
        <div className="space-y-3">
          {[
            { key: "email", label: "Email Notifications", desc: "Receive updates via email" },
            { key: "slack", label: "Slack Notifications", desc: "Receive updates in Slack" },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
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

function SecurityTab() {
  return (
    <div className="space-y-4 max-w-lg">
      <div className="rounded-xl border border-border bg-card px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Password</p>
            <p className="text-xs text-muted-foreground">Last changed 30 days ago</p>
          </div>
          <Button variant="outline" size="sm">Change Password</Button>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Two-Factor Authentication</p>
            <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
          </div>
          <Button variant="outline" size="sm">Enable 2FA</Button>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card px-4 py-4">
        <p className="text-sm font-medium text-foreground mb-2">Active Sessions</p>
        <div className="space-y-2 text-xs text-muted-foreground">
          {[
            "Chrome on Mac — Last active 2 minutes ago (current)",
            "Firefox on Windows — Last active 3 days ago",
          ].map((s) => (
            <div key={s} className="flex items-center justify-between">
              <span>{s}</span>
              <button className="text-destructive hover:underline">Logout</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Settings() {
  const { user, updateUser } = useAuth();

  const tabs = [
    { value: "profile",     label: "Profile",     icon: User,    content: <ProfileTab user={user} updateUser={updateUser} /> },
    { value: "preferences", label: "Preferences", icon: Bell,    content: <PreferencesTab /> },
    { value: "security",    label: "Security",     icon: Shield,  content: <SecurityTab /> },
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
