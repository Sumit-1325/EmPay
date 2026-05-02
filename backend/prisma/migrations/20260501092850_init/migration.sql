-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('company_admin', 'engineering', 'approver', 'ops');

-- CreateTable
CREATE TABLE "companies" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "login_id" VARCHAR(12) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL,
    "refreshToken" TEXT,
    "forgot_password_token" VARCHAR(255),
    "forgot_password_token_expiry" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_company_id_login_id_key" ON "users"("company_id", "login_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_company_id_email_key" ON "users"("company_id", "email");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
