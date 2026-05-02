# CRM Frontend — Implementation Notes

> Documents what was built, how it aligns with the guidelines, known deviations, and required follow-up work.
> **Last updated:** 2026-05-02

---

## 1. What Was Built

A full CRM frontend shell from scratch on top of an existing auth-only skeleton. All pages, components, hooks, and routing are in place with sample/mock data. No backend integration yet.

### File Inventory

```
src/
  App.jsx                      ← BrowserRouter + providers + lazy routes + auth guards
  index.css                    ← Light + dark CSS tokens, keyframes, CRM utilities

  components/
    ui/                        ← shadcn primitives (untouched)
    layout/
      AppShell.jsx             ← Outlet wrapper with sidebar + topbar
      Sidebar.jsx              ← Collapsible nav (w-60 / w-16)
      Topbar.jsx               ← Fixed header, theme toggle, user menu, mobile hamburger
      MobileNav.jsx            ← Slide-in drawer for mobile
    common/
      Avatar.jsx               ← Image with initials fallback, 5 sizes
      Badge.jsx                ← 7 variants (default, success, warning, destructive, …)
      StatCard.jsx             ← KPI card with trend indicator (↑↓)
      PageHeader.jsx           ← Title + breadcrumbs + action buttons
      EmptyState.jsx           ← Empty list placeholder with icon + CTA
      LoadingSpinner.jsx       ← Spinner + PageSpinner (centered full-height)
      Tooltip.jsx              ← Radix Tooltip wrapper
      Dialog.jsx               ← Radix Dialog wrapper with header + footer slots
      Dropdown.jsx             ← Radix DropdownMenu wrapper (items array or children)
      Tabs.jsx                 ← Radix Tabs wrapper (tabs array with content slot)
      DataTable.jsx            ← Sortable + paginated table with row selection
    crm/
      ActivityItem.jsx         ← Single activity row with type icon + timeline line
      ActivityFeed.jsx         ← Timeline grouped by date (Today / Yesterday / …)
      ContactCard.jsx          ← Contact summary card with hover scale
      ContactList.jsx          ← DataTable + debounced search bar
      DealKanbanCard.jsx       ← @dnd-kit sortable card with grip handle
      DealPipeline.jsx         ← Full kanban board with cross-column drag via @dnd-kit
    auth/
      AuthField.jsx            ← Controlled input with icon, error, password toggle
      AuthShell.jsx            ← Two-panel auth layout (branding left, form right)

  pages/
    LoginPage.jsx              ← Controlled form → POST /auth/login → navigate to /
    RegisterPage.jsx           ← Controlled form + live password hints → POST /auth/register
    Dashboard.jsx              ← KPI row + pipeline preview + activity feed + Recharts
    Contacts.jsx               ← ContactList with sample data + Add Contact CTA
    ContactDetail.jsx          ← Profile + activity tabs + related deals sidebar
    Deals.jsx                  ← Full DealPipeline with local state for drag moves
    Activities.jsx             ← ActivityFeed with type filter chips
    Reports.jsx                ← LineChart + PieChart + BarChart (Recharts)
    Settings.jsx               ← Profile / Preferences / Security tabs

  hooks/
    useTheme.js                ← Reads ThemeContext
    useSidebar.js              ← Reads LayoutContext (isOpen, toggle, setOpen)
    useLocalStorage.js         ← Syncs useState to localStorage
    useDebounce.js             ← 300ms default debounce
    usePagination.js           ← Client-side slice + page controls
    useFetch.js                ← { data, loading, error, refetch } pattern

  context/
    AuthContext.jsx            ← user, login(), logout(), updateUser(), isAuthenticated
    ThemeContext.jsx           ← theme, toggleTheme(); applies .dark/.light to <html>
    LayoutContext.jsx          ← sidebarOpen, mobileNavOpen, toggles

  lib/
    api.js                     ← fetch wrapper with Bearer token injection + error throwing
    formatters.js              ← formatDate, formatRelativeTime, formatCompactCurrency, getInitials, …
    validators.js              ← validateEmail, validateLoginId, getPasswordHints (array), …
    utils.js                   ← cn() (clsx + tailwind-merge)

  constants/
    routes.js                  ← ROUTES object (all path strings)
    authFeatures.js            ← AUTH_FEATURES array for auth page branding
    dealStages.js              ← DEAL_STAGES array with value + label + color
    roles.js                   ← USER_ROLES, ROLE_LABELS enums
```

