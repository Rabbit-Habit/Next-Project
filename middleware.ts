export { default } from "next-auth/middleware"

// 검증할 경로 지정하기
export const config = {
    matcher: ["/", "/users/mypage", "/users/mypage/:path*"],
}