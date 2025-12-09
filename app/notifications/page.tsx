import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import NotificationsListComponent from "@/app/components/notifications/notificationsListComponent";
import {authOptions} from '@/lib/auth';
import {redirect} from "next/navigation";

export default async function NotificationListPage() {

    // 로그인 uid 가져오기
    const session = await getServerSession(authOptions)
    const uid = Number(session?.user.uid)
    if (!uid) redirect("/login"); // 로그인 안 했을 때

    const notifications = await prisma.notification.findMany({
        where: { userId: uid },
        include: {
            habit: {
                select: { title: true },
            },
        },
        orderBy: { regDate: "desc" },
    });

    // BigInt → string 변환 (클라이언트 전달 용도)
    const safe = notifications.map((n) => ({
        ...n,
        notificationId: n.notificationId.toString(),
        habitId: n.habitId.toString(),
    }));

    return <NotificationsListComponent notifications={safe} />;
}