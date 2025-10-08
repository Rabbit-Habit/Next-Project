"use server"

import Header from "@/app/components/common/header";
import MypageComponent from "@/app/components/users/mypageComponent";
import prisma from "@/lib/prisma";
import {getServerSession} from "next-auth";
import {authOptions} from "@/app/api/auth/[...nextauth]/route";

async function MypagePage() {
    const session = await getServerSession(authOptions)
    const userId = Number(session?.user.uid)

    const user = await prisma.user.findUnique({
        where: { userId: userId },
        select: {
            id: true,
            nickname: true,
            imageUrl: true,
        },
    })

    return (
        <div>
            <Header title="마이페이지" backUrl={"/"}/>
            <MypageComponent id={user!.id} nickname={user!.nickname} imageUrl={user!.imageUrl}/>
        </div>
    )
}

export default MypagePage