---

## 2. Deviations From Guidelines

These are known differences between the current implementation and the rules in `frontend-guidelines.md`. Each has a priority label.

### DEV-01 — Page file structure (Priority: Low)

**Guideline:** `pages/Contacts/index.jsx` (folder per route)
**Current:** `pages/Contacts.jsx` (flat file)

All 9 pages are flat `.jsx` files rather than folders with `index.jsx`. This is acceptable while pages are small and have no page-specific sub-components. When a page grows a second file (e.g., `ContactsFilters.jsx`), convert it to the folder structure.

**Action:** Convert to `pages/PageName/index.jsx` when any page gains its first page-scoped sub-component.

---

### DEV-02 — CSS variable naming (Priority: Medium)

**Guideline:** `--crm-*` prefix (e.g., `--crm-bg-primary`)
**Current:** shadcn convention — `--primary`, `--background`, `--border`, etc. (no `--crm-` prefix)

The project uses the shadcn/ui token naming system because `index.css` was built before this guideline document was finalized. The current tokens are fully functional and support both light and dark mode correctly.

**Action:** Either adopt `--crm-*` aliases as a parallel layer on top of the existing tokens, or update the guideline to accept the shadcn convention as the standard for this project. Decision required from the team before touching `index.css`.

---

### DEV-03 — PropTypes missing (Priority: Medium)

**Guideline:** All components in `common/` and `crm/` must have PropTypes
**Current:** No PropTypes on any component

**Action:** Add PropTypes incrementally, starting with the most-used components:
1. `Avatar`, `Badge`, `StatCard` (simple, few props)
2. `DataTable`, `PageHeader` (complex, important to document)
3. All `crm/` components

Install first: `npm install prop-types`

---

### DEV-04 — Loading states use spinner not Skeleton (Priority: Medium)

**Guideline:** Use `Skeleton` for loading states, not spinners
**Current:** `DataTable` shows a `LoadingSpinner` while `loading` prop is true; `PageSpinner` is used for Suspense fallback

**Action:**
1. Add a `DataTableSkeleton` component (rows of `Skeleton` pulses matching the column widths)
2. Replace `<LoadingSpinner />` inside `DataTable` with `<DataTableSkeleton columns={columns} />`
3. Replace `<PageSpinner />` in `App.jsx` Suspense fallback with a skeleton that matches the page layout

---

### DEV-05 — Inline styles for data-driven colors (Priority: Low)

**Guideline:** Zero `style={{ }}` in JSX
**Current:** Two places use inline styles for colors sourced from data:
- `KanbanColumn` in `DealPipeline.jsx`: `style={{ backgroundColor: stage.color }}` for the stage dot
- `AuthShell.jsx`: `style={{ background: feature.dot, boxShadow: … }}` for feature pill dots

These colors come from the `DEAL_STAGES` and `AUTH_FEATURES` constants and cannot be expressed as static Tailwind classes.

**Action (option A):** Map stage colors to Tailwind safe-listed classes and store the class name in the constant instead of a hex value.
```js
// constants/dealStages.js
{ value: "prospecting", label: "Prospecting", dotClass: "bg-indigo-500" }
```

**Action (option B):** Accept this as a documented exception — data-driven colors that cannot be known at build time are an acceptable use of inline styles. Update the guideline with this exception clause.

---

### DEV-06 — Some components exceed 150 lines (Priority: Low)

**Guideline:** Components over 150 lines should be split
**Current oversized files:**

| File | Approx. lines | Reason |
|------|-------------|--------|
| `DealPipeline.jsx` | ~160 | `KanbanColumn` sub-component is inline |
| `DataTable.jsx` | ~170 | Includes pagination, sorting, selection, empty state |
| `Settings.jsx` | ~200 | Three tab content components (`ProfileTab`, `PreferencesTab`, `SecurityTab`) are inline |

