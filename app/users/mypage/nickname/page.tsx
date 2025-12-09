"use server"

import prisma from "@/lib/prisma";
import Header from "@/app/components/common/header";
import NicknameEditComponent from "@/app/components/users/nicknameEditComponent";
import {getServerSession} from "next-auth";
import {authOptions} from '@/lib/auth';

async function NicknamePage() {
    const session = await getServerSession(authOptions)
    const userId = Number(session?.user.uid)

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