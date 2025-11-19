"use server"

import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import {getServerSession} from "next-auth";
import {authOptions} from "@/app/api/auth/[...nextauth]/route";

export async function ChangePasswordAction(formData: FormData): Promise<EditResult> {
    const oldPassword = String(formData.get("oldPassword"))
    const newPassword = String(formData.get("newPassword"))

    const session = await getServerSession(authOptions)
    const userId = session?.user.uid

    if (!userId) {
        console.log("User authentication failed")

        return {
            uid: -1,
            error: "로그인이 필요합니다.",
        }
    }

    try {
        await checkPassword(userId, oldPassword)

        const hashedNewPassword = await bcrypt.hash(newPassword, 10)

        const now = new Date()

        const updatedUser = await prisma.user.update({
            where: { userId },
            data: {
                password: hashedNewPassword,
                modDate: now,
            },
        })

        console.log("Password Changed successful: ", updatedUser)

        return {
            uid: updatedUser.userId,
            error: ""
        }
    } catch (err: any) {
        console.error("Password change failed: ", err)

        return {
            uid: -1,
            error: err.message || "알 수 없는 오류가 발생했습니다.",
        }
    }
}

async function checkPassword(userId: number, password: string) : Promise<void> {
    const user = await prisma.user.findUnique({
        where: { userId },
    })

    if (!user) {
        throw new Error("사용자가 존재하지 않습니다.")
    }

    const isMatch = await bcrypt.compare(password, user.password!)
    if (!isMatch) {
        throw new Error("기존 비밀번호가 올바르지 않습니다.")
    }
}