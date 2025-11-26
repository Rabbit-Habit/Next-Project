"use server"

import {createJWT} from "@/app/util/jwtUtil";
import {cookies} from "next/headers";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function LoginAction(formData: FormData): Promise<LoginResult> {
    const id = String(formData.get("id"))
    const password = String(formData.get("password"))

    try {
        const userId = await verifyUser(id, password)

        // accessToken, refreshToken 생성하기
        const accessToken = await createJWT({uid: userId}, "1h")
        const refreshToken = await createJWT({uid: userId}, "6h")

        // 쿠키 객체 가져오기
        const cookieStore = await cookies();

        // Access Token 쿠키 설정
        cookieStore.set("accessToken", accessToken, {
            httpOnly: true,
            maxAge: 60 * 60,
            path: "/",
        })

        // Refresh Token 쿠키 설정
        cookieStore.set("refreshToken", refreshToken, {
            httpOnly: true,
            maxAge: 60 * 60 * 6,
            path: "/",
        })

        // uid 쿠키 설정
        cookieStore.set("uid", String(userId), {
            httpOnly: true,
            maxAge: 60 * 60 * 6,
            path: "/"
        })

        console.log("Login successful: ", userId)

        return {uid: userId, error: ""}
    } catch (err: any) {
        console.error("Login failed: ", err)

        return {
            uid: -1,
            error: err.message || "알 수 없는 오류가 발생했습니다.",
        }
    }
}

async function verifyUser(id: string, password: string) : Promise<number> {
    const user = await prisma.user.findUnique({
        where: { id },
    })

    if (!user) {
        throw new Error("아이디가 존재하지 않습니다.")
    }

    if (!user.password) {
        throw new Error("카카오 로그인을 이용해주세요.")
    }

    if (user.isDeleted) {
        throw new Error("로그인 불가능한 사용자입니다.")
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
        throw new Error("비밀번호가 올바르지 않습니다.");
    }

    return user.userId
}

export async function loadByCookie (): Promise<number> {
    // 쿠키 객체 가져오기
    const cookieObj = await cookies();

    // 쿠키에서 uid 꺼내기
    const uid = cookieObj.get("uid")?.value

    return uid ? Number(uid) : -1;
}