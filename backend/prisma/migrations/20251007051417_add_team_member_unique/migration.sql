-- CreateTable
CREATE TABLE "public"."tbl_user" (
    "user_id" SERIAL NOT NULL,
    "id" TEXT NOT NULL,
    "password" TEXT,
    "is_social" BOOLEAN NOT NULL DEFAULT false,
    "image_url" TEXT,
    "nickname" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "reg_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mod_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_user_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "public"."tbl_chat_channels" (
    "channel_id" SERIAL NOT NULL,
    "habit_id" INTEGER NOT NULL,
    "reg_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_chat_channels_pkey" PRIMARY KEY ("channel_id")
);

-- CreateTable
CREATE TABLE "public"."tbl_chat_message" (
    "message_id" SERIAL NOT NULL,
    "channel_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "reg_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_chat_message_pkey" PRIMARY KEY ("message_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_user_id_key" ON "public"."tbl_user"("id");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_user_nickname_key" ON "public"."tbl_user"("nickname");

-- CreateIndex
CREATE INDEX "idx_channel_date" ON "public"."tbl_chat_message"("channel_id", "reg_date");

-- AddForeignKey
ALTER TABLE "public"."tbl_chat_message" ADD CONSTRAINT "tbl_chat_message_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "public"."tbl_chat_channels"("channel_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tbl_chat_message" ADD CONSTRAINT "tbl_chat_message_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."tbl_user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
