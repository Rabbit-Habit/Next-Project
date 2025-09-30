"use server"

import prisma from "@/lib/prisma";
import {cookies} from "next/headers";
import {revalidatePath} from "next/cache";

export async function NicknameEditAction(formData: FormData): Promise<EditResult> {
    const nickname = String(formData.get("nickname"))

    const cookieStore = await cookies()
    const uid = cookieStore.get('uid')?.value

    if (!uid) {
        console.log("User authentication failed")

        return {
            uid: -1,
            error: "로그인이 필요합니다.",
        }
    }

    try {
        const now = new Date()

        const updatedUser = await prisma.user.update({
            where: { userId: parseInt(uid) },
            data: {
                nickname: nickname,
                modDate: now,
            },
        })

        console.log("Nickname Changed successful: ", updatedUser)

        revalidatePath("/users/mypage/nickname")

        return {
            uid: updatedUser.userId,
            error: "",
        }
    } catch (err: any) {
        console.error("Nickname Change Failed: ", err)

        return {
            uid: -1,
            error: err.message || "알 수 없는 오류가 발생했습니다.",
        }
    }
}