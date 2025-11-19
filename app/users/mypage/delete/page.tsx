"use server"

import Header from "@/app/components/common/header";
import DeleteComponent from "@/app/components/users/deleteComponent";
import {cookies} from "next/headers";
import prisma from "@/lib/prisma";
import {getServerSession} from "next-auth";
import {authOptions} from "@/app/api/auth/[...nextauth]/route";

async function DeletePage() {
    const session = await getServerSession(authOptions)
    const uid = Number(session?.user.uid)
    const userId = uid ? Number(uid) : undefined

    const user = await prisma.user.findUnique({
        where: { userId: userId },
        select: {
            nickname: true,
        },
    })

    return (
        <div>
            <div>
                <Header title="회원 탈퇴" backUrl={"/users/mypage"}/>
                <DeleteComponent nickname={user!.nickname}/>
            </div>
        </div>
    )
}

export default DeletePage