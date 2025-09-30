"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import {createSupabaseClient} from "@/lib/supabase";

export async function SignupAction(formData: FormData): Promise<SignupResult> {
    const id = String(formData.get("id"))
    const password = String(formData.get("password"))
    const nickname = String(formData.get("nickname"))
    const file = formData.get("imageURL") as File | null;

    try {
        const now = new Date()

        const saltRounds = 10
        const hashedPassword = await bcrypt.hash(password, saltRounds)

        let newUser = await prisma.user.create({
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

        let imageUrl: string | null = null

        try {
            if (file) {
                imageUrl = await uploadProfileImage(file, newUser.userId);
            }
        } catch (err: any) {
            console.error("Image Upload failed: ", err.message);
        }

        if (imageUrl) {
            newUser = await prisma.user.update({
                where: {userId: newUser.userId},
                data: {imageUrl: imageUrl, modDate: new Date()},
            })
        }

        console.log("Signup successful: ", newUser)

        return {
            result: newUser.userId,
            error: "",
        }
    } catch (err: any) {
        console.error("Signup failed: ", err)

        return {
            result: -1,
            error: err.message || "알 수 없는 오류가 발생했습니다.",
        }
    }
}

export async function uploadProfileImage(file: File, userId: number): Promise<string> {
    const supabase = createSupabaseClient()

    const fileExt = file.name.split(".").pop()
    const filePath = `profile/${userId}-${Date.now()}.${fileExt}`

    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabase.storage
        .from("RabbitHabit")
        .upload(filePath, buffer, {
            contentType: file.type,
            upsert: true,
        });

    if (uploadError) {
        throw new Error(uploadError.message);
    }

    const { data } = supabase.storage.from("RabbitHabit").getPublicUrl(filePath);
    return data.publicUrl;
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