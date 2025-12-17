"use server";

import prisma from "@/backend/lib/prisma";

// 알람 활성화 ON/OFF 토글
export async function toggleNotificationAction(id: string, isActive: boolean) {
    try {
        await prisma.notification.update({
            where: { notificationId: BigInt(id) },
            data: { isActive },
        });
        return { ok: true };
    } catch (e) {
        console.error(e);
        return { ok: false };
    }
}

// 알람 삭제
export async function deleteNotificationAction(id: string) {
    try {
        await prisma.notification.delete({
            where: { notificationId: BigInt(id) },
        });
        return { ok: true };
    } catch (e) {
        console.error(e);
        return { ok: false };
    }
}
