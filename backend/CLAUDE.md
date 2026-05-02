# Backend — Auth_Ready

**Stack:** Node.js ES Modules · Express 5 · Prisma 7 · PostgreSQL · JWT · bcryptjs · express-validator · helmet · express-rate-limit

## Commands

```bash
npm run dev              # nodemon src/index.js → localhost:5000
npm run prisma:migrate   # run pending migrations
npm run prisma:studio    # open Prisma Studio
npm run prisma:generate  # regenerate client after schema change
docker compose up -d     # start postgres + pgAdmin
```

## Layer Architecture

```
Request
  └─ routes/auth.route.js          ← mount + middleware composition
       └─ validators/auth.validator.js  ← express-validator rules
       └─ middleware/auth.middleware.js ← verifyJWT (stateless, reads Bearer token)
       └─ controller/auth.controller.js ← HTTP in/out, calls service
             └─ services/auth.service.js ← business logic + Prisma queries
                   └─ helpers/           ← pure utility functions
```

## Helpers Folder (`src/helpers/`)

| File | What it does |
|------|-------------|
| `normalizers.js` | `normalizeEmail()`, `normalizeLoginId()` — trim + lowercase |
| `formatters.js` | `formatUser()` — strips `passwordHash`, `refreshToken`, `forgotPasswordToken` before sending to client |
| `token-helpers.js` | `issueTokensForUser()` — signs access + refresh JWT, persists refresh to DB |
| `password-helpers.js` | `isPasswordCorrect()` — bcrypt compare wrapper |

## Auth Endpoints (`/api/auth`)

| Method | Path | Auth? | Purpose |
|--------|------|-------|---------|
| POST | `/signup` | No | Create company + first admin user |
| POST | `/login` | No | Login with `loginIdOrEmail` + password |
| POST | `/logout` | Yes | Clear refresh token in DB |
| GET | `/me` | Yes | Get current user profile |
| POST | `/forgot-password` | No | Generate password reset token |
| POST | `/reset-password` | No | Reset password via token |
| PUT | `/change-password` | Yes | Change password (rotates tokens) |
| POST | `/refresh-token` | No | Rotate refresh → new access+refresh pair |

## Token Model

- **Access token:** JWT signed with `ACCESS_TOKEN_SECRET`. Payload: `{ id, companyId, role, loginId, email }`. Default 15 min.
- **Refresh token:** JWT signed with `REFRESH_TOKEN_SECRET`. Payload: `{ id, companyId }`. Default 7 days. Stored in `users.refreshToken`.
- **Delivery:** Both tokens returned in JSON response body (no cookies). Client stores in `localStorage`.
- **Rotation:** refresh token is rotated on `/refresh-token` and `/change-password`.

## Flexible Login

`loginUser()` in `auth.service.js` accepts `loginIdOrEmail`. It queries:
```js
prisma.user.findFirst({ where: { OR: [{ loginId }, { email }] } })
```
Validator `auth.validator.js` accepts either a valid loginId pattern OR a valid email format.

## Response Contract

```js
// Success
{ statusCode, message, data, success: true }

// Error
{ statusCode, message, errors: [{ path, msg }], success: false }
```

## Security Middleware

Applied in `src/index.js` and `src/routes/auth.route.js`:

| Middleware | Where | Config |
|-----------|-------|--------|
| `helmet()` | Global (all routes) | Default — sets 11 security headers |
| `loginLimiter` | `POST /login` | 10 requests / 15 min per IP |
| `forgotPasswordLimiter` | `POST /forgot-password` | 5 requests / 1 hour per IP |

## Database Models

- **Company** — tenant root
- **User** — `id, companyId, name, loginId, email, passwordHash, refreshToken, role, forgotPasswordToken, forgotPasswordTokenExpiry`
- **Unique constraints:** `(companyId, loginId)` and `(companyId, email)`
- **Indexes:** `@@index([email])` and `@@index([loginId])` — speeds up cross-company lookups in forgot-password and login flows
- **Enum UserRole:** `company_admin | engineering | approver | ops`

