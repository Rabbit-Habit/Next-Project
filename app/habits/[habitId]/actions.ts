"use server"

import {getServerSession} from "next-auth";
import {authOptions} from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import {revalidatePath} from "next/cache";

// 3일 굶으면 토끼 탈출
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

// 어제 습관 성공했는지 (개인, 팀)
async function didSucceedOnDate(habitId: bigint, teamId: bigint | null, goalCount: bigint | null, day: Date) {
    const checkDate = kstDateOnly(day);

    // 개인 성공
    const personal = await prisma.habitHistory.count({
        where: { habitId, checkDate, isCompleted: true },
    });
    if (personal > 0) return true;

    // 팀 성공: 팀 기여 수 >= goal
    if (teamId && goalCount && goalCount > BigInt(0)) {
        const cnt = await prisma.habitTeamHistory.count({
            where: { habitId, teamId, checkDate, isCompleted: true },
        });
        if (BigInt(cnt) >= goalCount) return true;
    }
    return false;
}

// 성공하면 콤보랑 토끼 상태 갱신
async function bumpComboAlive(habitId: bigint) {
    const habit = await prisma.habit.findUnique({
        where: { habitId },
        select: { combo: true, teamId: true, goalCount: true },
    });
    if (!habit) return;

    const yesterday = kstAddDays(new Date(), -1);
    const yesterdaySuccess = await didSucceedOnDate(
        habitId,
        habit.teamId ?? null,
        habit.goalCount ?? null,
        yesterday
    );

    const comboNum = Number(habit.combo ?? BigInt(0));
    const newCombo = yesterdaySuccess ? comboNum + 1 : 1;

    await prisma.habit.update({
        where: { habitId },
        data: { combo: BigInt(newCombo), rabbitStatus: "alive" },
    });
}

// 탈출하는 토끼
// hungry 상태가 HUNGRY_TO_ESCAPED_DAYS 이상이면 escaped
// 중간에 하루라도 성공이면 hungry 유지
async function setHungryOrEscapedIfStreak(habitId: bigint) {
    const habit = await prisma.habit.findUnique({
        where: { habitId },
        select: { teamId: true, goalCount: true },
    });
    if (!habit) return;

    const today = new Date();
    let anySuccess = false;

    for (let i = 0; i < HUNGRY_TO_ESCAPED_DAYS; i++) {
        const day = kstAddDays(today, -i);
        const ok = await didSucceedOnDate(
            habitId,
            habit.teamId ?? null,
            habit.goalCount ?? null,
            day
        );
        if (ok) { anySuccess = true; break; }
    }

    // anySuccess가 false면 최근 N일간 전부 실패 → escaped
    if (!anySuccess) {
        await prisma.habit.update({
            where: { habitId },
            data: { rabbitStatus: "escaped", combo: BigInt(0) },
        });
    } else {
        // 실패했지만 최근 N일 내에 성공이 하나라도 있으므로 hungry 유지
        await prisma.habit.update({
            where: { habitId },
            data: { rabbitStatus: "hungry" },
        });
    }
}

// 통합 체크
export async function checkHabit(habitIdStr: string) {
    const userId = await requireUserId();
    const habitId = BigInt(habitIdStr);
    const today = kstDateOnly(new Date());

    // teamId, goalCount 조회
    const habit = await prisma.habit.findUnique({
        where: { habitId },
        select: { teamId: true, goalCount: true },
    });
    if (!habit) return { ok: false, error: "습관을 찾을 수 없습니다." };

    const teamId = habit.teamId ?? null;
    const goal   = habit.goalCount ?? BigInt(1);

    // 트랜잭션: 개인 히스토리 upsert + (teamId 있으면) 팀 히스토리 upsert
    const { teamCount } = await prisma.$transaction(async (tx) => {
        // 1) 개인 1일 1회 기록
        await tx.habitHistory.upsert({
            where: { uq_habit_user_day: { habitId, userId, checkDate: today } },
            update: {},
            create: { habitId, userId, checkDate: today, isCompleted: true },
        });

        // 2) 팀 1일 1회 기록 (개인 습관도 teamId 보유하면 함께 기록)
        if (teamId) {
            await tx.habitTeamHistory.upsert({
                where: { uq_team_habit_day: { habitId, teamId, checkDate: today } },
                update: {},
                create: { habitId, teamId, checkDate: today, isCompleted: true },
            });
        }

        // 3) 오늘 팀 누계 (스키마가 day 유니크이면 0/1만 나옴)
        const cnt = teamId
            ? await tx.habitTeamHistory.count({
                where: { habitId, teamId, checkDate: today, isCompleted: true },
            })
            : 0;

        return { teamCount: cnt };
    });

    // 성공 판정 & 상태 반영
    if (teamId && goal > BigInt(0)) {
        // 팀 습관: 팀 목표 달성 시에만 즉시 alive + 콤보 증가
        if (BigInt(teamCount) >= goal) {
            await bumpComboAlive(habitId);
            revalidatePath(`/habits/${habitIdStr}`);
            return { ok: true, completed: true, count: teamCount, goal: Number(goal) };
        } else {
            // 목표 미달 → 일단 hungry, 자정 finalize에서 최종 실패 반영
            await prisma.habit.update({
                where: { habitId },
                data: { rabbitStatus: "hungry" },
            });
            revalidatePath(`/habits/${habitIdStr}`);
            return { ok: true, completed: false, count: teamCount, goal: Number(goal) };
        }
    } else {
        // 개인 습관(또는 goal 미설정) → 즉시 alive + 콤보 증가
        await bumpComboAlive(habitId);
        revalidatePath(`/habits/${habitIdStr}`);
        return { ok: true, completed: true };
    }
}


