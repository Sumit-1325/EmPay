# Frontend — EmPay HRMS

**Stack:** React 19 · Vite 8 · Tailwind v4 (CSS-first, no tailwind.config.js) · shadcn/ui (radix-ui unified package) · React Router v6 · Recharts · @dnd-kit

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
       ├─ ToastProvider   (context/ToastContext.jsx)  ← global toast notifications
       ├─ LayoutProvider  (context/LayoutContext.jsx)
       ├─ ErrorBoundary   (components/common/ErrorBoundary.jsx)  ← crash fallback
       └─ Routes (Suspense + lazy)
            ├─ RequireGuest → /login, /register   (redirect to / if already logged in)
            ├─ RequirePasswordChange → /change-password  (blocks all other routes when mustChangePassword = true)
            └─ RequireAuth → AppShell → all HRMS pages (redirect to /login if not logged in)
```

## Component Layer Rules

| Folder | What lives here | Rule |
|--------|----------------|------|
| `components/ui/` | shadcn/ui primitives | **Never edit** |
| `components/common/` | Avatar, Badge, StatCard, PageHeader, EmptyState, LoadingSpinner, Tooltip, Dialog, Dropdown, Tabs, DataTable, **ErrorBoundary** | Shared across 2+ pages |
| `components/layout/` | AppShell, Sidebar, Topbar, MobileNav | One instance per app |
| `components/auth/` | AuthShell, AuthField | Auth pages only |
| `pages/` | Route-level components (`export default`) | No business logic |
| `hooks/` | useTheme, useSidebar, useLocalStorage, useDebounce, usePagination, useFetch | Pure logic, no JSX |
| `context/` | AuthContext, ThemeContext, LayoutContext, **ToastContext** | React Context providers |
| `lib/` | api.js, formatters.js, validators.js, utils.js | Pure functions |
| `constants/` | routes.js, roles.js, dealStages.js | Static data, no functions |

## State Management

**Authentication** — `context/AuthContext.jsx`
```js
const { user, isAuthenticated, isBootstrapping, login, logout, updateUser } = useAuth();
// login(userData, accessToken, refreshToken) → stores in localStorage
// logout() → clears localStorage
// isBootstrapping: true while GET /auth/me is in-flight on app load
// Also listens for window "auth:logout" event — fired by api.js on token refresh failure
```

**Theme** — `context/ThemeContext.jsx`
```js
const { theme, toggleTheme } = useTheme(); // "light" | "dark"
// Applies .dark or .light class to <html>. Persists to localStorage key "crm-theme"
```

**Layout** — `context/LayoutContext.jsx`
```js
const { isOpen, toggle } = useSidebar();
const { toggleMobileNav, closeMobileNav } = useContext(LayoutContext);
```

**Toast notifications** — `context/ToastContext.jsx`
```js
const { toast } = useToast();
toast({ title: "Saved!", description: "Employee updated.", variant: "success" });
// variants: "default" | "success" | "error" | "warning"
// duration defaults to 4000ms; auto-dismisses via Radix Toast
```

## Routing — `constants/routes.js`

```js
ROUTES.LOGIN             // /login
ROUTES.REGISTER          // /register
ROUTES.CHANGE_PASSWORD   // /change-password
ROUTES.DASHBOARD         // /
ROUTES.EMPLOYEES         // /employees
ROUTES.EMPLOYEE_DETAIL   // /employees/:id
ROUTES.ATTENDANCE        // /attendance
ROUTES.TIME_OFF          // /time-off
ROUTES.ALLOCATION        // /leave-allocation  ← Leave Allocation page (ADMIN + HR_OFFICER only)
ROUTES.PAYROLL           // /payroll
ROUTES.REPORTS           // /reports
ROUTES.SETTINGS          // /settings
```

To add a new page:
1. Add path to `constants/routes.js`
2. Create `pages/PageName.jsx` with `export default`
3. Add `<Route>` inside `RequireAuth` block in `App.jsx`
4. Add nav entry to `Sidebar.jsx` and `MobileNav.jsx` `NAV_ITEMS` arrays

## Role-Based Access — `constants/roles.js`

```js
USER_ROLES      // { ADMIN, HR_OFFICER, PAYROLL_OFFICER, EMPLOYEE, SUPER_ADMIN }
MANAGER_ROLES   // [ADMIN, HR_OFFICER] — can edit employees
PAYROLL_ROLES   // [ADMIN, PAYROLL_OFFICER] — can view Salary Info tab and Payroll page
ROUTE_ACCESS    // map of route key → allowed roles array
```

**Sidebar gating:** Each `NAV_ITEM` has an `access` array. If the logged-in user's role is not in `access`, the nav item renders as a disabled `<div>` with a Lock icon (40% opacity) instead of a `<NavLink>`. This prevents unauthorized access without showing a 403 error page.

**Settings link:** Only rendered for `ADMIN` — completely hidden from sidebar and MobileNav for all other roles (not just locked).

**Allocation link:** Uses `ROUTE_ACCESS.ALLOCATION = [ADMIN, HR_OFFICER]`. Employees and Payroll Officers see a locked icon.

**Employee profile tabs:**
- Resume tab: editable by MANAGER_ROLES (read-only for EMPLOYEE)
- Private Info tab: visible to MANAGER_ROLES
- Salary Info tab: visible to PAYROLL_ROLES only (`canViewSalary`)
- Security tab: visible to MANAGER_ROLES

## API Client — `lib/api.js`

```js
import { api } from "@/lib/api";

