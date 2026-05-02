import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthField } from "@/components/auth/AuthField";
import { Lock, ShieldAlert, ArrowRight, AlertCircle, CheckCircle } from "lucide-react";
import { AUTH_FEATURES } from "@/constants/authFeatures";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { getPasswordHints } from "@/lib/validators";
import { cn } from "@/lib/utils";

const INITIAL = { oldPassword: "", newPassword: "", confirmPassword: "" };

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [fields, setFields]           = useState(INITIAL);
  const [errors, setErrors]           = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading]         = useState(false);

  const passwordHints = getPasswordHints(fields.newPassword);

  function set(key) {
    return (e) => {
      setFields((prev) => ({ ...prev, [key]: e.target.value }));
      if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
      if (serverError) setServerError("");
    };
  }

  function validate() {
    const errs = {};
    if (!fields.oldPassword)    errs.oldPassword    = "Current password is required";
    if (!fields.newPassword)    errs.newPassword    = "New password is required";
    else if (!passwordHints.every((h) => h.valid))
      errs.newPassword = "Password does not meet all requirements";
    if (!fields.confirmPassword) errs.confirmPassword = "Please confirm your new password";
    else if (fields.confirmPassword !== fields.newPassword)
      errs.confirmPassword = "Passwords do not match";
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setServerError("");
    try {
      const res = await api.put("/auth/change-password", {
        oldPassword: fields.oldPassword,
        newPassword: fields.newPassword,
      });
      login(res.data.user, res.data.accessToken, res.data.refreshToken);
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch (err) {
      if (err.errors?.length) {
        const mapped = {};
        err.errors.forEach(({ path, msg }) => { if (path) mapped[path] = msg; });
        setErrors(mapped);
      } else {
        setServerError(err.message || "Failed to change password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Secure your account"
      subtitle="You must set a new password before you can access EmPay HRMS."
      features={AUTH_FEATURES}
    >
      <div className="mx-auto w-full max-w-md space-y-7">
        <header className="animate-fade-up space-y-2">
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
            <ShieldAlert size={16} className="shrink-0 text-amber-400" />
            <p className="text-sm text-amber-300">
              You must change your password before continuing.
            </p>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Change password
          </h2>
          <p className="text-sm text-white/40">
            Enter your temporary password and choose a new one
          </p>
        </header>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {serverError && (
            <div
              role="alert"
              className="animate-fade-up flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              <AlertCircle size={15} className="shrink-0" />
              {serverError}
            </div>
          )}

          <AuthField
            id="oldPassword"
            name="oldPassword"
            type="password"
            label="Current Password"
            placeholder="Your temporary password"
            icon={Lock}
            required
            value={fields.oldPassword}
            onChange={set("oldPassword")}
            error={errors.oldPassword}
            animationClass="animate-fade-up delay-1"
          />

          <AuthField
            id="newPassword"
            name="newPassword"
            type="password"
            label="New Password"
            placeholder="Strong@123"
            icon={Lock}
            required
            value={fields.newPassword}
            onChange={set("newPassword")}
            error={errors.newPassword}
            animationClass="animate-fade-up delay-2"
          />

          {/* Live password hints */}
          {fields.newPassword.length > 0 && (
            <div className="animate-fade-up delay-2 flex flex-wrap gap-2">
              {passwordHints.map((hint) => (
                <span
                  key={hint.label}
                  className={cn(
                    "flex items-center gap-1 rounded-md border px-2.5 py-1 text-[0.65rem] font-medium transition-colors",
                    hint.valid
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "border-white/[0.06] bg-white/[0.03] text-white/30"
                  )}
                >
                  {hint.valid ? <CheckCircle size={10} /> : null}
                  {hint.label}
                </span>
              ))}
            </div>
          )}

          <AuthField
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            label="Confirm New Password"
            placeholder="Repeat new password"
            icon={Lock}
            required
            value={fields.confirmPassword}
            onChange={set("confirmPassword")}
            error={errors.confirmPassword}
            animationClass="animate-fade-up delay-3"
          />

          <Button
            type="submit"
            disabled={loading}
            className="btn-shimmer animate-fade-up delay-4 h-11 w-full cursor-pointer rounded-xl bg-gradient-to-r from-primary to-secondary text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 hover:brightness-110 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Updating password…" : "Set new password"}
            {!loading && <ArrowRight size={16} className="ml-2" />}
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
