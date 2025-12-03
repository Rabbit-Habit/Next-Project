import prisma from "@/lib/prisma";

// KST(+09:00) 하루 계산 유틸
const KST = 9 * 60;
const HUNGRY_TO_ESCAPED_DAYS = 3;

function toKST(d: Date) { return new Date(d.getTime() + KST * 60000); }
function fromKST(d: Date) { return new Date(d.getTime() - KST * 60000); }
function kstStartOfDay(d: Date) { const k = toKST(d); k.setHours(0,0,0,0); return fromKST(k); }
function kstDateOnly(d: Date) { return kstStartOfDay(d); }
function kstAddDays(d: Date, days: number) {
    const k = toKST(d);
    k.setDate(k.getDate() + days);
    k.setHours(0,0,0,0);
    return fromKST(k);
}

async function didSucceedOnDate(habitId: bigint, teamId: bigint | null, goalCount: bigint | null, day: Date) {
    const checkDate = kstDateOnly(day);
    // 개인 성공?
    const p = await prisma.habitHistory.count({ where: { habitId, checkDate, isCompleted: true }});
    if (p > 0) return true;
    // 팀 성공? (팀 기여 수 >= goal)
    if (teamId && goalCount && goalCount > BigInt(0)) {
        const c = await prisma.habitTeamHistory.count({
            where: { habitId, teamId, checkDate, isCompleted: true },
        });
        if (BigInt(c) >= goalCount) return true;
    }
    return false;
}

// 오늘 실패 확정 + 연속 실패면 escaped
async function finalizeOne(habitId: bigint) {
    const today = kstDateOnly(new Date());

    const habit = await prisma.habit.findUnique({
        where: { habitId },
        select: { teamId: true, goalCount: true },
    });
    if (!habit) return;

    const personal = await prisma.habitHistory.count({
        where: { habitId, checkDate: today, isCompleted: true },
    });

    let teamCompleted = false;
    if (habit.teamId && (habit.goalCount ?? BigInt(0)) > BigInt(0)) {
        const c = await prisma.habitTeamHistory.count({
            where: { habitId, teamId: habit.teamId, checkDate: today, isCompleted: true },
        });
        teamCompleted = BigInt(c) >= (habit.goalCount ?? BigInt(0));
    }

    const success = personal > 0 || teamCompleted;
    if (success) return;

    // 실패 확정 → hungry + 콤보 0
    await prisma.habit.update({
        where: { habitId },
        data: { rabbitStatus: "hungry", combo: BigInt(0) },
    });

    // 최근 N일 동안 성공이 한 번도 없으면 escaped
    let anySuccess = false;
    for (let i = 0; i < HUNGRY_TO_ESCAPED_DAYS; i++) {
        const day = kstAddDays(today, -i);
        if (await didSucceedOnDate(habitId, habit.teamId ?? null, habit.goalCount ?? null, day)) {
            anySuccess = true; break;
        }
    }
    if (!anySuccess) {
        await prisma.habit.update({
            where: { habitId },
            data: { rabbitStatus: "escaped" },
        });
    }
}

export async function GET(req: Request) {
    // 간단한 보안: 헤더 토큰 확인
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response("Unauthorized", { status: 401 });
    }

    // 모든 습관 id 조회 (대량이면 배치 처리)
    const habits = await prisma.habit.findMany({ select: { habitId: true }});
    const BATCH = 100;
    for (let i = 0; i < habits.length; i += BATCH) {
        const slice = habits.slice(i, i + BATCH);
        await Promise.all(slice.map(h => finalizeOne(h.habitId)));
    }

    return Response.json({ ok: true, processed: habits.length });
}