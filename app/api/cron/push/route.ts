// 푸시 알림 전송 API
// 현재 시간과 알림 설정을 비교해 푸시를 발송하는 역할
import { NextResponse } from "next/server";
import prisma from "@/backend/lib/prisma";
import admin from "@/lib/firebaseAdmin";

export async function GET(req: Request) {
    // 1) 보안 토큰 검사
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ ok: false, error: "Unauthorized" });
    }

    // 2) 현재 시간 (KST) 계산
    const k = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const days = ["일","월","화","수","목","금","토"];
    const today = days[k.getDay()];

    const hh = String(k.getHours()).padStart(2, "0");
    const mm = String(k.getMinutes()).padStart(2, "0");
    const nowTime = `${hh}:${mm}`;  // "HH:MM"

    // 3) 알람 DB에서 현재 시간과 요일이 맞는 알람 찾기
    const notifications = await prisma.notification.findMany({
        where: {
            sendTime: nowTime,
            daysOfWeek: { has: today },
            isActive: true,
        },
        include: {
            user: true,
            habit: true,
        },
    });

    console.log(`[Cron Push] ${notifications.length} notifications`);

    // 4) 각각의 알림을 푸시로 전송
    for (const noti of notifications) {
        if (!noti.user.fcmToken) continue;

        await admin.messaging().send({
            token: noti.user.fcmToken,
            notification: {
                title: `⏰ ${noti.habit.title}`,
                body: noti.memo || "습관 알람 시간입니다!",
            },
        });
    }

    return NextResponse.json({ ok: true, sent: notifications.length });
}
