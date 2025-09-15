"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function SignupAction(formData: FormData): Promise<SignupResult> {
    const id = String(formData.get("id"))
    const password = String(formData.get("password"))
    const nickname = String(formData.get("nickname"))

    try {
        const now = new Date()

        const saltRounds = 10
        const hashedPassword = await bcrypt.hash(password, saltRounds)

        const newUser = await prisma.user.create({
            data: {
                id,
                password: hashedPassword,
                nickname,
                isSocial: false,
                isDeleted: false,
                regDate: now,
                modDate: now,
            },
        })

        console.log("Signup successful: ", newUser)

        return {
            result: newUser.userId,
            error: "",
        }
    } catch (err: any) {
        console.error("Signup failed: ", err)

        return {
            result: -1,
            error: err.message || "Unknown error",
        }
    }
}

export async function CheckIdAction(id: string): Promise<boolean> {
    try {
        const existing = await prisma.user.findUnique({
            where: { id },
        });
        return !existing;
    } catch (err) {
        console.error("CheckIdAction failed: ", err)
        return false
    }
}

export async function CheckNicknameAction(nickname: string): Promise<boolean> {
    try {
        const existing = await prisma.user.findUnique({
            where: { nickname },
        })
        return !existing
    } catch (err) {
        console.error("CheckNicknameAction failed: ", err);
        return false
    }
}