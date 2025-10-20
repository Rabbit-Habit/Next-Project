"use server"

// 3일 굶으면 토끼 탈출
import {getServerSession} from "next-auth";
import {authOptions} from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import {revalidatePath} from "next/cache";

const HUNGRY_TO_ESCAPED_DAYS = 3;
const TZ_OFFSET_MIN = 9 * 60;

// KST 날짜 계산
function toKST(d: Date) {
    return new Date(d.getTime() + TZ_OFFSET_MIN * 60 * 1000);
}

function fromKST(d: Date) {
    return new Date(d.getTime() - TZ_OFFSET_MIN * 60 * 1000);
}

function kstStartOfDay(d: Date) {
    const k = toKST(d);
    k.setHours(0, 0, 0, 0);
    return fromKST(k);
}

function kstAddDays(date: Date, days: number) {
    const k = toKST(date);
    k.setDate(k.getDate() + days);
    k.setHours(0, 0, 0, 0);
    return fromKST(k);
}

// DATE 칼럼에 넣을 '그날' 값 (시간은 무시되지만 일관성을 위해 KST 00:00:00을 UTC로 저장)
function kstDateOnly(d: Date) {
    return kstStartOfDay(d);
}

// 세션에서 Id 값 불러오기
async function requireUserId() {
    const session = await getServerSession(authOptions);
    const userId = Number(session?.user?.uid);
    if (!userId) throw new Error("로그인이 필요합니다.");
    return userId;
}

// 어제 습관 성공했는지
async function hadSuccessOnDate(habitId: bigint, teamId: bigint | null, goalCount: bigint | null, day: Date) {
    const checkDate = kstDateOnly(day);

    const personal = await prisma.habitHistory.count({
        where: { habitId, checkDate, isCompleted: true },
    });

    let teamDone = 0;
    if (teamId && goalCount && goalCount > 0) {
        const  teamContrib = await prisma.teamHabitHistory.count({
            where: { habitId, teamId, checkDate, isCompleted: true },
        });
        teamDone = BigInt(teamContrib) >= goalCount ? 1 : 0;
    }

    return personal > 0 || teamDone === 1;
}

// 최근 성공
async function hadAnySuccessSince(habitId: bigint, teamId: bigint | null, goalCount: bigint | null, days: number, ref: Date) {
    for (let i = 0; i < days; i++) {
        const day = kstAddDays(ref, -i);
        if (await hadSuccessOnDate(habitId, teamId, goalCount, day)) return true;
    }
    return false;
}

// 콤보, 토끼 상태
async function updateComboAndStatus(habitId: bigint, didSucceedToday: boolean) {
    const habit = await prisma.habit.findUnique({
        where: { habitId },
        select: { combo: true, rabbitStatus: true, goalCount: true, teamId: true },
    });
    if (!habit) return;

    const today = new Date();
    const yesterday = kstAddDays(today, -1);

    if (didSucceedToday) {
        const yesterdaySuccess = await hadSuccessOnDate(habitId, habit.teamId ?? null, habit.goalCount ?? null, yesterday);
        const newCombo = (habit.combo ?? 0n) === 0n
            ? (yesterdaySuccess ? 2 : 1)
            : (yesterdaySuccess ? (habit.combo! + 1n) : 1n);

        await prisma.habit.update({
            where: { habitId },
            data: {
                combo: newCombo,
                rabbitStatus: "alive",
            },
        });
        return;
    }

    // 실패 (오늘 성공 없음)
    await prisma.habit.update({
        where: { habitId },
        data: { combo: 0, rabbitStatus: "hungry" },
    });

    // 토끼 탈출
    const anySuccess = await hadAnySuccessSince(habitId, habit.teamId ?? null, habit.goalCount ?? null, HUNGRY_TO_ESCAPED_DAYS, today);
    if (!anySuccess) {
        await prisma.habit.update({
            where: { habitId },
            data: { rabbitStatus: "escaped" },
        });
    }
}

