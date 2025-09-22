import {NextRequest, NextResponse} from "next/server";
import {createJWT, verifyJWT} from "@/app/util/jwtUtil";

export async function middleware(req: NextRequest) {
    // 요청 쿠키에서 accessToken, refreshToken 추출
    const accessToken = req.cookies.get("accessToken")?.value
    const refreshToken = req.cookies.get("refreshToken")?.value

    // accessToken 검증
    const accessPayload = accessToken ? await  verifyJWT(accessToken) : null

    // accessToken 유효하다면 그냥 요청 통과
    if (accessPayload) {
        return NextResponse.next()
    }

    // accessToken 없거나 만료 → refreshToken 검증
    const refreshPayload = refreshToken ? await  verifyJWT(refreshToken) : null

    if (refreshPayload) {
        const user: {uid: number} = refreshPayload;

        // refreshToken 유효하다면 Token 새로 발급
        const newAccessToken = await createJWT({uid: user.uid}, "1h")
        const newRefreshToken = await createJWT({uid: user.uid}, "6h")

        const res = NextResponse.next()

        // 쿠키에 새로운 accessToken 저장
        res.cookies.set('accessToken', newAccessToken, {
            httpOnly: true,
            maxAge: 60 * 60,
            path: "/",
        })

        // 쿠키에 새로운 Refresh Token 저장
        res.cookies.set("refreshToken", newRefreshToken, {
            httpOnly: true,
            maxAge: 60 * 60 * 6,
            path: "/",
        })

        return res
    }

    // 둘 다 실패 → 로그인 페이지로 리다이렉트
    return NextResponse.redirect(new URL("/auth/login", req.url))
}

// 검증할 경로 지정하기
export const config = {
    matcher: ["/", "/users/mypage", "/users/mypage/edit"],
}