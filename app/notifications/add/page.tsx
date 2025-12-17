
import prisma from "@/backend/lib/prisma";
import NotificationsAddComponent from "@/app/components/notifications/notificationsAddComponent";
import {getServerSession} from "next-auth";
import {authOptions} from '@/lib/auth';
import {redirect} from "next/navigation";

export default async function NotificationsAddPage() {

    // 로그인 uid 가져오기
    const session = await getServerSession(authOptions)
    const uid = Number(session?.user.uid)
    if (!uid) redirect("/login"); // 로그인 안 했을 때

    // 습관 목록 가져오기
    const habits = await prisma.habit.findMany({
        where: { userId: uid },
        select: {
            habitId: true,
            title: true,
            rabbitName: true,
        },
        orderBy: { regDate: "asc" },
    });

    return <NotificationsAddComponent habits={habits} userId={uid} />;
}