## Key ENV Variables

```
PORT=5000
DATABASE_URL=postgresql://admin:secret@localhost:5432/mydb
ACCESS_TOKEN_SECRET=...
REFRESH_TOKEN_SECRET=...
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_MINUTES=10080
FRONTEND_URL=http://localhost:5173
```

## Rules

- Always run `prisma:generate` after changing `schema.prisma`
- After adding migrations run `prisma:migrate` then `prisma:generate`
- `formatUser()` is the **security boundary** — always use it before sending user data to client
- Update `src/docs/architecture_context.md` when auth behavior changes
- Never add business logic to controllers — keep it in services
- Never add Prisma queries to helpers — keep them in services
- Rate limiters live in `auth.route.js` — add new limiters there, not in `index.js`

## Leave Module (`/api/leave` and `/api/leave/allocations`)

### Leave Requests — `routes/leave.route.js`

| Method | Path | Roles | Purpose |
|--------|------|-------|---------|
| GET | `/` | All | List leave requests (employees see own; managers see all) |
| POST | `/` | All | Create leave request (+ optional `attachment` image via multer) |
| PUT | `/:id/:action` | ADMIN, HR_OFFICER, PAYROLL_OFFICER | Approve or reject a request |
| DELETE | `/:id` | Owner / ADMIN | Cancel/delete a request |

**FormData + isPaid validator:** `isPaid` is sent as a string `"true"`/`"false"` via `FormData`. Validator uses `isBoolean({ strict: false })` + a `customSanitizer` to normalise it to an actual boolean before reaching the service.

**Sick leave attachment:** Multer (`uploadDoc`) accepts `image/*` only (JPEG, PNG, GIF, WEBP — no PDF). File is uploaded to Cloudinary via `uploadLeaveAttachment()` using `resource_type: "auto"`. URL stored in `leave_requests.attachment_url`.

### Leave Allocations — `routes/leave-allocation.route.js`

Mounted at `/api/leave/allocations` in `index.js`.

| Method | Path | Roles | Purpose |
|--------|------|-------|---------|
| GET | `/me` | All (authenticated) | Get current user's active allocations (within validity period) |
| GET | `/` | ADMIN, HR_OFFICER | List all allocations for the company |
| POST | `/` | ADMIN, HR_OFFICER | Create a new leave allocation |
| DELETE | `/:id` | ADMIN, HR_OFFICER | Delete an allocation |

**Service:** `services/leave-allocation.service.js`
- `getMyAllocations(companyId, userId)` — filters by `startDate <= today` AND (`endDate >= today` OR `endDate IS NULL`)
- `listAllocations(companyId)` — returns all, includes `user` and `creator` relations
- `createAllocation(companyId, createdBy, data)` — validates employee belongs to company, days ≥ 0, startDate ≤ endDate
- `deleteAllocation(companyId, allocationId)` — validates company scope before deletion

## Prisma Schema — Key Models

### LeaveAllocation
```prisma
model LeaveAllocation {
  id        Int       @id @default(autoincrement())
  companyId Int
  userId    Int       // employee receiving the allocation
  leaveType String    @db.VarChar(50)
  startDate DateTime  @db.Date
  endDate   DateTime? @db.Date  // null = no expiry
  days      Int
  note      String?
  createdBy Int
  createdAt DateTime  @default(now())

  company Company @relation(...)
  user    User    @relation("UserAllocations", ...)
  creator User    @relation("AllocationCreator", ...)
}
```
Migration: `20260502190717_add_leave_allocation`

### User relations added
```prisma
allocations   LeaveAllocation[] @relation("UserAllocations")
createdAllocs LeaveAllocation[] @relation("AllocationCreator")
```

### Company relations added
```prisma
leaveAllocations LeaveAllocation[]
```

## File Upload Pattern

