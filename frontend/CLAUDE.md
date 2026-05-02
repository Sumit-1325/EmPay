# Frontend — Auth_Ready CRM

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
            └─ RequireAuth → AppShell → all CRM pages (redirect to /login if not logged in)
```

## Component Layer Rules

| Folder | What lives here | Rule |
|--------|----------------|------|
| `components/ui/` | shadcn/ui primitives | **Never edit** |
| `components/common/` | Avatar, Badge, StatCard, PageHeader, EmptyState, LoadingSpinner, Tooltip, Dialog, Dropdown, Tabs, DataTable, **ErrorBoundary** | Shared across 2+ pages |
| `components/layout/` | AppShell, Sidebar, Topbar, MobileNav | One instance per app |
| `components/crm/` | ContactCard, ContactList, ActivityItem, ActivityFeed, DealKanbanCard, DealPipeline | CRM domain only |
| `components/auth/` | AuthShell, AuthField | Auth pages only |
| `pages/` | Route-level components (`export default`) | No business logic |
| `hooks/` | useTheme, useSidebar, useLocalStorage, useDebounce, usePagination, useFetch | Pure logic, no JSX |
| `context/` | AuthContext, ThemeContext, LayoutContext, **ToastContext** | React Context providers |
| `lib/` | api.js, formatters.js, validators.js, utils.js | Pure functions |
| `constants/` | routes.js, authFeatures.js, dealStages.js, roles.js | Static data, no functions |

## State Management

**Authentication** — `context/AuthContext.jsx`
```js
const { user, isAuthenticated, login, logout, updateUser } = useAuth();
// login(userData, accessToken, refreshToken) → stores in localStorage
// logout() → clears localStorage
// Also listens for window "auth:logout" event — fired by api.js on token refresh failure
```

**Theme** — `context/ThemeContext.jsx`
```js
const { theme, toggleTheme } = useTheme(); // "light" | "dark"
// Applies .dark or .light class to <html>. Persists to localStorage key "crm-theme"
```

**Layout** — `context/LayoutContext.jsx`
```js
const { isOpen, toggle } = useSidebar();         // sidebar collapse
const { toggleMobileNav, closeMobileNav } = useContext(LayoutContext); // mobile drawer
```

**Toast notifications** — `context/ToastContext.jsx`
```js
const { toast } = useToast();
toast({ title: "Saved!", description: "Contact updated.", variant: "success" });
// variants: "default" | "success" | "error" | "warning"
// duration defaults to 4000ms; auto-dismisses via Radix Toast
```

## Routing — `constants/routes.js`

```js
ROUTES.LOGIN        // /login
ROUTES.REGISTER     // /register
ROUTES.DASHBOARD    // /
ROUTES.CONTACTS     // /contacts
ROUTES.CONTACT_DETAIL // /contacts/:id
ROUTES.DEALS        // /deals
ROUTES.ACTIVITIES   // /activities
ROUTES.REPORTS      // /reports
ROUTES.SETTINGS     // /settings
```

To add a new page:
1. Add path to `constants/routes.js`
2. Create `pages/PageName.jsx` with `export default`
3. Add `<Route>` inside `RequireAuth` block in `App.jsx`
4. Add nav entry to `Sidebar.jsx` and `MobileNav.jsx` `NAV_ITEMS` arrays

## API Client — `lib/api.js`

```js
import { api } from "@/lib/api";

api.get("/contacts")
api.post("/contacts", { name, email })
api.put("/contacts/123", data)
api.delete("/contacts/123")
```

Automatically injects `Authorization: Bearer <token>` from localStorage. Throws errors with `{ message, status, errors }` shape. Base URL from `VITE_API_URL` env (default `http://localhost:5000/api`).

**Auto token refresh:** On any 401 response the client automatically calls `POST /auth/refresh-token`, updates localStorage, and retries the original request. Concurrent requests that also 401 are queued and replayed after the refresh. If refresh fails, dispatches `auth:logout` event → `AuthContext` clears session and user is redirected to `/login`.

## Data Fetching Hook — `hooks/useFetch.js`

```js
// Takes a function, not a path string
const { data, loading, error, refetch } = useFetch(() => api.get("/contacts"), []);
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

## Drag-and-Drop (Deals Pipeline)

Uses `@dnd-kit/core` + `@dnd-kit/sortable`. Key points:
- `DndContext` wraps the board with `PointerSensor` (8px activation threshold)
- Each column has `SortableContext` with its deal IDs
- Each card uses `useSortable({ id })` — exposes drag handle via `...listeners`
- `DragOverlay` renders a **plain div ghost**, NOT the sortable card (avoids hook context error)
- Cross-column move: update `deal.stage` in `onDragOver`, finalize in `onDragEnd`

## Charts (Dashboard / Reports)

Uses `recharts`. Import from `"recharts"` — not from our custom `Tooltip` wrapper. Use `var(--color-primary)` for chart colors (resolves to the CSS variable chain).

## Error Handling

**ErrorBoundary** — wraps all routes in `App.jsx`. On an uncaught React render error it shows a "Try again / Go home" fallback. Catches component crashes only (not async/fetch errors).

**Toast** — for user-visible async errors call `toast({ title, description, variant: "error" })` inside catch blocks. Do not use `alert()`.

## Known Deviations to Fix

See `frontend/guides/implementation-notes.md` for full list. Quick summary:
- PropTypes not yet added to `common/` and `crm/` components
- DataTable shows a spinner on load — should use Skeleton rows
- Some pages exceed 150 lines (Settings, DealPipeline, DataTable)
- Pages are flat files not `PageName/index.jsx` folders yet
- Two data-driven inline `style={{ backgroundColor }}` usages are acceptable exceptions
- Most pages still use sample/mock data — only `Contacts.jsx` is wired to the real API

## Guidelines Reference

Full coding standards: `frontend/guides/frontend-guidelines.md`
