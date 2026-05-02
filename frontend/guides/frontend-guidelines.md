# CRM Frontend Developer Guidelines
**Folder structure · Naming conventions · Component rules · Coding standards**

---

## 1. Purpose & Scope

This document defines the rules every developer must follow when building or modifying the CRM frontend. It covers folder structure, file naming, component architecture, theming, animation, and code quality. These are not suggestions — they are the standard.

> ⚠️ **WARNING:** Frontend only. Do not touch API calls, data fetching logic, or any backend code during the UI refactor phase.

**Stack:** React (JavaScript), shadcn/ui, Tailwind CSS, Vite.

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
    crm/         ← CRM domain components
  pages/         ← one folder per route
  hooks/         ← custom React hooks
  lib/           ← utils, formatters, helpers
  constants/     ← enums, config values, static maps
  styles/        ← globals.css, tokens.css
```

### 2.2 Component Layers Explained

| Layer | Folder | What goes here | Rule |
|-------|--------|---------------|------|
| Primitives | `components/ui/` | shadcn/ui generated files | Never edit |
| Common | `components/common/` | Avatar, Badge, DataTable, StatCard, PageHeader, EmptyState, Skeleton | Reusable across pages |
| Layout | `components/layout/` | AppShell, Sidebar, Topbar, MobileNav | One instance per app |
| CRM Domain | `components/crm/` | ContactCard, DealKanbanCard, ActivityFeed, PipelineStage | CRM-specific only |
| Pages | `pages/` | Route-level components, one folder per route | No business logic |
| Hooks | `hooks/` | useTheme, useDebounce, useFetch, usePagination | Pure logic, no JSX |
| Lib | `lib/` | formatDate, formatCurrency, cn() utility | Pure functions only |
| Constants | `constants/` | DEAL_STAGES, STATUS_MAP, NAV_ITEMS | No functions |

### 2.3 Page Folder Structure

Each page lives in its own folder with this shape:

```
pages/
  Contacts/
    index.jsx           ← default export, route entry
    ContactsTable.jsx   ← page-specific sub-component
    ContactsFilters.jsx
    useContactsPage.js  ← page-scoped logic hook (optional)
```

> ⚠️ **WARNING:** If a sub-component is used on more than one page, move it to `components/common/` or `components/crm/` immediately.

---

## 3. Naming Conventions

### 3.1 Files & Folders

| Type | Convention | Example |
|------|-----------|---------|
| React component file | PascalCase.jsx | `ContactCard.jsx` |
| Hook file | camelCase.js | `useDebounce.js` |
| Utility / helper | camelCase.js | `formatDate.js` |
| Constants file | camelCase.js | `dealStages.js` |
| Page folder | PascalCase/ | `Contacts/` |
| Page entry file | index.jsx | `pages/Contacts/index.jsx` |
| Style file | kebab-case.css | `globals.css` |

### 3.2 Component & Variable Names

- **Components:** PascalCase — `ContactCard`, `StatCard`, `AppShell`
- **Props:** camelCase — `isLoading`, `onClose`, `contactId`
- **Event handlers:** `on` + Event — `onClick`, `onFilterChange`, `onRowSelect`
- **Boolean props:** `is` / `has` / `show` prefix — `isOpen`, `hasError`, `showSidebar`
- **Hooks:** `use` prefix — `useTheme`, `usePagination`, `useContactsPage`
- **Constants:** `SCREAMING_SNAKE_CASE` — `DEAL_STAGES`, `STATUS_MAP`
- **CSS variables:** `--crm-` prefix — `--crm-bg-primary`, `--crm-text-muted`

### 3.3 Exports

✅ **DO:** Use named exports for ALL components. Only pages (`index.jsx`) use default exports.

```jsx
// ✅ CORRECT — named export
export function ContactCard({ contact }) { ... }

// ✅ CORRECT — page default export
export default function ContactsPage() { ... }

// ❌ WRONG — no anonymous default exports in components
export default function() { ... }
```

---

## 4. Component Rules

### 4.1 One responsibility per component

Each component does one thing. If a component is doing layout AND data filtering AND rendering a table, split it.

> ⚠️ **WARNING:** If your component file exceeds 150 lines, it probably needs to be split.

### 4.2 Props

- All props must be explicitly destructured — no props object spreading without reason
- Provide default values for optional props inline
- Use PropTypes for any shared component in `common/` or `crm/`

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

❌ **DON'T:** Never use `style={{ }}` in JSX. Use Tailwind classes only. If a value is dynamic, use CSS variables or `cn()` helper.

```jsx
// ❌ WRONG
<div style={{ marginTop: "12px", color: "#111" }}>

