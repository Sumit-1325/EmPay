import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthField } from "@/components/auth/AuthField";
import { Building2, Hash, User, Mail, Lock, ArrowRight, AlertCircle, CheckCircle } from "lucide-react";
import { AUTH_FEATURES } from "@/constants/authFeatures";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/lib/api";
import { getPasswordHints, validateEmail } from "@/lib/validators";
import { cn } from "@/lib/utils";

const INITIAL = {
  companyName: "",
  companyCode: "",
  firstName:   "",
  lastName:    "",
  email:       "",
  password:    "",
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();

  const [fields, setFields]       = useState(INITIAL);
  const [errors, setErrors]       = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading]     = useState(false);

  const passwordHints = getPasswordHints(fields.password);

  function set(key) {
    return (e) => {
      const value = key === "companyCode"
        ? e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10)
        : e.target.value;
      setFields((prev) => ({ ...prev, [key]: value }));
      if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
      if (serverError) setServerError("");
    };
  }

  function validate() {
    const errs = {};
    if (!fields.companyName.trim())  errs.companyName = "Company name is required";
    if (!fields.companyCode.trim())  errs.companyCode = "Company code is required";
    else if (fields.companyCode.length < 2) errs.companyCode = "Company code must be 2–10 characters";
    if (!fields.firstName.trim())    errs.firstName   = "First name is required";
    if (!fields.lastName.trim())     errs.lastName    = "Last name is required";
    if (!fields.email.trim())        errs.email       = "Email is required";
    else if (validateEmail(fields.email)) errs.email  = validateEmail(fields.email);
    if (!fields.password)            errs.password    = "Password is required";
    else if (!passwordHints.every((h) => h.valid)) errs.password = "Password does not meet all requirements";
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setServerError("");
    try {
      const res = await api.post("/auth/register", {
        companyName: fields.companyName.trim(),
        companyCode: fields.companyCode.trim(),
        firstName:   fields.firstName.trim(),
        lastName:    fields.lastName.trim(),
        email:       fields.email.trim().toLowerCase(),
        password:    fields.password,
      });
      login(res.data.user, res.data.accessToken, res.data.refreshToken);
      toast({
        title:       "Account created",
        description: `Your Login ID: ${res.data.user.loginId} — save this for future logins.`,
        variant:     "success",
      });
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch (err) {
      if (err.errors?.length) {
        const mapped = {};
        err.errors.forEach(({ path, msg }) => { if (path) mapped[path] = msg; });
        setErrors(mapped);
      } else {
        setServerError(err.message || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Create your company workspace"
      subtitle="Register your company and set up the first admin account to get started with EmPay HRMS."
      features={AUTH_FEATURES}
    >
      <div className="mx-auto w-full max-w-md space-y-7">
        <header className="animate-fade-up space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Company onboarding
          </h2>
          <p className="text-sm text-white/40">
            Creates a new company workspace with you as the Admin
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

          <div className="grid gap-5 sm:grid-cols-2">
            <AuthField
              id="companyName"
              name="companyName"
              label="Company Name"
              placeholder="Acme Industries"
              icon={Building2}
              required
              value={fields.companyName}
              onChange={set("companyName")}
              error={errors.companyName}
              animationClass="animate-fade-up delay-1"
            />
            <AuthField
              id="companyCode"
              name="companyCode"
              label="Company Code"
              placeholder="ACME"
              icon={Hash}
              required
              value={fields.companyCode}
              onChange={set("companyCode")}
              error={errors.companyCode}
              animationClass="animate-fade-up delay-1"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <AuthField
              id="firstName"
              name="firstName"
              label="First Name"
              placeholder="Jane"
              icon={User}
              required
              value={fields.firstName}
              onChange={set("firstName")}
              error={errors.firstName}
              animationClass="animate-fade-up delay-2"
            />
            <AuthField
              id="lastName"
              name="lastName"
              label="Last Name"
              placeholder="Smith"
              icon={User}
              required
              value={fields.lastName}
              onChange={set("lastName")}
              error={errors.lastName}
              animationClass="animate-fade-up delay-2"
            />
          </div>

          <AuthField
            id="email"
            name="email"
            type="email"
            label="Email"
            placeholder="admin@company.com"
            icon={Mail}
            required
            value={fields.email}
            onChange={set("email")}
            error={errors.email}
            animationClass="animate-fade-up delay-3"
          />

          <AuthField
            id="password"
            name="password"
            type="password"
            label="Password"
            placeholder="Strong@123"
            icon={Lock}
            required
            value={fields.password}
            onChange={set("password")}
            error={errors.password}
            animationClass="animate-fade-up delay-4"
          />

          {/* Live password hints */}
          {fields.password.length > 0 && (
            <div className="animate-fade-up delay-4 flex flex-wrap gap-2">
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

          {fields.password.length === 0 && (
            <div className="animate-fade-up delay-4 flex flex-wrap gap-2">
              {["8+ chars", "Uppercase", "Number", "Symbol"].map((hint) => (
                <span
                  key={hint}
                  className="rounded-md border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-[0.65rem] font-medium text-white/30"
                >
                  {hint}
                </span>
              ))}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="btn-shimmer animate-fade-up delay-5 h-11 w-full cursor-pointer rounded-xl bg-gradient-to-r from-primary to-secondary text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 hover:brightness-110 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Creating workspace…" : "Create workspace"}
            {!loading && <ArrowRight size={16} className="ml-2" />}
          </Button>

          <div className="animate-fade-up delay-6 flex items-center gap-4">
            <Separator className="flex-1 bg-white/[0.06]" />
            <span className="text-[0.65rem] font-medium tracking-wider text-white/20 uppercase">or</span>
            <Separator className="flex-1 bg-white/[0.06]" />
          </div>

          <p className="animate-fade-up delay-7 text-center text-sm text-white/40">
            Already have an account?{" "}
            <Link
              to={ROUTES.LOGIN}
              className="font-semibold text-primary transition-colors hover:text-secondary"
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </AuthShell>
  );
}
