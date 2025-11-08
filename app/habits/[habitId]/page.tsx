import {notFound} from "next/navigation";
import prisma from "@/lib/prisma";
import HabitDetail2 from "@/app/habits/[habitId]/HabitDetail2.server";

export function toBigint(id: string) {
    try {
        return BigInt(id);
    } catch {
        return null;
    }
}

export default async function HabitDetailPage(
    props : { params: Promise<{ habitId: string }> }
) {

    const { habitId } = await props.params
    const habitIdBig = toBigint(habitId);
    if (!habitIdBig) return notFound();

    const habit = await prisma.habit.findUnique({
        where: {habitId: habitIdBig},
        select: {
            habitId: true,
            title: true,
            rabbitName: true,
            rabbitStatus: true,
            goalDetail: true,
            goalCount: true,
            combo: true,
            isAttendance: true,
            inviteCode: true,
            regDate: true,
            modDate: true,
            teamId: true,
            team: { select: { name: true} },
        },
    });

    if (!habit) return notFound();

    // ✅ teamId가 있을 때만 count
    const memberCount = habit.teamId
        ? await prisma.teamMember.count({
            where: { teamId: habit.teamId },
        })
        : 0;

    // DTO 직렬화
    const dto = {
        id: habit.habitId.toString(),
        title: habit.title ?? "제목 없는 습관",
        rabbitName: habit.rabbitName,
        rabbitStatus: habit.rabbitStatus as "alive" | "hungry" | "escaped",
        goalDetail: habit.goalDetail ?? null,
        goalCount: habit.goalCount?.toString() ?? "0",
        combo: habit.combo?.toString() ?? "0",
        isAttendance: !habit.isAttendance,
        inviteCode: habit.inviteCode ?? null,
        regDate: habit.regDate ? habit.regDate.toISOString() : null,
        modDate: habit.modDate ? habit.modDate.toISOString() : null,
        teamName: habit.team?.name ?? null,
    } as const;

    return <HabitDetail2 habit={dto} memberCount={memberCount} />


}