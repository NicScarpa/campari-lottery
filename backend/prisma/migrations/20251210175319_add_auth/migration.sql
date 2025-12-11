-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STAFF', 'ADMIN');

-- AlterTable
ALTER TABLE "PrizeAssignment" ADD COLUMN     "redeemed_at" TIMESTAMP(3),
ADD COLUMN     "redeemed_by_staff_id" TEXT;

-- CreateTable
CREATE TABLE "StaffUser" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StaffUser_username_key" ON "StaffUser"("username");

-- AddForeignKey
ALTER TABLE "PrizeAssignment" ADD CONSTRAINT "PrizeAssignment_redeemed_by_staff_id_fkey" FOREIGN KEY ("redeemed_by_staff_id") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
