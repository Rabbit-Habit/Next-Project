"use server"

import prisma from "@/lib/prisma";
import {revalidatePath} from "next/cache";
import {getServerSession} from "next-auth";
import {authOptions} from '@/lib/auth';

export type UpdateHabitInput = {
    habitId: string
    title: string | null
    rabbitName: string
    goalDetail: string | null
    // 팀 습관
    teamName?: string | null
    goalCount: number | null
}

export type HabitActionResult = {
    ok: boolean
    message?: string
}

function toBigInt(id: string) {
    try { return BigInt(id) } catch { return null }
}

async function getCurrentUserId() {
    const session = await getServerSession(authOptions)
    const userId = Number(session?.user.uid)
    return Number.isFinite(userId) ? userId : null
}

// 권한 체크 (개인 습관인지, 팀 습관이면 LEADER인지)
// isTeamHabit: memberCount > 1 || !!inviteCode (개인도 teamtable에 들어가는 구조라서)
async function getHabitPermission(habitIdBig: bigint, userId: number) {
    const habit = await prisma.habit.findUnique({
        where: { habitId: habitIdBig },
        select: {
            habitId: true,
            userId: true,
            teamId: true,
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

    if (!habit) {
        return {
            habit: null as typeof habit | null,
            isTeamHabit: false,
            canEdit: false,
        };
    }

    const memberCount = habit.team?.members.length ?? 1;
    const isTeamHabit = memberCount > 1 || !!habit.inviteCode;

    let canEdit = false;

    if (!isTeamHabit) {
        // 개인 습관인가?
        canEdit = habit.userId === userId;
    } else {
        // 팀 습관이면 리더만
        const me = habit.team?.members.find(
            (m) => m.userId === userId && m.role === "LEADER"
        );
        canEdit = !!me;
    }

    return {
        habit,
        isTeamHabit,
        canEdit,
    };
}


// 수정(update)
export async function updateHabitAction(input: UpdateHabitInput ): Promise<HabitActionResult> {
    const userId = await getCurrentUserId();
    if (!userId) {
        return { ok: false, message: "로그인이 필요합니다" }
    }

    const habitIdBig = toBigInt(input.habitId);
    if (!habitIdBig) return { ok: false, message: "습관 불러오기 실패" }

    const { habit, isTeamHabit, canEdit } = await getHabitPermission(habitIdBig, userId)

    if (!habit || !canEdit) {
        return { ok: false, message: "수정 권한이 없습니다." }
    }

    // 공통 부분
    const habitUpdateData: any = {
        title: input.title?.trim() || null,
        rabbitName: input.rabbitName.trim(),
        goalDetail: input.goalDetail?.trim() || null,
    }

    // 팀 습관이면 팀 이름, 목표 횟수 수정
    if (isTeamHabit) {
        habitUpdateData.goalCount =
            input.goalCount && input.goalCount > 0
                ? BigInt(input.goalCount)
                : null;
    }

    if (isTeamHabit && habit.team?.teamId && typeof input.teamName !== "undefined") {
        await prisma.team.update({
            where: { teamId: habit.team.teamId },
            data: { name: input.teamName?.trim() || null },
        });
    }

    await prisma.habit.update({
        where: { habitId: habitIdBig },
        data: habitUpdateData,
    });

    revalidatePath("/habits")
    revalidatePath(`/habits/${input.habitId}`)
    revalidatePath(`/main`);

    return { ok: true }
}

// 삭제
export async function deleteHabitAction(habitId: string): Promise<HabitActionResult> {
    const userId = await getCurrentUserId();
    if (!userId) {
        return { ok: false, message: "로그인이 필요합니다." };
    }

    const habitIdBig = toBigInt(habitId);
    if (!habitIdBig) {
        return { ok: false, message: "잘못된 습관 ID 입니다." };
    }

    const { habit, canEdit } = await getHabitPermission(habitIdBig, userId);
    if (!habit || !canEdit) {
        return { ok: false, message: "삭제 권한이 없습니다." };
    }

    await prisma.$transaction(async (tx) => {
        await tx.habit.delete({
            where: { habitId: habitIdBig },
        })
    })

    revalidatePath("/habits")
    revalidatePath("/main");

    return { ok: true }
}