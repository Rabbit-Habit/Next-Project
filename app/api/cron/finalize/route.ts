import {NextRequest, NextResponse} from "next/server";
import prisma from "@/lib/prisma";
import { finalizeTodayIfMissed } from "@/app/habits/[habitId]/actions";

export async function GET(req: NextRequest) {

    const secret = req.nextUrl.searchParams.get("secret");
    if (secret !== process.env.CRON_SECRET) {
        return new NextResponse("Forbidden", { status: 403 });
    }

    // 오늘 기준으로 처리할 습관들 가져오기
    const habits = await prisma.habit.findMany({
        select: { habitId: true },
        // 원하면 isDeleted 같은 조건이나 활성 습관만 필터링도 가능
    });

    const results: { habitId: string; success: boolean }[] = [];

    for (const h of habits) {
        const { success } = await finalizeTodayIfMissed(h.habitId.toString());
        results.push({ habitId: h.habitId.toString(), success });
    }

    return NextResponse.json({
        ok: true,
        processed: results.length,
        results,
    });
}