import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthField } from "@/components/auth/AuthField";
import { Lock, Hash, ShieldAlert, ArrowRight, AlertCircle, CheckCircle } from "lucide-react";
import { AUTH_FEATURES } from "@/constants/authFeatures";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/lib/api";
import { getPasswordHints } from "@/lib/validators";
import { cn } from "@/lib/utils";

const INITIAL = { tempPassword: "", newPassword: "", confirmPassword: "" };

export default function ResetTempPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const loginId = searchParams.get("loginId") ?? "";

  const { login } = useAuth();
  const { toast } = useToast();

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
    if (!loginId)               errs.loginId      = "Login ID is missing — use the link from your email";
    if (!fields.tempPassword)   errs.tempPassword  = "Temporary password is required";
    if (!fields.newPassword)    errs.newPassword   = "New password is required";
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
      // Step 1: login with loginId + temp password to get a token
      const loginRes = await api.post("/auth/login", {
        loginIdOrEmail: loginId,
        password: fields.tempPassword,
      });
      const { accessToken, refreshToken } = loginRes.data;

      // Step 2: change password using that token
      const changeRes = await fetch(`${import.meta.env.VITE_API_URL ?? "http://localhost:8000/api"}/auth/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          oldPassword: fields.tempPassword,
          newPassword: fields.newPassword,
        }),
      });
      const changeData = await changeRes.json();
      if (!changeRes.ok || !changeData.success) {
        throw new Error(changeData.message || "Failed to change password");
      }

      // Step 3: store new tokens + redirect
      login(changeData.data.user, changeData.data.accessToken, changeData.data.refreshToken);
      toast({
        title: "Password set successfully",
        description: "Welcome to EmPay HRMS. You're now logged in.",
        variant: "success",
      });
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch (err) {
      setServerError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Set your password"
      subtitle="Use the temporary password from your email to activate your account."
      features={AUTH_FEATURES}
    >
      <div className="mx-auto w-full max-w-md space-y-7">
        <header className="animate-fade-up space-y-2">
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
            <ShieldAlert size={16} className="shrink-0 text-amber-400" />
            <p className="text-sm text-amber-300">
              Enter your temporary password from the email to set a new one.
            </p>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Reset password
          </h2>
          <p className="text-sm text-white/40">
            For employees — use the link sent to your email
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
            id="loginId"
            name="loginId"
            type="text"
            label="Login ID"
            icon={Hash}
            value={loginId}
            readOnly
            error={errors.loginId}
            animationClass="animate-fade-up delay-0"
          />

          <AuthField
            id="tempPassword"
            name="tempPassword"
            type="password"
            label="Old Password"
            placeholder="Temporary password from email"
            icon={Lock}
            required
            value={fields.tempPassword}
            onChange={set("tempPassword")}
            error={errors.tempPassword}
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
            {loading ? "Setting password…" : "Reset password"}
            {!loading && <ArrowRight size={16} className="ml-2" />}
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