api.get("/employees")
api.post("/employees", { firstName, lastName, email, role, monthlyWage })
api.put("/employees/123", data)
api.patch("/employees/123/avatar", formData)   // pass FormData directly — no Content-Type header
api.delete("/employees/123")
```

Automatically injects `Authorization: Bearer <token>` from localStorage. Throws errors with `{ message, status, errors }` shape. Base URL from `VITE_API_URL` env (default `http://localhost:8000/api`).

**FormData detection:** If `body instanceof FormData`, the client skips `JSON.stringify` and does NOT set `Content-Type` (browser adds it with the correct multipart boundary automatically).

**Auto token refresh:** On any 401 response the client automatically calls `POST /auth/refresh-token`, updates localStorage, and retries the original request. Concurrent 401s are queued and replayed after refresh. If refresh fails, dispatches `auth:logout` event → `AuthContext` clears session and redirects to `/login`.

**skipRefresh list:** Only routes that should NOT trigger a refresh attempt (to prevent loops): `/auth/login`, `/auth/register`, `/auth/refresh-token`. `/auth/me` is NOT in this list — it should trigger a refresh if the access token has expired.

## Data Fetching Hook — `hooks/useFetch.js`

```js
// Takes a function, not a path string
const { data, loading, error, refetch } = useFetch(() => api.get("/employees"), []);
```

Always pass a function and a deps array (like `useEffect`). The hook calls the function on mount and whenever deps change.

## Design System — CSS Variables

Light/dark tokens live in `src/index.css`. Both modes defined:
- `:root` = light mode
- `.dark` = dark mode (applied to `<html>` by ThemeProvider)

