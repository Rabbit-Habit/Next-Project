"use server"

import {cookies} from "next/headers";
import prisma from "@/lib/prisma";
import Header from "@/app/components/common/header";
import NicknameEditComponent from "@/app/components/users/nicknameEditComponent";

async function NicknamePage() {
    const cookieStore = await cookies()
    const uid = cookieStore.get("uid")?.value
    const userId = uid ? Number(uid) : undefined

    const user = await prisma.user.findUnique({
        where: { userId: userId },
        select: {
            nickname: true,
        },
    })

    return (
        <>
            <div>
                <Header title="닉네임 변경" backUrl={"/users/mypage"}/>
                <NicknameEditComponent nickname={user!.nickname}/>
            </div>
        </>
    )
}

export default NicknamePage