-- CreateEnum
CREATE TYPE "public"."RabbitStatus" AS ENUM ('alive', 'hungry', 'escaped');

-- CreateTable
CREATE TABLE "public"."tbl_habit" (
    "habit_id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "team_id" BIGINT NOT NULL,
    "title" VARCHAR(255),
    "goal_detail" VARCHAR(255),
    "goal_count" BIGINT,
    "rabbit_name" VARCHAR(255) NOT NULL,
    "rabbit_status" "public"."RabbitStatus" NOT NULL,
    "invite_code" VARCHAR(255),
    "combo" BIGINT,
    "reg_date" TIMESTAMP(3),
    "mod_date" TIMESTAMP(3),
    "is_attendance" BOOLEAN,
    "target_lat" DECIMAL(9,6),
    "target_lng" DECIMAL(9,6),

    CONSTRAINT "tbl_habit_pkey" PRIMARY KEY ("habit_id")
);

-- CreateIndex
CREATE INDEX "tbl_habit_user_id_idx" ON "public"."tbl_habit"("user_id");

-- CreateIndex
CREATE INDEX "tbl_habit_team_id_idx" ON "public"."tbl_habit"("team_id");
