# EmPay HRMS Frontend Developer Guidelines
**Folder structure · Naming conventions · Component rules · Coding standards**

---

## 1. Purpose & Scope

This document defines the rules every developer must follow when building or modifying the EmPay HRMS frontend. It covers folder structure, file naming, component architecture, theming, animation, and code quality. These are not suggestions — they are the standard.

**Stack:** React 19 (JavaScript), shadcn/ui, Tailwind v4 (CSS-first), Vite 8.

---

## 2. Folder Structure

Every file must live in the correct layer. Do not create files outside this structure without team discussion.

### 2.1 Top-level `src/`

```
src/
  components/
    ui/          ← shadcn primitives — NEVER modify these
    common/      ← shared across 2+ pages
    layout/      ← AppShell, Sidebar, Topbar, MobileNav
    auth/        ← AuthShell, AuthField — auth pages only
  pages/         ← one file per route (flat for now)
  hooks/         ← custom React hooks
  lib/           ← api.js, formatters.js, validators.js, utils.js
  constants/     ← routes.js, roles.js, static maps
  context/       ← AuthContext, ThemeContext, LayoutContext, ToastContext
```

### 2.2 Component Layers Explained

| Layer | Folder | What goes here | Rule |
|-------|--------|---------------|------|
| Primitives | `components/ui/` | shadcn/ui generated files | Never edit |
| Common | `components/common/` | Avatar, Badge, DataTable, StatCard, PageHeader, EmptyState, Skeleton, Tabs | Reusable across pages |
| Layout | `components/layout/` | AppShell, Sidebar, Topbar, MobileNav | One instance per app |
| Auth | `components/auth/` | AuthShell, AuthField | Auth pages only |
| Pages | `pages/` | Route-level components, one file per route | No business logic |
| Hooks | `hooks/` | useTheme, useDebounce, useFetch, usePagination | Pure logic, no JSX |
| Lib | `lib/` | api.js, formatters.js, cn() utility | Pure functions only |
| Constants | `constants/` | ROUTES, USER_ROLES, ROUTE_ACCESS, NAV_ITEMS | No functions |

> If a sub-component is used on more than one page, move it to `components/common/` immediately.

---

## 3. Naming Conventions

### 3.1 Files & Folders

| Type | Convention | Example |
|------|-----------|---------|
| React component file | PascalCase.jsx | `EmployeeDetail.jsx` |
| Hook file | camelCase.js | `useFetch.js` |
| Utility / helper | camelCase.js | `formatters.js` |
| Constants file | camelCase.js | `roles.js` |
| Style file | kebab-case.css | `index.css` |

### 3.2 Component & Variable Names

- **Components:** PascalCase — `EmployeeCard`, `StatCard`, `AppShell`
- **Props:** camelCase — `isLoading`, `onClose`, `employeeId`
- **Event handlers:** `on` + Event — `onClick`, `onFilterChange`
- **Boolean props:** `is` / `has` / `show` prefix — `isOpen`, `hasError`
- **Hooks:** `use` prefix — `useTheme`, `useFetch`
- **Constants:** `SCREAMING_SNAKE_CASE` — `USER_ROLES`, `ROUTE_ACCESS`

### 3.3 Exports

✅ **DO:** Use named exports for ALL components. Only pages use default exports.

```jsx
// ✅ CORRECT — named export
export function EmployeeCard({ employee }) { ... }

// ✅ CORRECT — page default export
export default function EmployeeDetail() { ... }

// ❌ WRONG — no anonymous default exports in components
export default function() { ... }
```

---

## 4. Component Rules

### 4.1 One responsibility per component

Each component does one thing. If a component is doing layout AND data filtering AND rendering a table, split it.

> If your component file exceeds 150 lines, it probably needs to be split. (EmployeeDetail.jsx is an accepted exception due to tab complexity.)

### 4.2 Props

- All props must be explicitly destructured
- Provide default values for optional props inline
- Use PropTypes for any shared component in `common/`

```jsx
import PropTypes from "prop-types";

export function StatCard({ title, value, trend = null, isLoading = false }) {
  ...
}

StatCard.propTypes = {
  title:     PropTypes.string.isRequired,
  value:     PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  trend:     PropTypes.number,
  isLoading: PropTypes.bool,
};
```

### 4.3 No inline styles

❌ **NEVER** use `style={{ }}` in JSX. Use Tailwind classes only. Two acceptable exceptions: avatar `style={{ backgroundColor }}` and chart color values where Tailwind doesn't reach CSS variables directly.

```jsx
// ❌ WRONG
<div style={{ marginTop: "12px", color: "#111" }}>

// ✅ CORRECT
<div className="mt-3 text-foreground">
```

### 4.4 `cn()` for conditional classes

```jsx
import { cn } from "@/lib/utils";

<div className={cn(
  "rounded-md border px-4 py-2 text-sm",
  isActive && "bg-primary text-white",
  isDisabled && "opacity-50 cursor-not-allowed"
)}>
```

### 4.5 No logic in JSX

✅ **DO:** Keep JSX clean. Move complex expressions and conditions into variables above `return`.

---

## 5. Design System

### 5.1 Color Tokens

All colors come from CSS variables defined in `src/index.css`. **Never hardcode hex values.**

| Token | Usage |
|-------|-------|
| `--primary` | #6366f1 indigo — CTAs, active states, chart primary |
| `--secondary` | #a855f7 purple |
| `--accent` | #14b8a6 teal — chart secondary |
| `--background` | Page background |
| `--foreground` | Primary text |
| `--card` | Card backgrounds |
| `--muted` | Subtle fills, disabled |
| `--muted-foreground` | Secondary text, labels |
| `--border` | All borders |
| `--destructive` | Error states, delete actions |

