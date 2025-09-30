import prisma from "@/lib/prisma";
import {cookies} from "next/headers";
import HabitsList from "@/app/components/habits/habitsList.server";

function toOptionalBigInt(v?: string) {
    if (!v) return undefined;
    try { return BigInt(v); } catch { return undefined; }
}

export default async function HabitsPage() {
    const cookieStore = await cookies()
    const uid = cookieStore.get("uid")?.value
    const userId = uid ? Number(uid) : undefined

    const habits = await prisma.habit.findMany({
        where: userId ? {userId} : undefined, // 로그인 연동 시 필터링
        select: {
            habitId: true,
            title: true,
            rabbitName: true,
            rabbitStatus: true,
            goalDetail: true,
            regDate: true,
            team: {select: {name: true}},
        },
        orderBy: [{regDate: "desc"}, {habitId: "desc"}],
        take: 100,
    })

    // DTO 직렬화 (BigInt/Date 안전)
    const items = habits.map((h) => ({
        id: h.habitId.toString(),
        title: h.title ?? "제목 없는 습관",
        rabbitName: h.rabbitName,
        rabbitStatus: h.rabbitStatus as "alive" | "hungry" | "escaped",
        goalDetail: h.goalDetail ?? null,
        teamName: h.team?.name ?? null,
        regDate: h.regDate ? h.regDate.toISOString() : null,
    }));

    return <HabitsList items={items} />
}

