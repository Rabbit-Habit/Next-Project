import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {

    // 1) 로그인 여부 확인 (NextAuth 세션)
    const session = await getServerSession(authOptions);
    if (!session)
        return NextResponse.json({ ok: false });

    // 2) 사용자 ID 가져오기
    const uid = Number(session.user.uid);

    // 3) 요청 body에서 fcm token 추출
    const { token } = await req.json();

    try {
        // 4) DB에 토큰 저장
        await prisma.user.update({
            where: { userId: uid },
            data: { fcmToken: token },
        });
        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("FCM Token Save Error:", err);
        return NextResponse.json({ ok: false, error: String(err) });
    }
}
