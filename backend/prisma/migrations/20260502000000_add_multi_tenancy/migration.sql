-- ─── Step 1: Rename existing UserRole enum values to new HRMS names ─────────
ALTER TYPE "UserRole" RENAME VALUE 'company_admin' TO 'ADMIN';
ALTER TYPE "UserRole" RENAME VALUE 'engineering'   TO 'EMPLOYEE';
ALTER TYPE "UserRole" RENAME VALUE 'approver'      TO 'PAYROLL_OFFICER';
ALTER TYPE "UserRole" RENAME VALUE 'ops'           TO 'HR_OFFICER';

-- ─── Step 2: Add new UserRole values ────────────────────────────────────────
ALTER TYPE "UserRole" ADD VALUE 'SUPER_ADMIN';

-- ─── Step 3: Add new enums ───────────────────────────────────────────────────
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE');
CREATE TYPE "LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- ─── Step 4: Add new columns to companies ───────────────────────────────────
ALTER TABLE "companies"
  ADD COLUMN "code"     VARCHAR(10),
  ADD COLUMN "logo_url" TEXT;

-- ─── Step 5: Backfill company code from name (slug-style, max 4 chars upper) ─
UPDATE "companies"
SET "code" = UPPER(SUBSTRING(REGEXP_REPLACE(name, '[^a-zA-Z0-9]', '', 'g'), 1, 4))
WHERE "code" IS NULL;

-- Ensure uniqueness — append id if collision
UPDATE "companies" c
SET "code" = UPPER(SUBSTRING(REGEXP_REPLACE(name, '[^a-zA-Z0-9]', '', 'g'), 1, 3)) || c.id::text
WHERE "code" IN (
  SELECT "code" FROM "companies" GROUP BY "code" HAVING COUNT(*) > 1
);

-- ─── Step 6: Make company code NOT NULL and unique ───────────────────────────
ALTER TABLE "companies" ALTER COLUMN "code" SET NOT NULL;
CREATE UNIQUE INDEX "companies_code_key" ON "companies"("code");

-- ─── Step 7: Rename refreshToken → refresh_token on users ───────────────────
ALTER TABLE "users" RENAME COLUMN "refreshToken" TO "refresh_token";

-- ─── Step 8: Expand login_id column to VARCHAR(20) ──────────────────────────
ALTER TABLE "users" ALTER COLUMN "login_id" TYPE VARCHAR(20);

-- ─── Step 9: Add new columns to users ───────────────────────────────────────
ALTER TABLE "users"
  ADD COLUMN "first_name"           VARCHAR(100),
  ADD COLUMN "last_name"            VARCHAR(100),
  ADD COLUMN "joining_date"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "basic_salary"         DOUBLE PRECISION,
  ADD COLUMN "pf_number"            VARCHAR(50),
  ADD COLUMN "must_change_password" BOOLEAN NOT NULL DEFAULT true;

-- ─── Step 10: Backfill first_name / last_name from name ──────────────────────
UPDATE "users"
SET
  "first_name" = SPLIT_PART(name, ' ', 1),
  "last_name"  = NULLIF(TRIM(SUBSTRING(name FROM POSITION(' ' IN name))), '');

-- ─── Step 11: Add missing indexes on users ───────────────────────────────────
CREATE INDEX IF NOT EXISTS "users_email_idx"    ON "users"("email");
CREATE INDEX IF NOT EXISTS "users_login_id_idx" ON "users"("login_id");

-- ─── Step 12: Create attendance table ────────────────────────────────────────
CREATE TABLE "attendance" (
    "id"         SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "user_id"    INTEGER NOT NULL,
    "date"       DATE NOT NULL,
    "check_in"   TIMESTAMP(3),
    "check_out"  TIMESTAMP(3),
    "status"     "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "attendance_user_id_date_key"   ON "attendance"("user_id", "date");
CREATE INDEX        "attendance_company_id_date_idx" ON "attendance"("company_id", "date");

ALTER TABLE "attendance"
  ADD CONSTRAINT "attendance_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "attendance_user_id_fkey"    FOREIGN KEY ("user_id")    REFERENCES "users"("id")     ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── Step 13: Create leave_requests table ────────────────────────────────────
CREATE TABLE "leave_requests" (
    "id"          SERIAL NOT NULL,
    "company_id"  INTEGER NOT NULL,
    "user_id"     INTEGER NOT NULL,
    "leave_type"  VARCHAR(50) NOT NULL,
    "start_date"  DATE NOT NULL,
    "end_date"    DATE NOT NULL,
    "reason"      TEXT,
    "status"      "LeaveStatus" NOT NULL DEFAULT 'PENDING',
    "approved_by" INTEGER,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "leave_requests_company_id_user_id_idx" ON "leave_requests"("company_id", "user_id");

ALTER TABLE "leave_requests"
  ADD CONSTRAINT "leave_requests_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "leave_requests_user_id_fkey"    FOREIGN KEY ("user_id")    REFERENCES "users"("id")     ON UPDATE CASCADE;

-- ─── Step 14: Create payslips table ──────────────────────────────────────────
CREATE TABLE "payslips" (
    "id"           SERIAL NOT NULL,
    "company_id"   INTEGER NOT NULL,
    "user_id"      INTEGER NOT NULL,
    "month"        INTEGER NOT NULL,
    "year"         INTEGER NOT NULL,
    "basic_salary" DOUBLE PRECISION NOT NULL,
    "deductions"   DOUBLE PRECISION NOT NULL DEFAULT 0,
    "net_pay"      DOUBLE PRECISION NOT NULL,
    "paid_at"      TIMESTAMP(3),
    "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payslips_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payslips_user_id_month_year_key"    ON "payslips"("user_id", "month", "year");
CREATE INDEX        "payslips_company_id_year_month_idx" ON "payslips"("company_id", "year", "month");

ALTER TABLE "payslips"
  ADD CONSTRAINT "payslips_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "payslips_user_id_fkey"    FOREIGN KEY ("user_id")    REFERENCES "users"("id")     ON UPDATE CASCADE;
