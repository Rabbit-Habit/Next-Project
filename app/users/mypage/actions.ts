"use server"

import {cookies} from "next/headers";
import {redirect} from "next/navigation";

export async function LogoutAction() {
    const cookieStore = await cookies()

    // 쿠키 삭제하기
    cookieStore.delete("uid")
    cookieStore.delete("accessToken")
    cookieStore.delete("refreshToken")

    // 로그인 페이지로 이동
    redirect("/auth/login")
}