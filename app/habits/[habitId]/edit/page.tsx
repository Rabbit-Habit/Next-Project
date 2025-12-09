import Header from "@/app/components/common/header";
import prisma from "@/lib/prisma";
import HabitEditForm from "@/app/components/habits/habitEditForm";
import {getServerSession} from "next-auth";
import {authOptions} from "@/app/api/auth/[...nextauth]/route";
import {notFound} from "next/navigation";

function toBigInt(id: string) {
    try { return BigInt(id) } catch { return null }
}

export default async function HabitEditPage(
    props: { params: Promise<{ habitId: string }> }
) {
    const { habitId } = await props.params;

    const session = await getServerSession(authOptions);
    const userId = Number(session?.user.uid);
    if (!userId) return notFound();

    const hid = toBigInt(habitId);
    if (!hid) return notFound();

    const habit = await prisma.habit.findUnique({
        where: { habitId: hid },
        select: {
            habitId: true,
            userId: true,
            title: true,
            rabbitName: true,
            goalDetail: true,
            goalCount: true,
            inviteCode: true,
            team: {
                select: {
                    teamId: true,
                    name: true,
                    members: {
                        select: {
                            userId: true,
                            role: true,
                        },
                    },
                },
            },
        },
    });

    if (!habit) return notFound();

    const memberCount = habit.team?.members.length ?? 1;
    const isTeamHabit = memberCount > 1 || !!habit.inviteCode;

    // 권한 (팀 습관이면 LEADER만, 아니면 작성자만)
    let canEdit = false;
    if (!isTeamHabit) {
        canEdit = habit.userId === userId;
    } else {
        const me = habit.team?.members.find(
            (m) => m.userId === userId && m.role === "LEADER"
        );
        canEdit = !!me;
    }

    const viewModel = {
        habitId: habit.habitId.toString(),
        title: habit.title ?? "",
        rabbitName: habit.rabbitName,
        goalDetail: habit.goalDetail ?? "",
        goalCount: habit.goalCount ? Number(habit.goalCount) : null,
        teamName: habit.team?.name ?? "",
        isTeamHabit,
        canEdit,
    };

    return (
        <div>
            <Header title="습관 수정" />
            <HabitEditForm habit={viewModel} />
        </div>
    );
}