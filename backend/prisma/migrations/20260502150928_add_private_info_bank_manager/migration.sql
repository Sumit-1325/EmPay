-- AlterTable
ALTER TABLE "users" ADD COLUMN     "address" TEXT,
ADD COLUMN     "bank_account_number" VARCHAR(50),
ADD COLUMN     "bank_name" VARCHAR(100),
ADD COLUMN     "date_of_birth" DATE,
ADD COLUMN     "emp_code" VARCHAR(50),
ADD COLUMN     "gender" VARCHAR(20),
ADD COLUMN     "ifsc_code" VARCHAR(20),
ADD COLUMN     "job_title" VARCHAR(100),
ADD COLUMN     "manager_id" INTEGER,
ADD COLUMN     "marital_status" VARCHAR(20),
ADD COLUMN     "nationality" VARCHAR(100),
ADD COLUMN     "pan_number" VARCHAR(20),
ADD COLUMN     "personal_email" VARCHAR(255),
ADD COLUMN     "uan_number" VARCHAR(30);

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