// // 개인 습관 체크
// export async function checkPersonalHabit(habitIdStr: string) {
//     const userId = await requireUserId();
//     const habitId = BigInt(habitIdStr);
//     const today = kstDateOnly(new Date());
//
//     // 개인 기록(1일 1회)
//     await prisma.habitHistory.upsert({
//         where: { uq_habit_user_day: { habitId, userId, checkDate: today } },
//         update: {},
//         create: { habitId, userId, checkDate: today, isCompleted: true },
//     });
//
//     // 성공 즉시 alive + 콤보 증가
//     await bumpComboAlive(habitId);
//
//     revalidatePath(`/habits/${habitIdStr}`);
//     return { ok: true };
// }
//
// // 팀 습관 체크
// export async function checkTeamHabit(habitIdStr: string) {
//     const userId = await requireUserId();
//     const habitId = BigInt(habitIdStr);
//     const today = kstDateOnly(new Date());
//
//     const habit = await prisma.habit.findUnique({
//         where: { habitId },
//         select: { teamId: true, goalCount: true },
//     });
//
//     if (!habit?.teamId) {
//         // 팀 없음 → 개인 체크로 대체
//         return checkPersonalHabit(habitIdStr);
//     }
//
//     const teamId = habit.teamId;
//     const goal = habit.goalCount ?? BigInt(0);
//
//     // 개인 기록도 남김
//     await prisma.habitHistory.upsert({
//         where: { uq_habit_user_day: { habitId, userId, checkDate: today } },
//         update: {},
//         create: { habitId, userId, checkDate: today, isCompleted: true },
//     });
//
//     // 내 팀 기여(팀원 1일 1회)
//     await prisma.habitTeamHistory.upsert({
//         where: { uq_team_habit_day: { habitId, teamId, checkDate: today } },
//         update: {},
//         create: { habitId, teamId, checkDate: today, isCompleted: true },
//     });
//
//     // 오늘 팀 누계
//     const cnt = await prisma.habitTeamHistory.count({
//         where: { habitId, teamId, checkDate: today, isCompleted: true },
//     });
//
//     if (goal > BigInt(0) && BigInt(cnt) >= goal) {
//         // 목표 달성 → 즉시 alive + 콤보 증가
//         await bumpComboAlive(habitId);
//         revalidatePath(`/habits/${habitIdStr}`);
//         return { ok: true, completed: true, count: cnt, goal: Number(goal) };
//     } else {
//         // 목표 미달: 상태는 일단 hungry
//         // 콤보는 자정에 확정 실패 시 0으로 리셋
//         await prisma.habit.update({
//             where: { habitId },
//             data: { rabbitStatus: "hungry" },
//         });
//         revalidatePath(`/habits/${habitIdStr}`);
//         return { ok: true, completed: false, count: cnt, goal: Number(goal) };
//     }
// }

// 매일 자정 최종 판정
export async function finalizeTodayIfMissed(habitIdStr: string) {
    const habitId = BigInt(habitIdStr);
    const today = kstDateOnly(new Date());

    const habit = await prisma.habit.findUnique({
        where: { habitId },
        select: { teamId: true, goalCount: true },
    });
    if (!habit) return { ok: true, success: false };

    // 개인 성공
    const p = await prisma.habitHistory.count({
        where: { habitId, checkDate: today, isCompleted: true },
    });

    // 팀 성공 (당일 기여 수 >= goal)
    let tCompleted = false;
    if (habit.teamId && (habit.goalCount ?? BigInt(0)) > BigInt(0)) {
        const c = await prisma.habitTeamHistory.count({
            where: { habitId, teamId: habit.teamId, checkDate: today, isCompleted: true },
        });
        tCompleted = BigInt(c) >= (habit.goalCount ?? BigInt(0));
    }

    const success = p > 0 || tCompleted;

    if (!success) {
        // 실패 확정 → hungry + 콤보 0, 이어서 N일 연속 실패면 escaped
        await prisma.habit.update({
            where: { habitId },
            data: { rabbitStatus: "hungry", combo: BigInt(0) },
        });
        await setHungryOrEscapedIfStreak(habitId);
    }

    revalidatePath(`/habits/${habitIdStr}`);
    return { ok: true, success };
}

// // 제출 액션
// export async function submitCheckAction(habitIdStr: string) {
//     const habit = await prisma.habit.findUnique({
//         where: { habitId: BigInt(habitIdStr) },
//         select: { teamId: true },
//     });
//     const res = habit?.teamId
//         ? await checkTeamHabit(habitIdStr)
//         : await checkPersonalHabit(habitIdStr);
//
//     revalidatePath(`/habits/${habitIdStr}`);
//     return res;
// }

// 제출 2
export async function submitCheckAction(habitIdStr: string) {
    const res = await checkHabit(habitIdStr);
    revalidatePath(`/habits/${habitIdStr}`);
    return res;
}