/*
  Warnings:

  - You are about to drop the column `deductions` on the `payslips` table. All the data in the column will be lost.
  - Added the required column `gross_pay` to the `payslips` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "fixed_allowance_percent" DOUBLE PRECISION NOT NULL DEFAULT 16.67,
ADD COLUMN     "hra_percent" DOUBLE PRECISION NOT NULL DEFAULT 50,
ADD COLUMN     "lta_percent" DOUBLE PRECISION NOT NULL DEFAULT 8.33,
ADD COLUMN     "performance_bonus_percent" DOUBLE PRECISION NOT NULL DEFAULT 8.33,
ADD COLUMN     "professional_tax_amount" DOUBLE PRECISION NOT NULL DEFAULT 200,
ADD COLUMN     "standard_allowance_percent" DOUBLE PRECISION NOT NULL DEFAULT 16.67;

-- AlterTable
ALTER TABLE "payslips" DROP COLUMN "deductions",
ADD COLUMN     "attendance_half" INTEGER,
ADD COLUMN     "attendance_present" INTEGER,
ADD COLUMN     "employer_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "fixed_allowance" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "gross_pay" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "hra" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "lta" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "paid_leave_days" INTEGER,
ADD COLUMN     "performance_bonus" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "pf_employee" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "pf_employer" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "professional_tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "standard_allowance" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "tds" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "total_deductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "unpaid_leave_days" INTEGER;
