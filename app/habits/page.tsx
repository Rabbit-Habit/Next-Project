import prisma from "@/lib/prisma";
import HabitsList from "@/app/components/habits/habitsList.client";
import {getServerSession} from "next-auth";
import {authOptions} from "@/app/api/auth/[...nextauth]/route";

export default async function HabitsPage() {
    const session = await getServerSession(authOptions)
    const userId = Number(session?.user.uid)

    if (!userId) return <div> 로그인이 필요합니다. </div>

    // const teamIds = await prisma.teamMember.findMany({
    //     where: { userId },
    //     select: { teamId: true },
    // }).then(rows => rows.map(r => r.teamId))

    const items = await prisma.habit.findMany({
        take: 4,
        orderBy: { habitId: "desc" },
        select: {
            habitId: true,
            title: true,
            rabbitName: true,
            rabbitStatus: true,
            goalDetail: true,
            inviteCode: true,
            regDate: true,
            team: { select: { name: true } },
        },
    });

    // DTO 직렬화 (BigInt/Date 안전)
    const mapped = items.map((i) => ({
        id: i.habitId.toString(),
        title: i.title ?? "제목 없는 습관",
        rabbitName: i.rabbitName,
        rabbitStatus: i.rabbitStatus as "alive" | "hungry" | "escaped",
        goalDetail: i.goalDetail ?? null,
        teamName: i.team?.name ?? null,
        regDate: i.regDate ? i.regDate.toISOString() : null,
        isTeamHabit: !!i.inviteCode, // 초대 코드 유무로 팀습관 판별
    }));

    return <HabitsList initialItems={mapped} />
}

