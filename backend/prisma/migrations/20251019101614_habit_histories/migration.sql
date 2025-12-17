/*
  Warnings:

  - You are about to alter the column `user_id` on the `tbl_habit` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `userId` on the `tbl_team_member` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - Made the column `combo` on table `tbl_habit` required. This step will fail if there are existing NULL values in that column.
  - Made the column `reg_date` on table `tbl_habit` required. This step will fail if there are existing NULL values in that column.
  - Made the column `mod_date` on table `tbl_habit` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."tbl_habit" DROP CONSTRAINT "tbl_habit_team_id_fkey";

-- AlterTable
ALTER TABLE "public"."tbl_habit" ALTER COLUMN "user_id" SET DATA TYPE INTEGER,
ALTER COLUMN "team_id" DROP NOT NULL,
ALTER COLUMN "rabbit_status" SET DEFAULT 'alive',
ALTER COLUMN "combo" SET NOT NULL,
ALTER COLUMN "combo" SET DEFAULT 0,
ALTER COLUMN "reg_date" SET NOT NULL,
ALTER COLUMN "reg_date" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "mod_date" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."tbl_team_member" ALTER COLUMN "userId" SET DATA TYPE INTEGER;

-- CreateTable
CREATE TABLE "public"."tbl_habit_history" (
    "history_id" BIGSERIAL NOT NULL,
    "habit_id" BIGINT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "check_date" DATE NOT NULL,
    "is_completed" BOOLEAN NOT NULL DEFAULT true,
    "reg_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_habit_history_pkey" PRIMARY KEY ("history_id")
);

-- CreateTable
CREATE TABLE "public"."tbl_team_habit_history" (
    "team_history_id" BIGSERIAL NOT NULL,
    "habit_id" BIGINT NOT NULL,
    "team_id" BIGINT NOT NULL,
    "check_date" DATE NOT NULL,
    "is_completed" BOOLEAN NOT NULL DEFAULT true,
    "user_id" INTEGER NOT NULL,
    "reg_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_team_habit_history_pkey" PRIMARY KEY ("team_history_id")
);

-- CreateIndex
CREATE INDEX "tbl_habit_history_habit_id_check_date_idx" ON "public"."tbl_habit_history"("habit_id", "check_date");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_habit_history_habit_id_user_id_check_date_key" ON "public"."tbl_habit_history"("habit_id", "user_id", "check_date");

-- CreateIndex
CREATE INDEX "tbl_team_habit_history_habit_id_team_id_check_date_idx" ON "public"."tbl_team_habit_history"("habit_id", "team_id", "check_date");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_team_habit_history_habit_id_team_id_user_id_check_date_key" ON "public"."tbl_team_habit_history"("habit_id", "team_id", "user_id", "check_date");

-- AddForeignKey
ALTER TABLE "public"."tbl_habit" ADD CONSTRAINT "tbl_habit_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."tbl_team"("team_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tbl_habit_history" ADD CONSTRAINT "tbl_habit_history_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "public"."tbl_habit"("habit_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tbl_team_habit_history" ADD CONSTRAINT "tbl_team_habit_history_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "public"."tbl_habit"("habit_id") ON DELETE RESTRICT ON UPDATE CASCADE;
