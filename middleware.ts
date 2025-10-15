export { default } from "next-auth/middleware"

// 검증할 경로 지정하기
export const config = {
    matcher: ["/((?!api|_next|favicon.ico|assets|icons|manifest.json|auth/login|users/signup).*)"]
}