In Tailwind: `bg-primary`, `text-foreground`, `border-border`, `text-muted-foreground`, etc.

### 5.2 Typography Scale

| Usage | Class |
|-------|-------|
| Page title | `text-2xl font-bold` |
| Section heading | `text-lg font-semibold` |
| Card title | `text-base font-medium` |
| Body | `text-sm` |
| Label / caption | `text-xs text-muted-foreground` |

### 5.3 Spacing

Use Tailwind spacing utilities on the 4px grid. Standard card padding: `p-5` or `p-6`. Section gaps: `gap-4` or `gap-6`.

### 5.4 Border Radius

| Element | Class |
|---------|-------|
| Cards | `rounded-xl` |
| Inputs, buttons | `rounded-md` |
| Badges, avatars | `rounded-full` |

### 5.5 Dark Mode

Dark mode is toggled by `class="dark"` on `<html>` (set by ThemeProvider). Use Tailwind `dark:` variants. Never write a separate dark theme file.

---

## 6. Animation Rules

❌ **No third-party animation libraries** (Framer Motion, GSAP, etc.). Use Tailwind transition utilities and CSS `@keyframes` only.

Every page fades in on mount with `animate-fade-up` class (defined in `index.css`). Do not animate data tables or error messages.

---

## 7. API Client — `lib/api.js`

```js
import { api } from "@/lib/api";

api.get("/employees")
api.post("/employees", body)
api.put("/employees/123", body)
api.patch("/employees/123/avatar", formData)  // pass FormData directly
api.delete("/employees/123")
```

**FormData rule:** When uploading files (avatar), pass `FormData` directly to `api.patch`. Do NOT set `Content-Type` manually — the browser adds the correct `multipart/form-data; boundary=...` header automatically. The client detects `instanceof FormData` and skips stringification.

**Token refresh:** On 401, the client auto-refreshes and retries. skipRefresh list: `/auth/login`, `/auth/register`, `/auth/refresh-token` only — never add `/auth/me` to this list.

---

## 8. Role-Based Access — `constants/roles.js`

```js
USER_ROLES     // { ADMIN, HR_OFFICER, PAYROLL_OFFICER, EMPLOYEE, SUPER_ADMIN }
MANAGER_ROLES  // [ADMIN, HR_OFFICER]
PAYROLL_ROLES  // [ADMIN, PAYROLL_OFFICER]
ROUTE_ACCESS   // { EMPLOYEES: [...], PAYROLL: [...], ... }
```

**Sidebar gating:** Nav items with an `access` array render as a disabled `<div>` with Lock icon if the user's role is not in the array. Do not redirect on unauthorized — prevent the click entirely.

**Employee profile gates:**
- `canEdit = MANAGER_ROLES.includes(user?.role)` — edit resume/bio fields, skills, certs
- `canViewSalary = PAYROLL_ROLES.includes(user?.role)` — show Salary Info tab
- `canEditSalary = user?.role === "ADMIN"` — edit monthlyWage and PF fields

---

## 9. Data Fetching — `hooks/useFetch.js`

```js
const { data, loading, error, refetch } = useFetch(() => api.get("/employees"), []);
```

Always pass a **function** and a deps array. Never pass a string path directly.

---

## 10. Recharts Usage

Import directly from `"recharts"` — not from the custom Tooltip wrapper:

```js
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
```

Use `var(--color-primary)` and `var(--color-accent)` for `fill` props. Pass custom `contentStyle` to Tooltip for dark mode compatibility.

---

## 11. shadcn/ui Rules

❌ **Never edit files inside `components/ui/`.** These are generated. Extend by wrapping in `components/common/`.

---

## 12. Accessibility (Non-Negotiable)

- All icon-only buttons must have an `aria-label`
- All form inputs must have an associated `<label>`
- Focus rings must be visible — never use `outline-none` without a replacement
- Color alone must never convey meaning — always pair with text or icon

---

## 13. Code Quality Checklist

Before opening a PR, verify every item:

| Check | Rule |
|-------|------|
| File location | Component is in the correct layer folder |
| Named export | Component uses named export (except page files) |
| No inline styles | Zero `style={{ }}` in JSX (except documented exceptions) |
| No hardcoded colors | No hex values in JSX or `className` |
| PropTypes | All props in `common/` components are typed |
| Accessibility | Icon buttons have `aria-label`, inputs have labels |
| Dark mode | Every new UI element has `dark:` variant or uses CSS variable classes |
| Empty state | Every list/table has an `EmptyState` or equivalent |
| Loading state | Async sections show loading feedback |
| No animation libs | Only Tailwind transition + CSS `@keyframes` |
| Role gates | Salary Info, Payroll page sections gated to correct roles |

---

## 14. Quick Reference — Do's and Don'ts

| ✅ DO | ❌ DON'T |
|------|---------|
| Use named exports for components | Use anonymous default exports in components |
| Wrap shadcn primitives in `common/` | Edit files inside `components/ui/` |
| Use CSS variable Tailwind classes | Hardcode hex values anywhere |
| Pass FormData directly to api.patch | Set Content-Type manually for file uploads |
| Use `cn()` for conditional classes | String-concatenate class names |
| Import Tooltip from "recharts" | Import Tooltip from the custom wrapper for charts |
| Gate salary/payroll views by role | Show 403 errors for unauthorized views |
| Use Tailwind transitions for animation | Install Framer Motion or GSAP |

---

*EmPay HRMS Frontend Guidelines · Version 2.0*
