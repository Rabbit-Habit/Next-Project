"use server"

import Header from "@/app/components/common/header";
import DeleteComponent from "@/app/components/users/deleteComponent";
import {cookies} from "next/headers";
import prisma from "@/lib/prisma";

async function DeletePage() {
    const cookieStore = await cookies()
    const uid = cookieStore.get("uid")?.value
    const userId = uid ? Number(uid) : undefined

    const user = await prisma.user.findUnique({
        where: { userId: userId },
        select: {
            password: true,
        },
    })

    return (
        <div>
            <div>
                <Header title="회원 탈퇴" backUrl={"/users/mypage"}/>
                <DeleteComponent password={user!.password}/>
            </div>
        </div>
    )
}

export default DeletePage