// 개인 습관 체크
export async function checkPersonalHabit(habitIdStr: string) {
    const userId = await requireUserId();
    let habitId: bigint;
    try { habitId = BigInt(habitIdStr); } catch { throw new Error("잘못된 habitId"); }

    const todayDate = kstDateOnly(new Date());

    // 중복 체크 (유니크 제약과 중복 방지)
    const exists = await prisma.habitHistory.findUnique({
        where: { uq_habit_user_day: { habitId, userId, checkDate: todayDate } },
        select: { historyId: true },
    });
    if (exists) return { ok: true, message: "오늘은 이미 체크했습니다." };

    await prisma.habitHistory.create({
        data: {
            habitId,
            userId,
            checkDate: todayDate,
            isCompleted: true,
        },
    });

    await updateComboAndStatus(habitId, true);
    return { ok: true, message: "체크 완료!" };
}

// 팀 습관 확인
export async function checkTeamHabit(habitIdStr: string) {
    const userId = await requireUserId();
    let habitId: bigint;
    try { habitId = BigInt(habitIdStr); } catch { throw new Error("잘못된 habitId"); }

    const habit = await prisma.habit.findUnique({
        where: { habitId },
        select: { teamId: true, goalCount: true },
    });
    if (!habit?.teamId) {
        // 팀이 없으면 개인 체크로 대체
        return checkPersonalHabit(habitIdStr);
    }

    const teamId = habit.teamId;
    const goal = habit.goalCount ?? 0n;
    const todayDate = kstDateOnly(new Date());

    // 팀원 1일 1회 기여(스키마의 UNIQUE로 보장)
    try {
        await prisma.teamHabitHistory.create({
            data: { habitId, teamId, userId, checkDate: todayDate, isCompleted: true },
        });
    } catch (e: any) {
        // 이미 기여한 경우
        return { ok: true, message: "오늘은 이미 기여했습니다." };
    }

    // 오늘 팀 누계
    const todayCount = await prisma.teamHabitHistory.count({
        where: { habitId, teamId, checkDate: todayDate, isCompleted: true },
    });

    const completed = BigInt(todayCount) >= goal && goal > 0n;

    if (completed) {
        await updateComboAndStatus(habitId, true);
    }
    return {
        ok: true,
        completed,
        count: todayCount,
        goal: Number(goal),
        message: completed ? "팀 목표 달성! 콤보 유지/증가!" : "기여 반영됨. 아직 목표 미달입니다.",
    };
}

// 자동 판정
export async function finalizeTodayIfMissed(habitIdStr: string) {
    let habitId: bigint;
    try { habitId = BigInt(habitIdStr); } catch { throw new Error("잘못된 habitId"); }

    const todayDate = kstDateOnly(new Date());
    const habit = await prisma.habit.findUnique({
        where: { habitId },
        select: { teamId: true, goalCount: true },
    });
    if (!habit) return { ok: true };

    const personal = await prisma.habitHistory.count({
        where: { habitId, checkDate: todayDate, isCompleted: true },
    });

    let teamCompleted = false;
    if (habit.teamId && (habit.goalCount ?? 0n) > 0n) {
        const teamCount = await prisma.teamHabitHistory.count({
            where: { habitId, teamId: habit.teamId, checkDate: todayDate, isCompleted: true },
        });
        teamCompleted = BigInt(teamCount) >= (habit.goalCount ?? 0n);
    }

    const success = personal > 0 || teamCompleted;
    if (!success) {
        await updateComboAndStatus(habitId, false);
    }
    return { ok: true };
}

export async function submitCheckAction(habitIdStr: string) {
    // 팀 여부에 따라 자동 분기
    const habit = await prisma.habit.findUnique({
        where: { habitId: BigInt(habitIdStr) },
        select: { teamId: true },
    });
    const ret = habit?.teamId ? await checkTeamHabit(habitIdStr) : await checkPersonalHabit(habitIdStr);
    // 상세페이지 갱신
    revalidatePath(`/habits/${habitIdStr}`);
    return ret;
}