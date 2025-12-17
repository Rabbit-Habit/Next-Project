/*
  Warnings:

  - You are about to drop the `tbl_team_habit_history` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."tbl_team_habit_history" DROP CONSTRAINT "tbl_team_habit_history_habit_id_fkey";

-- DropTable
DROP TABLE "public"."tbl_team_habit_history";

-- CreateTable
CREATE TABLE "public"."tbl_habit_team_history" (
    "history_team_id" BIGSERIAL NOT NULL,
    "habit_id" BIGINT NOT NULL,
    "team_id" BIGINT NOT NULL,
    "check_date" DATE NOT NULL,
    "is_completed" BOOLEAN NOT NULL DEFAULT true,
    "reg_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_habit_team_history_pkey" PRIMARY KEY ("history_team_id")
);

-- CreateIndex
CREATE INDEX "tbl_habit_team_history_habit_id_team_id_check_date_idx" ON "public"."tbl_habit_team_history"("habit_id", "team_id", "check_date");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_habit_team_history_habit_id_team_id_check_date_key" ON "public"."tbl_habit_team_history"("habit_id", "team_id", "check_date");

-- AddForeignKey
ALTER TABLE "public"."tbl_habit_team_history" ADD CONSTRAINT "tbl_habit_team_history_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "public"."tbl_habit"("habit_id") ON DELETE RESTRICT ON UPDATE CASCADE;
