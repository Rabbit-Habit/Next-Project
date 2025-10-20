import { finalizeTodayIfMissed } from "@/app/habits/[habitId]/actions";
import prisma from "@/lib/prisma";
import {NextResponse} from "next/server";

export async function GET() {
    const habits = await prisma.habit.findMany({ select: { habitId: true }});
    for (const h of habits) {
        await finalizeTodayIfMissed(String(h.habitId));
    }
    return NextResponse.json({ ok: true, processed: habits.length });
}