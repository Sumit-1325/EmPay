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
