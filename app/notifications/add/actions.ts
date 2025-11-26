"use server";

import prisma from "@/lib/prisma";

// 알람 생성
export async function createNotificationAction(formData: FormData) {
    try {
        const userIdRaw = formData.get("userId");
        const habitIdRaw = formData.get("habitId") as string;
        const sendTimeRaw = formData.get("sendTime");
        const memoRaw = formData.get("memo");

        const userId = Number(userIdRaw?.toString());
        const habitId = BigInt(habitIdRaw?.toString());
        const sendTime = sendTimeRaw?.toString() || "";
        const memo = memoRaw?.toString() || null;

        const days = formData.getAll("daysOfWeek").map(v => v.toString());

        if (!userId || !habitIdRaw || !sendTime || days.length === 0) {
            return { ok: false, error: "필수 항목 누락" };
        }

        const result = await prisma.notification.create({
            data: {
                userId,
                habitId,
                sendTime,
                daysOfWeek: days,
                memo, 
            },
        });

        return { ok: true, notification: result };

    } catch (err) {
        console.error("❌ createNotificationAction:", err);
        return { ok: false, error: "알림 생성 실패" };
    }
}
