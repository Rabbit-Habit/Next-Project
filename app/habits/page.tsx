import prisma from "@/lib/prisma";
import {cookies} from "next/headers";
import HabitsList from "@/app/components/habits/habitsList.server";

// function toOptionalBigInt(v?: string) {
//     if (!v) return undefined;
//     try { return BigInt(v); } catch { return undefined; }
// }

export default async function HabitsPage() {
    const cookieStore = await cookies()
    const uid = cookieStore.get("uid")?.value
    const userId = uid ? Number(uid) : null
    if (!userId) return <div> 로그인이 필요합니다. </div>

    const teamIds = await prisma.teamMember.findMany({
        where: { userId },
        select: { teamId: true },
    }).then(rows => rows.map(r => r.teamId))

    const items = await prisma.habit.findMany({
        where: {
            OR: [
                { userId },                  // 내가 만든 개인/팀 습관
                { teamId: { in: teamIds } }, // 내가 멤버로 속한 팀 습관
            ],
        },
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
    const mapped = items.map((i) => ({
        id: i.habitId.toString(),
        title: i.title ?? "제목 없는 습관",
        rabbitName: i.rabbitName,
        rabbitStatus: i.rabbitStatus as "alive" | "hungry" | "escaped",
        goalDetail: i.goalDetail ?? null,
        teamName: i.team?.name ?? null,
        regDate: i.regDate ? i.regDate.toISOString() : null,
    }));

    return <HabitsList items={mapped} />
}

