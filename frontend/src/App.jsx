import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { LayoutProvider } from "@/context/LayoutContext";
import { ToastProvider } from "@/context/ToastContext";
import { AppShell } from "@/components/layout/AppShell";
import { PageSpinner } from "@/components/common/LoadingSpinner";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { useAuth } from "@/context/AuthContext";
import { ROUTES } from "@/constants/routes";

// ── Lazy-loaded pages ─────────────────────────────────────────
const LoginPage          = lazy(() => import("@/pages/LoginPage"));
const RegisterPage       = lazy(() => import("@/pages/RegisterPage"));
const ChangePasswordPage = lazy(() => import("@/pages/ChangePasswordPage"));
const Dashboard          = lazy(() => import("@/pages/Dashboard"));
const Employees          = lazy(() => import("@/pages/Employees"));
const Attendance         = lazy(() => import("@/pages/Attendance"));
const TimeOff            = lazy(() => import("@/pages/TimeOff"));
const Payroll            = lazy(() => import("@/pages/Payroll"));
const Reports            = lazy(() => import("@/pages/Reports"));
const Settings           = lazy(() => import("@/pages/Settings"));

// ── Guard: redirect to login if not authenticated;
//          redirect to /change-password if mustChangePassword is true ─────────
function RequireAuth() {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace />;
  if (user?.mustChangePassword) return <Navigate to={ROUTES.CHANGE_PASSWORD} replace />;
  return <Outlet />;
}

// ── Guard: only accessible when mustChangePassword is true ────
function RequirePasswordChange() {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace />;
  if (!user?.mustChangePassword) return <Navigate to={ROUTES.DASHBOARD} replace />;
  return <Outlet />;
}

// ── Guard: redirect to dashboard if already logged in ─────────
function RequireGuest() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to={ROUTES.DASHBOARD} replace /> : <Outlet />;
}

function AppRoutes() {
  const { isBootstrapping } = useAuth();

  if (isBootstrapping) return <PageSpinner />;

  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        {/* ── Guest-only (auth pages) ─── */}
        <Route element={<RequireGuest />}>
          <Route path={ROUTES.LOGIN}    element={<LoginPage />} />
          <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
        </Route>

        {/* ── Force password change wall ─── */}
        <Route element={<RequirePasswordChange />}>
          <Route path={ROUTES.CHANGE_PASSWORD} element={<ChangePasswordPage />} />
        </Route>

        {/* ── Protected (HRMS pages) ─── */}
        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route path={ROUTES.DASHBOARD}  element={<Dashboard />} />
            <Route path={ROUTES.EMPLOYEES}  element={<Employees />} />
            <Route path={ROUTES.ATTENDANCE} element={<Attendance />} />
            <Route path={ROUTES.TIME_OFF}   element={<TimeOff />} />
            <Route path={ROUTES.PAYROLL}    element={<Payroll />} />
            <Route path={ROUTES.REPORTS}    element={<Reports />} />
            <Route path={ROUTES.SETTINGS}   element={<Settings />} />
          </Route>
        </Route>

        {/* ── Catch-all ─── */}
        <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <LayoutProvider>
              <ErrorBoundary>
                <AppRoutes />
              </ErrorBoundary>
            </LayoutProvider>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
