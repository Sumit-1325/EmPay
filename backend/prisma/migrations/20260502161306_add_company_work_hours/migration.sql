-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "work_end_time" VARCHAR(5) NOT NULL DEFAULT '17:00',
ADD COLUMN     "work_start_time" VARCHAR(5) NOT NULL DEFAULT '09:00',
ALTER COLUMN "standard_hours" SET DEFAULT 8,
ALTER COLUMN "standard_hours" SET DATA TYPE DOUBLE PRECISION;
