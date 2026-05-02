# EmPay HRMS — Full-Stack Project

Multi-tenant HRMS (Human Resource Management System). Each company that registers gets its own isolated workspace. **Backend and frontend are separate packages** — always `cd` into the right folder before running commands.

## Project Layout

```
EmPay/
  backend/    ← Node.js + Express 5 + Prisma 7 + PostgreSQL
  frontend/   ← React 19 + Vite 8 + Tailwind v4 + shadcn/ui
```

## Quick Start

```bash
# Database (Docker)
cd backend && docker compose up -d          # starts PostgreSQL + pgAdmin

# Backend
cd backend && npm run dev                   # http://localhost:8000

# Frontend
cd frontend && npm run dev                  # http://localhost:5173
```

## How User Creation Works (Critical)

```
Company Owner  →  POST /api/auth/register  →  picks own password  →  mustChangePassword = false
HR / Employee  →  POST /api/employees      →  system temp password →  mustChangePassword = true
                                                                       must change on first login
```

**Normal users CANNOT self-register.** Only Admin/HR Officers can create employees via the employees API. The system auto-generates a `loginId` and a one-time temp password returned in the creation response.

## Key Facts

- **Auth:** JWT access token (15 min) + refresh token (7 days). Both returned in response body. Client stores in `localStorage`.
- **Login:** accepts either `loginId` (auto-generated, uppercase) **or** email.
- **No cookies** — header-based auth (`Authorization: Bearer <token>`).
- **mustChangePassword wall:** any user created by Admin/HR is blocked from all routes except `GET /me` and `PUT /auth/change-password` until they change their temp password.
- **Multi-tenancy:** every DB table scoped by `companyId`. Company A cannot read Company B's data.
- **DB GUI:** pgAdmin at `http://localhost:5050` (admin@admin.com / admin). Connect to host `postgres` port `5432`.
- **API base URL:** `http://localhost:8000/api`

## LoginId Format

```
{COMPANY_CODE}{FIRST2 of firstName}{LAST2 of lastName}{YEAR}{SERIAL}
Example: OISUTH20260001
```

## Roles

| Role | Created by | Can do |
|------|-----------|--------|
| ADMIN | Self-registers | Full company control |
| HR_OFFICER | Admin | Create/edit employees |
| PAYROLL_OFFICER | Admin or HR | Approve leaves, manage payroll |
| EMPLOYEE | Admin or HR | Own attendance/leave/payslips |
| SUPER_ADMIN | Platform only | Cross-company (not yet wired) |

## API Routes Summary

```
POST   /api/auth/register          ← new company signup (public)
POST   /api/auth/login             ← login (public)
GET    /api/auth/me                ← current user
PUT    /api/auth/change-password   ← change password (clears mustChangePassword)
POST   /api/auth/logout
POST   /api/auth/refresh-token
POST   /api/auth/forgot-password
POST   /api/auth/reset-password

GET/POST        /api/employees
GET/PUT/DELETE  /api/employees/:id

GET             /api/attendance
POST            /api/attendance/check-in
POST            /api/attendance/check-out
PUT             /api/attendance/:id

GET/POST        /api/leave
PUT             /api/leave/:id/approve
PUT             /api/leave/:id/reject
DELETE          /api/leave/:id

GET/POST        /api/payroll
GET             /api/payroll/:id
PATCH           /api/payroll/:id/pay
```

## Environment Files

| File | Purpose |
|------|---------|
| `backend/.env` | DB connection, JWT secrets, port, CORS, Brevo/Cloudinary keys |
| `frontend/.env` | `VITE_API_URL=http://localhost:8000/api` |

## Boundaries — Read Before Touching Anything

- **Backend changes**: update `backend/src/docs/architecture_context.md` in the same commit.
- **Frontend changes**: follow `frontend/guides/frontend-guidelines.md`. No inline styles, no hardcoded hex colors, no Framer Motion.
- **Do not edit** `frontend/src/components/ui/` — shadcn primitives, never modify.
- **Do not edit** `backend/src/lib/generated/` — Prisma auto-generated client.
