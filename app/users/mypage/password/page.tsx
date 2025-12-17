"use server"

import Header from "@/app/components/common/header";
import PasswordEditComponent from "@/app/components/users/passwordEditComponent";
import {getServerSession} from "next-auth";
import {authOptions} from '@/lib/auth';
import prisma from "@/backend/lib/prisma";

async function PasswordPage() {
    const session = await getServerSession(authOptions)
    const userId = Number(session?.user.uid)

    const user = await prisma.user.findUnique({
        where: { userId: userId },
        select: {
            isSocial: true
        },
    })
    return (
        <>
            <div>
                <Header title="비밀번호 변경" backUrl={"/users/mypage"}/>
                <PasswordEditComponent isSocial={user!.isSocial}/>
            </div>
        </>
    )
}

export default PasswordPage