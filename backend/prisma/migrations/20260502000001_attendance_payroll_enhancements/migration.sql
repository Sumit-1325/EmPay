-- ─── Company: add standard_hours ─────────────────────────────────────────────
ALTER TABLE "companies"
  ADD COLUMN "standard_hours" INTEGER NOT NULL DEFAULT 8;

-- ─── Attendance: add work_hours and extra_hours ───────────────────────────────
ALTER TABLE "attendance"
  ADD COLUMN "work_hours"  DOUBLE PRECISION,
  ADD COLUMN "extra_hours" DOUBLE PRECISION;

-- ─── LeaveRequest: add is_paid ────────────────────────────────────────────────
ALTER TABLE "leave_requests"
  ADD COLUMN "is_paid" BOOLEAN NOT NULL DEFAULT true;

-- ─── Payslip: add total_working_days and payable_days ────────────────────────
-- Add as nullable first so existing rows don't break, then backfill, then constrain
ALTER TABLE "payslips"
  ADD COLUMN "total_working_days" INTEGER,
  ADD COLUMN "payable_days"       DOUBLE PRECISION;

-- Backfill existing payslips with 0 so NOT NULL can be applied
UPDATE "payslips" SET "total_working_days" = 0, "payable_days" = 0 WHERE "total_working_days" IS NULL;

ALTER TABLE "payslips"
  ALTER COLUMN "total_working_days" SET NOT NULL,
  ALTER COLUMN "payable_days"       SET NOT NULL;
