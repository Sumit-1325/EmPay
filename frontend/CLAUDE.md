# Frontend — EmPay HRMS

**Stack:** React 19 · Vite 8 · Tailwind v4 (CSS-first, no tailwind.config.js) · shadcn/ui · React Router v6 · Recharts

## Commands

```bash
npm run dev      # Vite dev server → localhost:5173
npm run build    # production build → dist/
npm run preview  # serve dist/ locally
```

## Path Alias

`@/` → `src/` (configured in `vite.config.js`). Always use `@/` imports, never relative paths from deep files.

## App Entry Flow

```
main.jsx
  └─ App.jsx
       ├─ BrowserRouter
       ├─ ThemeProvider   (context/ThemeContext.jsx)
       ├─ AuthProvider    (context/AuthContext.jsx)
       ├─ ToastProvider   (context/ToastContext.jsx)
       ├─ LayoutProvider  (context/LayoutContext.jsx)
       ├─ ErrorBoundary   (components/common/ErrorBoundary.jsx)
       └─ Routes (Suspense + lazy)
            ├─ RequireGuest          → /login, /register
            ├─ RequirePasswordChange → /change-password
            └─ RequireAuth           → AppShell → all HRMS pages
```

`/` (DASHBOARD) uses `RoleRedirect`: EMPLOYEE → `/attendance`, all others → `/employees`

## Component Layer Rules

| Folder | What lives here | Rule |
|--------|----------------|------|
| `components/ui/` | shadcn/ui primitives | **Never edit** |
| `components/common/` | Avatar, StatCard, PageHeader, LoadingSpinner, ErrorBoundary, Tabs | Shared across 2+ pages |
| `components/layout/` | AppShell, Sidebar, Topbar, MobileNav | One instance per app |
| `components/auth/` | AuthShell, AuthField | Auth pages only |
| `pages/` | Route-level components (`export default`) | No business logic in controllers |
| `hooks/` | useFetch, useLocalStorage, useTheme, useSidebar | Pure logic, no JSX |
| `context/` | AuthContext, ThemeContext, LayoutContext, ToastContext | React Context providers |
| `lib/` | api.js, formatters.js, validators.js, utils.js | Pure functions |
| `constants/` | routes.js, roles.js, authFeatures.js | Static data only |

## State Management

**Authentication** — `context/AuthContext.jsx`
```js
const { user, isAuthenticated, isBootstrapping, login, logout, updateUser } = useAuth();
// login(userData, accessToken, refreshToken) → stores in localStorage
// logout() → clears localStorage
// isBootstrapping: true while GET /auth/me is in-flight on app load
// Listens for "auth:logout" event — fired by api.js on token refresh failure
```

**Theme** — `context/ThemeContext.jsx`
```js
const { theme, toggleTheme } = useTheme(); // "light" | "dark"
// Applies .dark/.light class to <html>. Persists to localStorage "crm-theme"
```

**Layout** — `context/LayoutContext.jsx`
```js
const { isOpen, toggle } = useSidebar();
const { toggleMobileNav, closeMobileNav } = useContext(LayoutContext);
```

**Toast** — `context/ToastContext.jsx`
```js
const { toast } = useToast();
toast({ title: "Saved!", description: "...", variant: "success" });
// variants: "default" | "success" | "error" | "warning"
```

## Routing — `constants/routes.js`

```js
ROUTES.LOGIN            // /login
ROUTES.REGISTER         // /register
ROUTES.CHANGE_PASSWORD  // /change-password
ROUTES.DASHBOARD        // /  ← RoleRedirect, not a real page
ROUTES.EMPLOYEES        // /employees
ROUTES.EMPLOYEE_DETAIL  // /employees/:id
ROUTES.ATTENDANCE       // /attendance
ROUTES.TIME_OFF         // /time-off
ROUTES.ALLOCATION       // /leave-allocation
ROUTES.PAYROLL          // /payroll
ROUTES.PAYROLL_DETAIL   // /payroll/payslip/:id
ROUTES.REPORTS          // /reports
ROUTES.SETTINGS         // /settings
```

To add a new page:
1. Add path to `constants/routes.js`
2. Create `pages/PageName.jsx` with `export default`
3. Add lazy import + `<Route>` in `App.jsx`
4. Add nav entry to `Sidebar.jsx` and `MobileNav.jsx` `NAV_ITEMS` arrays

## Role-Based Access — `constants/roles.js`

```js
USER_ROLES      // { ADMIN, HR_OFFICER, PAYROLL_OFFICER, EMPLOYEE, SUPER_ADMIN }
MANAGER_ROLES   // [ADMIN, HR_OFFICER]      — create/edit employees, approve leave
PAYROLL_ROLES   // [ADMIN, PAYROLL_OFFICER] — Payroll page, Salary Info tab, Reports
ROUTE_ACCESS    // map of route key → allowed roles array
```

