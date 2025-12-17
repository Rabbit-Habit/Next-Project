"use server"

import {createSupabaseClient} from "@/lib/supabase";
import prisma from "@/lib/prisma";
import {uploadProfileImage} from "@/app/users/signup/actions";
import {revalidatePath} from "next/cache";
import {getServerSession} from "next-auth";
import {authOptions} from '@/lib/auth';

export async function ChangeProfileImage(formData: FormData): Promise<EditResult> {
    const session = await getServerSession(authOptions)
    const uid = Number(session?.user.uid)

    if (!uid) {
        console.log("User authentication failed")

        return {
            uid: -1,
            error: "로그인이 필요합니다.",
        }
    }

    const userId = Number(uid)

    const file = formData.get('newProfileImage') as File
    const supabase = createSupabaseClient()

    try {
        const user = await prisma.user.findUnique({
            where: { userId: userId },
            select: {
                imageUrl: true
            },
        })

        if (user?.imageUrl) {
            const fileUrlParts = user.imageUrl.split('/')
            const fileName = fileUrlParts[fileUrlParts.length - 1]
            const filePath = `profile/${fileName}`

            const { error: deleteError } = await supabase.storage
                .from("RabbitHabit")
                .remove([filePath])


            if (deleteError) {
               console.log("Supabase delete failed: ", deleteError.message)
            }
        }

        let newImageUrl = null

        if (file && file.size > 0) {
            newImageUrl = await uploadProfileImage(file, userId);
        }

        const updatedUser = await prisma.user.update({
            where: { userId: userId },
            data: { imageUrl: newImageUrl },
        })

        revalidatePath("/users/mypage")

        return {
            uid: updatedUser.userId,
            error: "",
        }
    } catch (err: any) {
        console.error("Change Profile failed: ", err)

        return {
            uid: -1,
            error: err.message || "알 수 없는 오류가 발생했습니다.",
        }
    }
}