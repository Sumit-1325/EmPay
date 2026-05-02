import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Briefcase, Calendar, CreditCard, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/common/Avatar";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { ROLE_LABELS } from "@/constants/roles";
import { ROUTES } from "@/constants/routes";

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <span className="mt-0.5 shrink-0 text-muted-foreground">
        <Icon size={15} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get(`/employees/${id}`)
      .then((res) => setEmployee(res.data.employee))
      .catch(() => {
        toast({ title: "Employee not found", variant: "error" });
        navigate(ROUTES.EMPLOYEES, { replace: true });
      })
      .finally(() => setLoading(false));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="mx-auto max-w-lg space-y-4 animate-pulse">
        <div className="h-8 w-32 rounded bg-muted" />
        <div className="h-48 rounded-2xl bg-muted" />
        <div className="h-64 rounded-2xl bg-muted" />
      </div>
    );
  }

  if (!employee) return null;

  const initials = [employee.firstName?.[0], employee.lastName?.[0]]
    .filter(Boolean).join("").toUpperCase() || "?";

  const joiningDate = employee.joiningDate
    ? new Date(employee.joiningDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="mx-auto max-w-lg space-y-6 animate-fade-up">
      {/* Back */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(ROUTES.EMPLOYEES)}
        className="gap-2 text-muted-foreground hover:text-foreground -ml-2"
      >
        <ArrowLeft size={15} /> Back to Employees
      </Button>

      {/* Profile card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col items-center gap-3 text-center">
          <Avatar src={employee.avatarUrl ?? undefined} initials={initials} size="xl" />
          <div>
            <h1 className="text-xl font-bold text-foreground">{employee.name}</h1>
            <p className="text-sm text-muted-foreground">{ROLE_LABELS[employee.role] ?? employee.role}</p>
            <span className="mt-1 inline-block rounded-full border border-border bg-muted px-3 py-0.5 text-xs text-muted-foreground">
              {employee.loginId}
            </span>
          </div>
        </div>
      </div>

      {/* Details card */}
      <div className="rounded-2xl border border-border bg-card px-5 py-2 shadow-sm">
        <InfoRow icon={Mail}      label="Email"          value={employee.email} />
        <InfoRow icon={Briefcase} label="Department"     value={ROLE_LABELS[employee.role] ?? employee.role} />
        <InfoRow icon={Calendar}  label="Joining Date"   value={joiningDate} />
        <InfoRow icon={CreditCard} label="Basic Salary"
          value={employee.basicSalary != null
            ? `₹${employee.basicSalary.toLocaleString("en-IN")}`
            : null}
        />
        <InfoRow icon={Hash}      label="PF Number"      value={employee.pfNumber} />
        <InfoRow icon={Hash}      label="Company"        value={employee.companyName} />
      </div>
    </div>
  );
}