**Action:**
- `DealPipeline.jsx` → Extract `KanbanColumn` into `DealPipelineColumn.jsx`
- `DataTable.jsx` → Extract `DataTablePagination` into a separate file
- `Settings.jsx` → Extract each tab into `ProfileTab.jsx`, `PreferencesTab.jsx`, `SecurityTab.jsx` inside a `pages/Settings/` folder

---

### DEV-07 — Page mount animation class name differs (Priority: Low)

**Guideline:** Use `.animate-fadeInUp` (defined in `globals.css`)
**Current:** Pages use `animate-fade-up` (from the `tw-animate-css` package already imported in `index.css`)

Both produce the same visual effect. `animate-fade-up` is already available without adding anything to `index.css`.

**Action:** Either add `.animate-fadeInUp` as an alias in `index.css`, or update the guideline to list `animate-fade-up` as the project standard. No functional change needed.

---

## 3. Patterns to Follow for Future Work

### Adding a new CRM page

1. Create `pages/PageName/index.jsx` (use folder structure from the start)
2. Import `PageHeader` and wrap content in `<div className="space-y-6 animate-fade-up">`
3. Connect to `AppShell` via `App.jsx` — add a `<Route>` inside the `RequireAuth` block
4. Add the route path to `constants/routes.js`
5. Add the nav link to `Sidebar.jsx` and `MobileNav.jsx` `NAV_ITEMS` arrays

```jsx
// pages/NewPage/index.jsx
import { PageHeader } from "@/components/common/PageHeader";
import { ROUTES } from "@/constants/routes";

export default function NewPage() {
  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader
        title="New Page"
        breadcrumbs={[{ label: "New Page" }]}
      />
      {/* content */}
    </div>
  );
}
```

---

### Connecting a page to the real API

The `api.js` client and `useFetch.js` hook are ready. Replace the `SAMPLE_*` constants at the top of each page file with a `useFetch` call:

```jsx
// Before (sample data)
const SAMPLE_CONTACTS = [ ... ];

// After (real API)
import { useFetch } from "@/hooks/useFetch";

export default function Contacts() {
  const { data: contacts = [], loading, error, refetch } = useFetch("/contacts");
  ...
}
```

The `api.js` base URL is read from `VITE_API_URL` env var (defaults to `http://localhost:5000/api`). Set it in a `.env.local` file:
```
VITE_API_URL=http://localhost:5000/api
```

---

### Adding a new common component

1. Create `components/common/ComponentName.jsx` with a **named export**
2. Use only CSS variable-based Tailwind classes (no hardcoded hex)
3. Add PropTypes for all props
4. Test in both light and dark mode
5. Add an `EmptyState` or `LoadingSpinner` slot if the component can have empty/loading states

---

### Form handling pattern

All forms follow the pattern established in `LoginPage.jsx` and `RegisterPage.jsx`:

```jsx
const [fields, setFields] = useState({ field1: "", field2: "" });
const [errors, setErrors] = useState({});
const [serverError, setServerError] = useState("");
const [loading, setLoading] = useState(false);

function set(key) {
  return (e) => {
    setFields((prev) => ({ ...prev, [key]: e.target.value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" })); // clear on change
  };
}

function validate() {
  const errs = {};
  if (!fields.field1.trim()) errs.field1 = "Required";
  return errs;
}

async function handleSubmit(e) {
  e.preventDefault();
  const errs = validate();
  if (Object.keys(errs).length) { setErrors(errs); return; }
  setLoading(true);
  try {
    await api.post("/endpoint", fields);
    // navigate or update UI
  } catch (err) {
    setServerError(err.message);
  } finally {
    setLoading(false);
  }
}
```

---

### Drag-and-drop additions

`DealPipeline.jsx` uses `@dnd-kit/core` + `@dnd-kit/sortable`. The pattern to follow:
- Wrap the board in `<DndContext>` with `PointerSensor`
- Each column uses `<SortableContext items={dealIds}>`
- Each card uses `useSortable({ id })` and exposes a `GripVertical` drag handle
- Use `<DragOverlay>` with a lightweight ghost (not the same component that calls `useSortable`)
- Cross-column moves: update item's `stage` field in `onDragOver`; finalize in `onDragEnd`