Sidebar gating: nav items have an `access` array. Unauthorized roles see a locked `<div>` with a Lock icon (40% opacity) instead of a `<NavLink>`. Settings link is completely hidden from non-ADMIN.

## API Client — `lib/api.js`

```js
import { api } from "@/lib/api";
api.get("/employees")
api.post("/employees", { firstName, lastName, email, role, monthlyWage })
api.put("/employees/123", data)
api.patch("/employees/123/avatar", formData)  // FormData → no Content-Type header
api.delete("/employees/123")
```

- Auto-injects `Authorization: Bearer <token>` from localStorage
- Throws `{ message, status, errors }` on error
- Auto token refresh on 401 — retries original request; dispatches `auth:logout` if refresh fails
- `skipRefresh` list: `/auth/login`, `/auth/register`, `/auth/refresh-token`
- Base URL from `VITE_API_URL` env (default `http://localhost:8000/api`)

**FormData:** If `body instanceof FormData`, skips `JSON.stringify` — browser sets `multipart/form-data` boundary automatically.

## Data Fetching Hook — `hooks/useFetch.js`

```js
const { data, loading, error, refetch } = useFetch(() => api.get("/employees"), []);
```

Always pass a function + deps array (like `useEffect`). Reruns when deps change.

## Design System — CSS Variables

Light/dark tokens in `src/index.css`. Applied via `@theme inline`.

| Variable | Usage |
|----------|-------|
| `--primary` | #6366f1 indigo — buttons, active states |
| `--secondary` | #a855f7 purple — gradient partner |
| `--accent` | #14b8a6 teal — chart bars, highlights |
| `--background` | Page background |
| `--card` | Card/panel background |
| `--border` | #cbd5e1 light / #2d2d3d dark |
| `--foreground` | Body text |
| `--muted-foreground` | Labels, secondary text |
| `--destructive` | Red — errors, delete |

**Never hardcode hex values in JSX.** Use Tailwind CSS variable classes: `bg-primary`, `text-foreground`, `border-border`.

**Modal pattern:** Always use `createPortal(..., document.body)` with `z-[9999]` to escape CSS animation stacking contexts. Gradient header: `bg-gradient-to-r from-primary to-secondary`.

---

## Pages

### `pages/LoginPage.jsx`
Auth page. Fields: `loginIdOrEmail` + `password`. Calls `POST /auth/login`. On success calls `login(user, accessToken, refreshToken)` → navigates to dashboard. Shows server errors inline.

### `pages/RegisterPage.jsx`
Company onboarding — creates company + first ADMIN user. Fields: `companyName`, `companyCode`, `firstName`, `lastName`, `email`, `password`. Calls `POST /auth/register`. On success shows toast with auto-generated `loginId`, navigates to dashboard.

### `pages/ChangePasswordPage.jsx`
Force-change wall shown when `mustChangePassword = true`. Fields: `oldPassword`, `newPassword` (with live strength hints), `confirmPassword`. Calls `PUT /auth/change-password`. On success calls `login()` with new tokens (rotated by backend) → navigates to dashboard.

### `pages/Employees.jsx`
Employee list page (ADMIN, HR_OFFICER, PAYROLL_OFFICER). Key elements:
- Search bar (client-side filter on name/loginId/email/role)
- Role filter dropdown
- `CreateEmployeeModal` — gradient header, portal, fields: firstName, lastName, email, role, monthlyWage, joiningDate. On success shows `TempPasswordCard` (portal) with the one-time temp password + copy button
- Employee table rows → click → navigate to `/employees/:id`
- Delete button (ADMIN only) with inline confirmation

### `pages/EmployeeDetail.jsx`
Full tabbed employee profile (`max-w-4xl`). Key elements:
- **ProfileHeader** — avatar (editable for ADMIN/HR via `PATCH /employees/:id/avatar`), name, loginId badge, role, email, mobile, location, manager, joining date
- **Resume tab** — editable About / Job Passion / Interests (save on blur via `PUT /employees/:id`); Skills chips (add on Enter, delete via `DELETE /:id/skills/:skillId`); Certifications list with add form. Read-only for EMPLOYEE role.
- **Private Info tab** — personal details + bank account fields (placeholder sections)
- **Salary Info tab** — visible to PAYROLL_ROLES only. Editable `monthlyWage` (ADMIN only); auto-computed salary breakdown table (Basic, HRA, SA, PB, LTA, Fixed, PF, Prof Tax)
- **Security tab** — own profile: Change Password form (old+new+confirm with strength hints, calls `PUT /auth/change-password`). Admin/HR on another employee: Reset Password button (calls `POST /employees/:id/reset-password`, emails new temp password)

