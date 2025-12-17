/*
  Warnings:

  - A unique constraint covering the columns `[team_id]` on the table `tbl_habit` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."TeamRole" AS ENUM ('LEADER', 'MEMBER');

-- DropIndex
DROP INDEX "public"."tbl_habit_team_id_idx";

-- CreateTable
CREATE TABLE "public"."tbl_team" (
    "team_id" BIGSERIAL NOT NULL,
    "name" TEXT,
    "regDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_team_pkey" PRIMARY KEY ("team_id")
);

-- CreateTable
CREATE TABLE "public"."tbl_team_member" (
    "team_member_id" BIGSERIAL NOT NULL,
    "teamId" BIGINT NOT NULL,
    "userId" BIGINT NOT NULL,
    "role" "public"."TeamRole" NOT NULL,
    "regDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_team_member_pkey" PRIMARY KEY ("team_member_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_team_member_teamId_userId_key" ON "public"."tbl_team_member"("teamId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_habit_team_id_key" ON "public"."tbl_habit"("team_id");

-- AddForeignKey
ALTER TABLE "public"."tbl_habit" ADD CONSTRAINT "tbl_habit_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."tbl_team"("team_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tbl_team_member" ADD CONSTRAINT "tbl_team_member_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."tbl_team"("team_id") ON DELETE RESTRICT ON UPDATE CASCADE;