// ✅ CORRECT
<div className="mt-3 text-gray-900">
```

### 4.4 `cn()` for conditional classes

Use the `cn()` utility (from `lib/utils.js`) to compose conditional Tailwind classes cleanly.

```jsx
import { cn } from "@/lib/utils";

<div className={cn(
  "rounded-md border px-4 py-2 text-sm",
  isActive && "bg-black text-white",
  isDisabled && "opacity-50 cursor-not-allowed"
)}>
```

### 4.5 No logic in JSX

✅ **DO:** Keep JSX clean. Move complex expressions, map transforms, and conditions into variables above the `return`.

```jsx
// ❌ WRONG — logic inside JSX
return (
  <div>
    {contacts.filter(c => c.status === "active").map(c => ...)}
  </div>
);

// ✅ CORRECT — compute above return
const activeContacts = contacts.filter(c => c.status === "active");
return (
  <div>
    {activeContacts.map(c => <ContactCard key={c.id} contact={c} />)}
  </div>
);
```

---

## 5. Design System

### 5.1 Color Tokens

All colors must come from CSS variables defined in `styles/tokens.css`. Never hardcode hex values in Tailwind classes or JSX.

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|----------|-------|
| `--crm-bg-primary` | `#FFFFFF` | `#1A1A1A` | Page / card backgrounds |
| `--crm-bg-secondary` | `#F9FAFB` | `#262626` | Sidebar, table zebra rows |
| `--crm-bg-tertiary` | `#F3F4F6` | `#2E2E2E` | Hover states, subtle fills |
| `--crm-text-primary` | `#111827` | `#F9FAFB` | Headings, primary content |
| `--crm-text-muted` | `#6B7280` | `#9CA3AF` | Labels, secondary text |
| `--crm-border` | `#E5E7EB` | `#3A3A3A` | All borders |
| `--crm-accent` | `#111827` | `#F9FAFB` | Buttons, active states |

### 5.2 Typography Scale

| Usage | Class | Size |
|-------|-------|------|
| Page title | `text-2xl font-bold` | 24px |
| Section heading | `text-lg font-semibold` | 18px |
| Card title | `text-base font-medium` | 16px |
| Body / paragraph | `text-sm` | 14px |
| Label / caption | `text-xs text-muted-foreground` | 12px |
| Data / numbers | `font-mono text-sm` | 14px mono |

### 5.3 Spacing Scale

Use only Tailwind spacing utilities. Stick to the 4px base grid.

- **Component padding:** `p-4` (16px) or `p-6` (24px) for cards
- **Section gaps:** `gap-4` or `gap-6`
- **Page padding:** `px-6 py-8` on the main content wrapper
- **Inline spacing:** `gap-2` or `gap-3` for icon + text combos

### 5.4 Border Radius

| Element | Class | Value |
|---------|-------|-------|
| Cards | `rounded-xl` | 12px |
| Inputs | `rounded-md` | 6px |
| Buttons | `rounded-md` | 6px |
| Badges | `rounded-full` | 9999px |
| Avatars | `rounded-full` | 9999px |
| Modals | `rounded-xl` | 12px |

### 5.5 Dark Mode

Dark mode is toggled by adding `class="dark"` on the `<html>` element. Use Tailwind `dark:` variants paired with CSS variables.

✅ **DO:** Never use a separate dark theme file. All dark styles go inline with `dark:` prefix.

```jsx
<div className="bg-white dark:bg-[--crm-bg-primary] text-gray-900 dark:text-[--crm-text-primary]">
```

---

## 6. Animation Rules

❌ **DON'T:** No third-party animation libraries (Framer Motion, GSAP, etc.). Use Tailwind transition utilities and CSS `@keyframes` only.

### 6.1 Allowed Animation Utilities

| Utility | When to use |
|---------|------------|
| `transition-all duration-150` | Button hover, badge hover |
| `transition-colors duration-200` | Sidebar item hover, table row hover |
| `transition-transform duration-200` | Sidebar collapse, dropdown open |
| `transition-opacity duration-300` | Page mount fade-in, skeleton → content |
| `animate-pulse` | Skeleton loading placeholders |
| `animate-spin` | Loading spinners (use sparingly) |

### 6.2 Page Mount Animation

Every page should fade in on mount using this pattern — do not add extra animation libraries for this:

```css
/* In globals.css */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-fadeInUp {
  animation: fadeInUp 0.25s ease-out both;
}
```

```jsx
/* In your page component */
<div className="animate-fadeInUp">
  ...page content
</div>
```