Multer middleware lives in `middleware/multer.middleware.js`:
- `uploadImage` — for avatar/profile images (JPEG, PNG, GIF, WEBP)
- `uploadDoc` — for leave certificate attachments (images only: JPEG, PNG, GIF, WEBP)

After multer saves to `/tmp`, upload to Cloudinary then **delete the local file** (`fs.unlinkSync`).

```js
// In route:
router.post("/", uploadDoc.single("attachment"), validators, validatorMiddleware, controller);

// In service — file path from multer:
const attachmentUrl = req.file?.path
  ? await uploadLeaveAttachment(req.file.path)
  : null;
```

`uploadLeaveAttachment()` in `utils/cloudinary.js` uses `folder: "leave-attachments"` and `resource_type: "auto"`.

## Attendance Work-Hours Gate

The frontend (`Topbar.jsx`) reads `user.company.workStartTime` and `user.company.workEndTime` to gate check-in. The backend does **not** currently enforce this — the gate is frontend-only. If server-side enforcement is needed, add a time check in the attendance check-in service.

## Payroll Module (`/api/payroll`)

Migration: `20260502210155_add_payroll_details`

### Routes — `routes/payroll.route.js`

| Method | Path | Roles | Purpose |
|--------|------|-------|---------|
| GET | `/dashboard` | ADMIN, PAYROLL_OFFICER, HR_OFFICER | Summary + charts for payroll dashboard |
| POST | `/run` | ADMIN, PAYROLL_OFFICER | Batch-run payroll for all employees for a given month/year |
| GET | `/payruns` | ADMIN, PAYROLL_OFFICER | List months that have been run, with payslip counts + totals |
| GET | `/` | All | List payslips (EMPLOYEE sees own only) |
| GET | `/:id` | All (own for EMPLOYEE) | Full payslip with user + company detail |
| GET | `/:id/pdf` | All (own for EMPLOYEE) | Print-ready HTML payslip — use `res.send(html)` |
| PATCH | `/:id/pay` | ADMIN, PAYROLL_OFFICER | Mark payslip as paid (`paidAt = now()`) |

### Service functions — `services/payroll.service.js`

- `countWorkingDays(year, month)` — counts Mon–Fri days in month (exported, used by run + frontend preview)
- `computePayableDays(userId, companyId, month, year)` — queries attendance + approved leaves, returns `{ payableDays, presentCount, halfCount, paidLeaveDays, unpaidLeaveDays }`
- `computePayslipObject(employee, company, totalWorkingDays, attendanceSummary)` — pure function, returns all payslip fields without saving
- `runPayroll(companyId, month, year)` — batch creates payslips for all employees; skips those without `basicSalary` or with existing payslip; returns results + errors array
- `listPayruns(companyId)` — groupBy year/month, returns `{ label, payslipCount, totalNet, totalCost }`
- `generatePayslipHtml(companyId, payslipId, userId, role)` — returns full HTML string for print/PDF

### Payslip model fields (full breakdown stored in DB)

Earnings: `basicSalary`, `hra`, `standardAllowance`, `performanceBonus`, `lta`, `fixedAllowance`, `grossPay`
Deductions: `pfEmployee`, `pfEmployer`, `professionalTax`, `tds`, `totalDeductions`
Summary: `netPay`, `employerCost`, `totalWorkingDays`, `payableDays`, `attendancePresent`, `attendanceHalf`, `paidLeaveDays`, `unpaidLeaveDays`

### Company allowance config (editable via `PUT /api/company/settings`)

| Field | Default | Description |
|-------|---------|-------------|
| `hraPercent` | 50 | % of basicProrated |
| `standardAllowancePercent` | 16.67 | % of basicProrated |
| `performanceBonusPercent` | 8.33 | % of basicProrated |
| `ltaPercent` | 8.33 | % of basicProrated |
| `fixedAllowancePercent` | 16.67 | % of basicProrated |
| `professionalTaxAmount` | 200 | Fixed ₹ deduction per month |