---

## 4. What Was Added (2026-05-02 — Improvements Sprint)

### Auto token refresh (`lib/api.js`)

`api.js` now intercepts 401 responses and automatically refreshes the access token:
1. Calls `POST /auth/refresh-token` with the stored refresh token
2. Updates `accessToken` and `refreshToken` in localStorage
3. Retries the original request with the new token
4. Queues any concurrent 401s and replays them once the refresh resolves
5. If refresh fails → dispatches `window.dispatchEvent(new Event("auth:logout"))` → `AuthContext` clears state

`AuthContext` now listens for `auth:logout` via `useEffect` + `window.addEventListener`.

### ErrorBoundary (`components/common/ErrorBoundary.jsx`)

Class component wrapping all routes in `App.jsx`. Catches uncaught render errors and shows a "Try again / Go home" fallback. Call `this.setState({ hasError: false })` via the "Try again" button to reset.

### Toast system (`context/ToastContext.jsx`)

`<ToastProvider>` wraps the app above `<LayoutProvider>`. Use anywhere:
```js
const { toast } = useToast();
toast({ title: "Done", description: "Contact saved.", variant: "success" });
```
Variants: `default | success | error | warning`. Built on Radix Toast — bottom-right viewport, auto-dismiss 4s.

### Backend security (`src/index.js`, `src/routes/auth.route.js`)

- `helmet()` applied globally — sets CSP, HSTS, X-Frame-Options, etc.
- `loginLimiter`: 10 req / 15 min per IP on `POST /login`
- `forgotPasswordLimiter`: 5 req / hour per IP on `POST /forgot-password`

### DB indexes (`prisma/schema.prisma`)

Added `@@index([email])` and `@@index([loginId])` to the User model. Run `npm run prisma:migrate` to apply.

### Contacts page wired to real API (`pages/Contacts.jsx`)

Replaced `SAMPLE_CONTACTS` with `useFetch(() => api.get("/contacts"), [])`. Shows `PageSpinner` while loading, `EmptyState` on error. Backend needs a `GET /api/contacts` route to serve data.

---

## 5. Priority Backlog (Future Sprints)

| # | Task | Guideline | Priority |
|---|------|-----------|---------|
| 1 | Add PropTypes to all `common/` and `crm/` components | DEV-03 | Medium |
| 2 | Replace DataTable spinner with Skeleton rows | DEV-04 | Medium |
| 3 | ~~Add error boundaries around each page~~ ✅ Done — global ErrorBoundary in App.jsx | — | ~~Medium~~ |
| 4 | Wire remaining pages (Dashboard, Deals, Activities, ContactDetail) to real API | — | High |
| 5 | Build `GET /api/contacts` backend route + Prisma query | — | High |
| 6 | Convert `Settings.jsx` tabs into separate files | DEV-06 | Low |
| 7 | Convert `DealPipeline.jsx` `KanbanColumn` into its own file | DEV-06 | Low |
| 8 | Decide on `--crm-*` vs shadcn token naming with team | DEV-02 | Medium |
| 9 | Add `useMediaQuery` hook for responsive breakpoints | — | Low |
| 10 | Add keyboard navigation to `DataTable` rows | Guidelines §9 | Medium |
| 11 | Add `aria-label` audit pass on all icon-only buttons | Guidelines §9 | Medium |
| 12 | Test all pages in light mode for contrast ratio | Guidelines §5.5 | Medium |
| 13 | Add `ContactDetail` edit dialog (Dialog component ready) | — | Low |
| 14 | Add `useMediaQuery` + mobile card view in `DataTable` | Guidelines §2 | Low |
| 15 | Wire `toast()` into form catch blocks across all pages | — | Medium |
| 16 | Fix CORS bug: `callback(new Error(...))` → `callback(null, false)` in `backend/src/index.js:44` | — | Medium |

---

*Implementation Notes · CRM Frontend · v1.1 · 2026-05-02*
