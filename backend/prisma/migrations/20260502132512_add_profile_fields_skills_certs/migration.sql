-- AlterTable
ALTER TABLE "users" ADD COLUMN     "about" TEXT,
ADD COLUMN     "break_time_hours" DOUBLE PRECISION NOT NULL DEFAULT 1,
ADD COLUMN     "interests" TEXT,
ADD COLUMN     "job_passion" TEXT,
ADD COLUMN     "location" VARCHAR(100),
ADD COLUMN     "mobile" VARCHAR(20),
ADD COLUMN     "monthly_wage" DOUBLE PRECISION,
ADD COLUMN     "pf_rate" DOUBLE PRECISION NOT NULL DEFAULT 12,
ADD COLUMN     "working_days_per_week" INTEGER NOT NULL DEFAULT 5;

-- CreateTable
CREATE TABLE "skills" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certifications" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "issued_by" VARCHAR(200),
    "issued_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "certifications_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "skills" ADD CONSTRAINT "skills_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certifications" ADD CONSTRAINT "certifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
