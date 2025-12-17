"use server"

import {getServerSession} from "next-auth";
import {authOptions} from '@/lib/auth';
import prisma from "@/backend/lib/prisma";
import {revalidatePath} from "next/cache";

// 3일 굶으면 토끼 탈출
const HUNGRY_TO_ESCAPED_DAYS = 3;

// KST 오프셋 (분)
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

//KST 기준 n일 더하기/빼기 (일자만)
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

// 어제 습관 성공했는지 (개인, 팀 구분 필요 없음)
async function didSucceedOnDate(habitId: bigint, day: Date) {
    const checkDate = kstDateOnly(day);

    const teamSuccess = await prisma.habitTeamHistory.count({
        where: { habitId, checkDate, isCompleted: true },
    });

    return teamSuccess > 0;
}

// 탈출하는 토끼
// hungry 상태가 HUNGRY_TO_ESCAPED_DAYS 이상이면 escaped
// 중간에 하루라도 성공이면 hungry 유지
async function setHungryOrEscapedIfStreak(habitId: bigint) {
    const today = new Date();
    let anySuccess = false;

    for (let i = 0; i < HUNGRY_TO_ESCAPED_DAYS; i++) {
        const day = kstAddDays(today, -i);
        const ok = await didSucceedOnDate(habitId, day);
        if (ok) {
            anySuccess = true;
            break;
        }
    }

    if (!anySuccess) {
        // 최근 N일간 전부 실패 → 토끼 탈출
        await prisma.habit.update({
            where: { habitId },
            data: { rabbitStatus: "escaped", combo: BigInt(0) },
        });
    } else {
        // 최근 N일 내에 성공이 하나라도 있음 → hungry 유지 (이미 hungry로 내려가 있음)
        await prisma.habit.update({
            where: { habitId },
            data: { rabbitStatus: "hungry" },
        });
    }
}

// 콤보 올리고 토끼 살려
async function bumpComboAlive(habitId: bigint) {
    const habit = await prisma.habit.findUnique({
        where: { habitId },
        select: { combo: true },
    });
    if (!habit) return;

    const currentCombo = habit.combo ?? BigInt(0);
    const newCombo = currentCombo + BigInt(1);

    await prisma.habit.update({
        where: { habitId },
        data: {
            combo: newCombo,
            rabbitStatus: "alive",
        },
    });
}

// >>> 습관 체크

export type HabitCheckState = {
    ok: boolean;
    error?: string;
    completed?: boolean;
    count?: number; // 오늘 팀 기여 수
    goal?: number;  // 목표 카운트
};

export async function checkHabit(habitIdStr: string): Promise<HabitCheckState> {
    const userId = await requireUserId();
    const habitId = BigInt(habitIdStr);
    const today = kstDateOnly(new Date());

    // 습관 정보 조회 (goalCount, teamId, inviteCode, combo)
    const habit = await prisma.habit.findUnique({
        where: { habitId },
        select: {
            teamId: true,
            goalCount: true,
            inviteCode: true,
            combo: true,
        },
    });

    if (!habit) {
        return { ok: false, error: "습관을 찾을 수 없습니다." };
    }

    const teamId = habit.teamId;
    const rawGoal = habit.goalCount ?? BigInt(1);
    const goal = rawGoal > BigInt(0) ? rawGoal : BigInt(1);

    // 이미 오늘 완료했는지?
    const already = await prisma.habitHistory.findUnique({
        where: {
            uq_habit_user_day: {
                habitId,
                userId,
                checkDate: today,
            },
        },
    });

    if (already?.isCompleted) {
        return { ok: false, error: "ALREADY_DONE" as const };
    }

    // 트랜잭션:
    // 1) habit_history upsert
    // 2) 오늘 이 습관을 완료한 사람 수(teamCount) 계산
    // 3) goal 달성 순간이면 habit_team_history를 “처음” 1줄 생성
    const { teamCount, reachedGoal, teamSuccessJustNow } =
        await prisma.$transaction(async (tx) => {
            // 1) 개인 히스토리 기록
            await tx.habitHistory.upsert({
                where: {
                    uq_habit_user_day: {
                        habitId,
                        userId,
                        checkDate: today,
                    },
                },
                update: {
                    isCompleted: true,
                },
                create: {
                    habitId,
                    userId,
                    checkDate: today,
                    isCompleted: true,
                },
            });

            // 2) 오늘 이 습관을 완료한 사람 수
            const count = await tx.habitHistory.count({
                where: {
                    habitId,
                    checkDate: today,
                    isCompleted: true,
                },
            });

            const reached = BigInt(count) >= goal;

            let justNow = false;

            if (reached && teamId) {
                // 이미 오늘 팀 히스토리가 있는지 확인
                const existed = await tx.habitTeamHistory.findUnique({
                    where: {
                        uq_team_habit_day: {
                            habitId,
                            teamId,
                            checkDate: today,
                        },
                    },
                });

                if (!existed) {
                    // 오늘 처음 목표 달성
                    await tx.habitTeamHistory.create({
                        data: {
                            habitId,
                            teamId,
                            checkDate: today,
                            isCompleted: true,
                        },
                    });
                    justNow = true;
                }
            }

            return {
                teamCount: count,
                reachedGoal: reached,
                teamSuccessJustNow: justNow,
            };
        });

    // 목표 달성 시(개인/팀 공통) 콤보 +1 & alive
    // ※ 단, 오늘 처음 goal 달성한 순간에만 콤보 올림
    if (reachedGoal && teamSuccessJustNow) {
        await bumpComboAlive(habitId);
    }

    // 개인/팀 모두 동일하게 “성공 여부 = goal 달성 여부”
    // (개인은 1인 팀으로 goal=1이므로 동일하게 취급됨)
    const state: HabitCheckState = {
        ok: true,
        completed: reachedGoal,
        count: teamCount,
        goal: Number(goal),
    };

    return state;
}

// 매일 자정 최종 판정

export async function finalizeTodayIfMissed(
    habitIdStr: string
): Promise<{ ok: boolean; success: boolean }> {
    const habitId = BigInt(habitIdStr);
    const today = kstDateOnly(new Date());

    // 오늘 팀 성공 여부: habit_team_history에 기록이 있는지로 판단
    const teamSuccess = await prisma.habitTeamHistory.count({
        where: {
            habitId,
            checkDate: today,
            isCompleted: true,
        },
    });

    const success = teamSuccess > 0;

    if (!success) {
        // 실패 확정 → hungry + 콤보 0
        await prisma.habit.update({
            where: { habitId },
            data: { rabbitStatus: "hungry", combo: BigInt(0) },
        });

        // 이어서 N일 연속 실패면 escaped
        await setHungryOrEscapedIfStreak(habitId);
    }

    // 상세 페이지 등 갱신
    revalidatePath(`/habits/${habitIdStr}`);
    revalidatePath(`/main/${habitIdStr}`);

    return { ok: true, success };
}

// 제출 3
export async function submitCheckAction(formData: FormData): Promise<HabitCheckState> {
    const id = formData.get("habitId") as string;
    const res = await checkHabit(id);

    if (!res.ok && res.error === "ALREADY_DONE") {
        return { ok: false, error: "ALREADY_DONE" };
    }

    revalidatePath(`/habits/${id}`);
    revalidatePath(`/main/${id}`);

    return res
}