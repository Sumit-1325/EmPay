import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthField } from "@/components/auth/AuthField";
import { User, Lock, ArrowRight, AlertCircle } from "lucide-react";
import { AUTH_FEATURES } from "@/constants/authFeatures";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

const INITIAL = { loginIdOrEmail: "", password: "" };

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [fields, setFields] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  function set(key) {
    return (e) => {
      setFields((prev) => ({ ...prev, [key]: e.target.value }));
      if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
      if (serverError) setServerError("");
    };
  }

  function validate() {
    const errs = {};
    if (!fields.loginIdOrEmail.trim()) errs.loginIdOrEmail = "Login ID or email is required";
    if (!fields.password)              errs.password        = "Password is required";
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setServerError("");
    try {
      const res = await api.post("/auth/login", {
        loginIdOrEmail: fields.loginIdOrEmail.trim(),
        password: fields.password,
      });
      login(res.data.user, res.data.accessToken, res.data.refreshToken);
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch (err) {
      if (err.errors?.length) {
        const mapped = {};
        err.errors.forEach(({ path, msg }) => { if (path) mapped[path] = msg; });
        setErrors(mapped);
      } else {
        setServerError(err.message || "Invalid credentials. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to manage your team's payroll, attendance, and leave requests."
      features={AUTH_FEATURES}
    >
      <div className="mx-auto w-full max-w-md space-y-7">
        <header className="animate-fade-up space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Sign in
          </h2>
          <p className="text-sm text-white/40">
            Enter your credentials to access your workspace
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
            id="loginIdOrEmail"
            name="loginIdOrEmail"
            label="Login ID or Email"
            placeholder="admin01 or admin@company.com"
            icon={User}
            required
            value={fields.loginIdOrEmail}
            onChange={set("loginIdOrEmail")}
            error={errors.loginIdOrEmail}
            animationClass="animate-fade-up delay-1"
          />

          <AuthField
            id="password"
            name="password"
            type="password"
            label="Password"
            placeholder="••••••••"
            icon={Lock}
            required
            value={fields.password}
            onChange={set("password")}
            error={errors.password}
            animationClass="animate-fade-up delay-2"
          />

          <Button
            type="submit"
            disabled={loading}
            className="btn-shimmer animate-fade-up delay-4 h-11 w-full cursor-pointer rounded-xl bg-gradient-to-r from-primary to-secondary text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 hover:brightness-110 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in…" : "Sign in to workspace"}
            {!loading && <ArrowRight size={16} className="ml-2" />}
          </Button>

          <div className="animate-fade-up delay-5 flex items-center gap-4">
            <Separator className="flex-1 bg-white/[0.06]" />
            <span className="text-[0.65rem] font-medium tracking-wider text-white/20 uppercase">or</span>
            <Separator className="flex-1 bg-white/[0.06]" />
          </div>

          <p className="animate-fade-up delay-6 text-center text-sm text-white/40">
            New to the platform?{" "}
            <Link
              to={ROUTES.REGISTER}
              className="font-semibold text-primary transition-colors hover:text-secondary"
            >
              Create account
            </Link>
          </p>
        </form>
      </div>
    </AuthShell>
  );
}