Key variables: `--primary` (#6366f1 indigo), `--secondary` (#a855f7 purple), `--accent` (#14b8a6 teal), `--background`, `--foreground`, `--card`, `--muted`, `--border`, `--destructive`.

In Tailwind classes, these map as `bg-primary`, `text-foreground`, `border-border`, etc. (via `@theme inline` in `index.css`).

**Never hardcode hex values in JSX or className.** Use Tailwind CSS variable classes.

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

### Form handling
```jsx
const [fields, setFields] = useState({ email: "", password: "" });
const [errors, setErrors] = useState({});
const [loading, setLoading] = useState(false);

function set(key) {
  return (e) => {
    setFields(p => ({ ...p, [key]: e.target.value }));
    if (errors[key]) setErrors(p => ({ ...p, [key]: "" }));
  };
}
```

### Controlled form field
```jsx
<AuthField
  id="email" name="email" type="email" label="Email"
  value={fields.email} onChange={set("email")} error={errors.email}
/>
```

### Employee creation payload
```js
// Send monthlyWage — backend auto-computes basicSalary = monthlyWage * 0.5
api.post("/employees", { firstName, lastName, email, role, monthlyWage, pfNumber })
// Response: { employee, tempPassword, note }
```

## Employee Profile Page — `pages/EmployeeDetail.jsx`

Full tabbed profile page. Layout:
```
ProfileHeader
  ├── Avatar (edit overlay for ADMIN/HR)
  ├── Name + loginId badge + role/jobTitle
  ├── Email, mobile, location, manager, company
└── Tabs [Resume | Private Info | Salary Info* | Security]
     ├── ResumeTab      — About, jobPassion, interests, Skills (chips), Certifications
     ├── PrivateInfoTab — Personal details + bank account fields
     ├── SalaryInfoTab  — Only if canViewSalary (PAYROLL_ROLES)
     └── SecurityTab    — Placeholder
```

**Salary Info tab formula** (all computed in frontend from `employee.monthlyWage`):
```
wage   = monthlyWage
basic  = wage × 0.50
hra    = basic × 0.50
sa     = 4167  (fixed ₹4,167)
pb     = basic × 0.0833
lta    = basic × 0.0833
fixed  = wage − (basic + hra + sa + pb + lta)
pfEmp  = basic × pfRate/100
pfEr   = basic × pfRate/100
profTax = 200
```

## Time Off Page — `pages/TimeOff.jsx`

Role-split views:
- **Employee**: Shows own leave requests + balance cards fetched live from `GET /leave/allocations/me`. Balance = allocated days − approved leave days. Shows an amber warning card if used > allocated. "NEW" opens `RequestModal`.
- **Admin/HR Officer**: Shows ALL employees' requests. "NEW" opens `AdminRequestForm` (employee dropdown). Can approve/reject pending requests (✓ / ✗ icon buttons).

Leave types: `"Paid Time Off"` (isPaid: true), `"Sick Leave"` (isPaid: true), `"Unpaid Leave"` (isPaid: false).

**Sick Leave attachment:** The attachment file input only appears when "Sick Leave" is selected. Accepts `image/*` only (no PDF). Sent as `FormData` via `api.post`. Stored on Cloudinary via `uploadLeaveAttachment()` with `resource_type: "auto"`.

**FormData upload:** `api.post` detects `FormData` instances and skips `JSON.stringify`, allowing the browser to set `multipart/form-data` headers automatically.

**Leave balance cards:** Fetched from `GET /leave/allocations/me` (backend filters active allocations by date). Balance = `allocated - used`. If `used > allocated`, card turns amber with an "X days over limit" badge.

`POST /leave` body: `{ leaveType, startDate, endDate, isPaid, reason?, targetUserId? }` + optional `attachment` file field.

`PUT /leave/:id/approve` and `PUT /leave/:id/reject` — allowed for ADMIN, HR_OFFICER, PAYROLL_OFFICER.

**Action column alignment:** The last grid column uses a fixed-width `<span className="w-7">` slot for the paperclip icon so approve/reject buttons stay aligned across all rows regardless of attachment presence.

## Leave Allocation Page — `pages/LeaveAllocation.jsx`

Admin/HR-only page at `/leave-allocation`. Allows creating and deleting leave entitlements for employees.

- **Form fields:** Employee dropdown, Leave Type, Validity Period (start/end dates + "No limit" toggle), Allocation Days (capped to date range), Note.
- **Days cap:** `max = endDate − startDate + 1` (inclusive). Auto-clamped when dates change. Shows hint when end date is set.
- **Table:** Lists all company allocations with Employee, Leave Type, From, To, Days, Note, Delete button.
- **Delete:** `DELETE /leave/allocations/:id` — spinner on row, refetches list, shows toast.

**Data flow for employee balance:**
1. HR creates allocation via Allocation page → saved to `leave_allocations` table
2. Employee opens Time Off → `GET /leave/allocations/me` returns active allocations (today within validity period)
3. Balance computed: `remaining = max(0, allocated - approved_used)`

## Topbar — Check-In/Out (`components/layout/Topbar.jsx`)

The `CheckInOut` component enforces work-hour boundaries:
- Reads `user.company.workStartTime` and `user.company.workEndTime` (format: `"HH:MM"`).
- A `setInterval` updates current time every 60 s so the button auto-enables/disables at the boundary.
- **Check-in** is disabled outside work hours — button shows `"Opens HH:MM AM/PM"` and hovering shows a tooltip with the allowed window.
- **Check-out** is always allowed (employee may stay past end time).
- Helper `fmt12("HH:MM")` converts 24-hour strings to 12-hour AM/PM display.

## Payroll Dashboard — `pages/Payroll.jsx`

Role-gated sections:
- **All allowed roles** (ADMIN, PAYROLL_OFFICER, HR_OFFICER): warning cards, summary tiles, New Joiners chart
- **ADMIN + PAYROLL_OFFICER only**: Recent Payslips list, Employer Cost chart

Warning cards link to `/employees` and only appear when count > 0:
- Employees without bank account (`bankAccountNumber` is null)
- Employees without a manager (`managerId` is null)

Charts use Recharts `BarChart` with monthly/annual toggle. Import `Tooltip` from `"recharts"` — never from the custom Tooltip wrapper.

## Charts (Dashboard / Reports)

Uses `recharts`. Import directly from `"recharts"` — not from the custom `Tooltip` wrapper. Use `var(--color-primary)` and `var(--color-accent)` for chart fill colors.

## Drag-and-Drop (Deals Pipeline)

Uses `@dnd-kit/core` + `@dnd-kit/sortable`. Key points:
- `DndContext` wraps the board with `PointerSensor` (8px activation threshold)
- Each column has `SortableContext` with its deal IDs
- Each card uses `useSortable({ id })` — exposes drag handle via `...listeners`
- `DragOverlay` renders a **plain div ghost**, NOT the sortable card (avoids hook context error)
- Cross-column move: update `deal.stage` in `onDragOver`, finalize in `onDragEnd`

## Error Handling

**ErrorBoundary** — wraps all routes in `App.jsx`. On an uncaught React render error it shows a "Try again / Go home" fallback. Catches component crashes only (not async/fetch errors).

**Toast** — for user-visible async errors call `toast({ title, description, variant: "error" })` inside catch blocks. Do not use `alert()`.

## Known Deviations to Fix

- PropTypes not yet added to `common/` and `crm/` components
- DataTable shows a spinner on load — should use Skeleton rows
- Some pages exceed 150 lines (Settings, DealPipeline, DataTable, EmployeeDetail)
- Pages are flat files not `PageName/index.jsx` folders yet
- Two data-driven inline `style={{ backgroundColor }}` usages are acceptable exceptions

## Guidelines Reference

Full coding standards: `frontend/guides/frontend-guidelines.md`