### `pages/Attendance.jsx`
Check-in/out log. Key elements:
- EMPLOYEE sees own records; ADMIN/HR see all with employee filter
- Date range filter
- Status badges: PRESENT / HALF_DAY / ABSENT / LEAVE
- Duration computed from checkIn/checkOut
- Admin can edit attendance records (`PUT /attendance/:id`)

### `pages/TimeOff.jsx`
Leave request management. Role-split views:
- **Employee** — own requests + balance cards from `GET /leave/allocations/me`. Balance = allocated − approved used. Amber warning if over limit. "NEW" → `RequestModal`
- **Admin/HR** — all company requests. "NEW" → `AdminRequestForm` (with employee dropdown). Approve/reject buttons (✓ / ✗) on pending rows
- Both modals use `ModalShell` (portal, gradient header)
- Sick Leave attachment: image upload via FormData → Cloudinary

### `pages/LeaveAllocation.jsx`
ADMIN + HR_OFFICER only. Create leave entitlements for employees:
- Form: employee dropdown, leave type, validity period (start/end + "No limit" toggle), days (auto-capped to date range), note
- Table of all company allocations with delete button
- `DELETE /leave/allocations/:id`

### `pages/Payroll.jsx`
Payroll management page. Three tabs:
- **Dashboard tab** — summary tiles (total employees, payslips run, annual cost, new joiners), warning cards (missing bank/manager), Employer Cost bar chart, New Joiners bar chart. "Run Payrun" button (PAYROLL_ROLES) → `RunPayrunModal` (portal, calls `POST /payroll/run`, shows results inline)
- **Payrun tab** — two inner sub-tabs:
  - *Payruns Summary* — list from `GET /payroll/payruns`: period, payslip count, total net, total employer cost, "View →" link (switches to By Employee with that month pre-filtered)
  - *By Employee* — payslip list filtered by month/year; "Mark Paid" button; "View →" links to `/payroll/payslip/:id`
- **Configuration tab** — company work hours (start/end time → auto-computes standard hours); saves via `PUT /company/settings`

### `pages/PayslipDetail.jsx`
Full payslip detail page at `/payroll/payslip/:id`. Key elements:
- Header card: employee name + loginId badge, month/year, Paid/Pending badge
- **Attendance Summary** — 5 stat tiles: Present, Half Day, Paid Leave, Unpaid Leave, Payable/Total
- **Salary Computation table** — Earnings section (Basic→Gross), Deductions section (PF Employee, Prof Tax, TDS if non-zero, Total), Net Pay row (green + large)
- **Employer Cost** sidebar card — Gross + PF Employer = Total Cost
- **Actions** — "Print / Download PDF" (`window.open` with `?token=` query param), "Mark as Paid" (PAYROLL_ROLES only, hidden when already paid)

### `pages/Reports.jsx`
Salary Statement report generator (ADMIN + PAYROLL_OFFICER only). Key elements:
- Employee dropdown + financial year select
- Selected employee preview pill
- "Generate & Print" — fetches `GET /reports/salary-statement?employeeId=X&year=Y` with Bearer auth header, creates a Blob URL, opens in new tab (avoids `window.open` auth header limitation)
- Right panel: "What's included" list, role access table
- Non-ADMIN/PAYROLL_OFFICER sees amber access-denied notice + disabled form

### `pages/Settings.jsx`
User settings page (ADMIN only in sidebar). Five tabs:
- **Profile** — avatar upload (Cloudinary), firstName/lastName/email fields, save via `PUT /employees/:id`
- **Preferences** — theme toggle (light/dark), notification preferences placeholder
- **Security** — change password (inline form, same as ChangePasswordPage but within the app shell)
- **Company** — company name, logo upload, work hours; saves via `PUT /company/settings`
- **User Settings** — manage all employees' roles and settings (ADMIN only)

---

## Components

### `components/common/PageHeader.jsx`
Standard page title bar used by all HRMS pages.
```jsx
<PageHeader title="Payroll" breadcrumbs={[{ label: "Payroll" }, { label: "Detail" }]} />
```
Renders title + breadcrumb trail. No actions slot — page-level buttons go in the page itself.

### `components/common/Avatar.jsx`
Circular avatar with initials fallback.
```jsx
<Avatar src={user.avatarUrl} initials="RV" size="lg" />
// sizes: sm | md | lg | xl
```

### `components/common/StatCard.jsx`
KPI tile used in the Dashboard. Props: `label`, `value`, `trend` ("up"|"down"), `trendValue`, `icon`.

### `components/common/Tabs.jsx`
Horizontal tab strip used in Settings and EmployeeDetail.
```jsx
<Tabs tabs={[{ value, label, icon, labelClass, content }]} defaultValue="resume" />
```
Props: `tabs` array, `defaultValue`. Each tab's `content` is rendered below the strip. Supports `labelClass` for custom label styling.