### 6.3 When NOT to animate

- Do not animate data tables — rows appearing should be instant
- Do not animate error states or form validation messages
- Do not animate anything on every re-render — only on mount or intentional state change

---

## 7. Custom Hooks

### 7.1 Rules

- Every hook file starts with `use` — `useDebounce.js`, `usePagination.js`
- Hooks must return only values and setter functions — no JSX ever
- Hooks that are used on more than one page go in `src/hooks/`
- Page-specific hooks can live inside the page folder as `useContactsPage.js`
- Never call a hook conditionally — always at the top level of the component

### 7.2 Standard Hooks to Build

| Hook | Purpose | Returns |
|------|---------|---------|
| `useTheme()` | Manages dark/light mode toggle | `{ theme, toggleTheme }` |
| `useDebounce(val, ms)` | Delays a value update | `debouncedValue` |
| `usePagination(total)` | Tracks page, pageSize, offset | `{ page, pageSize, setPage }` |
| `useLocalStorage(key)` | Persist state to localStorage | `[value, setValue]` |
| `useMediaQuery(query)` | Detect breakpoint (mobile/tablet) | `boolean` |

---

## 8. shadcn/ui Rules

❌ **DON'T:** Never edit files inside `components/ui/`. These are generated and will be overwritten. Extend by wrapping, not modifying.

### 8.1 How to extend a shadcn component

Create a wrapper in `components/common/` that adds your defaults:

```jsx
// components/common/AppButton.jsx
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AppButton({ className, ...props }) {
  return (
    <Button
      className={cn("font-medium transition-all duration-150", className)}
      {...props}
    />
  );
}
```

### 8.2 Which shadcn components are approved

| Component | Approved use |
|-----------|-------------|
| Button | All CTAs, actions |
| Input | All form text inputs |
| Select | All dropdowns |
| Dialog | Modals and confirmations |
| Table | Data tables (wrap in DataTable common component) |
| Badge | Status labels, tags |
| Avatar | User/contact avatars |
| Skeleton | Loading states — use instead of spinners |
| Tooltip | Icon-only button labels |
| Sheet | Mobile navigation drawer |
| Separator | Section dividers |

---

## 9. Accessibility (Non-Negotiable)

- All icon-only buttons must have an `aria-label`
- All form inputs must have an associated `<label>`
- Focus rings must be visible — never use `outline-none` without a replacement
- Interactive table rows must support keyboard navigation (`tabIndex`, `onKeyDown`)
- Color alone must never convey meaning — always pair with text or icon
- Dark mode contrast ratio must pass WCAG AA (4.5:1 for normal text)

```jsx
// ✅ CORRECT — icon button with aria-label
<button aria-label="Close sidebar">
  <X className="h-4 w-4" />
</button>

// ❌ WRONG — no accessible label
<button><X className="h-4 w-4" /></button>
```

---

## 10. Code Quality Checklist

Before opening a PR, verify every item below:

| Check | Rule |
|-------|------|
| File location | Component is in the correct layer folder |
| Named export | Component uses named export (except page `index.jsx`) |
| No inline styles | Zero `style={{ }}` in JSX |
| No hardcoded colors | No hex values in JSX or `className` |
| PropTypes | All props in `common/` and `crm/` components are typed |
| Accessibility | Icon buttons have `aria-label`, inputs have labels |
| Dark mode | Every new UI element has `dark:` variant |
| Empty state | Every list/table has an `EmptyState` component |
| Loading state | Every async section uses `Skeleton`, not spinner |
| No animation libs | Only Tailwind transition + CSS `@keyframes` used |
| Mobile responsive | Tested at 375px, 768px, 1280px widths |

---

## 11. Quick Reference — Do's and Don'ts

| ✅ DO | ❌ DON'T |
|------|---------|
| Use named exports for components | Use anonymous default exports in components |
| Wrap shadcn primitives in `common/` components | Edit files inside `components/ui/` |
| Use Tailwind `dark:` variants for dark mode | Create a separate dark theme file |
| Use Tailwind transition utilities for animation | Install Framer Motion or GSAP |
| Use `Skeleton` for loading states | Use full-page spinners |
| Define colors as CSS variables in `tokens.css` | Hardcode hex values in JSX |
| Keep components under 150 lines | Build god components that do everything |
| Use `cn()` for conditional classes | String-concatenate class names |
| Add `aria-label` to icon-only buttons | Leave interactive elements unlabeled |

---

*CRM Frontend Guidelines · Version 1.0 · Follow these rules on every PR*
