"use server"

import Header from "@/app/components/common/header";
import MypageComponent from "@/app/components/users/mypageComponent";
import prisma from "@/lib/prisma";
import {useLoginStore} from "@/app/store/useLoginStore";
import {cookies} from "next/headers";


async function MypagePage() {
    const cookieStore = await cookies()
    const uid = cookieStore.get("uid")?.value
    const userId = uid ? Number(uid) : undefined

    const user = await prisma.user.findUnique({
        where: { userId: userId },
        select: {
            nickname: true,
            imageUrl: true,
        },
    })

    return (
        <div>
            <Header title="마이페이지" />
            <MypageComponent nickname={user!.nickname} imageUrl={user!.imageUrl}/>
        </div>
    )
}

export default MypagePage