### `components/common/LoadingSpinner.jsx`
Two exports:
- `LoadingSpinner` — inline spinner
- `PageSpinner` — full-page centered spinner (used in App.jsx Suspense fallback + `isBootstrapping`)

### `components/common/ErrorBoundary.jsx`
React class error boundary wrapping all routes. On uncaught render error shows "Try again / Go home" fallback.

### `components/layout/AppShell.jsx`
Root layout for authenticated pages. Renders `<Sidebar>` + `<Topbar>` + `<main><Outlet /></main>`. Handles mobile sidebar overlay.

### `components/layout/Sidebar.jsx`
Left navigation. `NAV_ITEMS` array drives links — each has `label`, `icon`, `to`, `access` (roles array). Unauthorized roles see a locked disabled item. Settings link hidden for non-ADMIN entirely.

### `components/layout/Topbar.jsx`
Top bar with: hamburger (mobile), page title, `CheckInOut` component, theme toggle, user menu (avatar + logout). `CheckInOut` reads `user.company.workStartTime/workEndTime` to gate check-in button (disabled outside work hours, shows tooltip with allowed window).

### `components/layout/MobileNav.jsx`
Bottom navigation sheet for mobile. Same `NAV_ITEMS` as Sidebar.

### `components/auth/AuthShell.jsx`
Two-column auth layout wrapper. Left: feature list (`AUTH_FEATURES` from constants). Right: slot for form content. Used by Login, Register, ChangePassword pages.

### `components/auth/AuthField.jsx`
Styled input for auth forms. Props: `id`, `type`, `label`, `icon`, `value`, `onChange`, `error`, `readOnly`, `animationClass`. Password type adds show/hide toggle automatically.

---

## Hooks

### `hooks/useFetch.js`
Data fetching with loading/error/refetch. Takes a function + deps array.

### `hooks/useLocalStorage.js`
Typed localStorage read/write with JSON serialization.

### `hooks/useTheme.js`
Reads theme from `ThemeContext`. Convenience wrapper for `useContext(ThemeContext)`.

### `hooks/useSidebar.js`
Reads sidebar open/close state from `LayoutContext`.

---

## Lib

### `lib/api.js`
HTTP client with auto-auth, token refresh, FormData detection. See API Client section above.

### `lib/formatters.js`
- `getInitials(firstName, lastName)` — used in Settings avatar
- `formatCurrency(n)` — INR formatting

### `lib/validators.js`
- `getPasswordHints(password)` — returns array of `{ label, valid }` for live strength UI
- `validateEmail(email)` — boolean

### `lib/utils.js`
- `cn(...classes)` — clsx + tailwind-merge (conditional className helper)

---

## Constants

### `constants/routes.js`
All route path strings. Always import from here — never hardcode paths in components.

### `constants/roles.js`
`USER_ROLES`, `MANAGER_ROLES`, `PAYROLL_ROLES`, `ROLE_LABELS` (display names), `ROUTE_ACCESS`.

### `constants/authFeatures.js`
Feature bullet list shown in `AuthShell` left panel: "Multi-tenant payroll", "Attendance tracking", "Leave management", "Role-based access".

---

## Key Patterns

### New page skeleton
```jsx
import { PageHeader } from "@/components/common/PageHeader";

export default function MyPage() {
  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader title="My Page" breadcrumbs={[{ label: "My Page" }]} />
      {/* content */}
    </div>
  );
}
```

### Modal pattern (portal, gradient header)
```jsx
import { createPortal } from "react-dom";
import { X } from "lucide-react";

function MyModal({ onClose }) {
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        <div className="relative bg-gradient-to-r from-primary to-secondary px-6 py-5">
          <h2 className="text-lg font-semibold text-white">Title</h2>
          <button onClick={onClose} className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6">{/* body */}</div>
      </div>
    </div>,
    document.body
  );
}
```

### Employee creation payload
```js
api.post("/employees", { firstName, lastName, email, role, monthlyWage, pfNumber })
// Response: { employee, tempPassword, note }
// tempPassword shown once — never stored plain
```

### PDF / HTML report opening
```js
// For routes requiring auth — can't pass header via window.open
// Option 1: fetch with header, create blob URL
const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
const html = await res.text();
window.open(URL.createObjectURL(new Blob([html], { type: "text/html" })), "_blank");

// Option 2: query param (backend verifyJWT accepts ?token=)
window.open(`${BASE_URL}/payroll/${id}/pdf?token=${token}`, "_blank");
```

## Known Deviations
- PropTypes not added to most components
- localStorage theme key is `"crm-theme"` (legacy name — renaming would break existing sessions, keep as-is)
- localStorage auth keys: `"accessToken"`, `"refreshToken"`, `"user"`
