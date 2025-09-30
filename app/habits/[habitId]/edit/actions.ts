"use server"

import {cookies} from "next/headers";
import prisma from "@/lib/prisma";

type UpdateInput = {
    habitId: string
    title: string | null
    rabbitName: string
    goalDetail: string | null
    goalCount: number | null
    targetLat: number | null
    targetLng: number | null
    isAttendance: boolean
}

function toBigint(id: string) {
    try { return BigInt(id) } catch { return null }
}

// 수정(update)
export async function updateHabitAction(input: UpdateInput) {
    const cookieStore = await cookies()
    const uid = cookieStore.get("uid")?.value
    const userId = uid ? Number(uid) : undefined

    const habitId = toBigint(input.habitId)
    if (!userId || !habitId) return { ok: false, error: "권한 또는 파라미터 오류" }

    try {
        await prisma.habit.update({
            where: { habitId, userId },
            data: {
                title: input.title,
                rabbitName: input.rabbitName,
                goalDetail: input.goalDetail,
                goalCount: input.goalCount,
                targetLat: input.targetLat,
                targetLng: input.targetLng,
                isAttendance: input.isAttendance,
                modDate: new Date(),
            },
        })
        return { ok: true }
    } catch (e: any) {
        return { ok: false, error: e?.message || "저장 실패" }
    }
}

// 삭제
export async function deleteHabitAction(habitIdStr: string) {
    const cookieStore = await cookies()
    const uid = cookieStore.get("uid")?.value
    const userId = uid ? Number(uid) : undefined

    const habitId = toBigint(habitIdStr)
    if (!userId || !habitId) return { ok: false, error: "권한 또는 파라미터 오류" }

    try {
        await prisma.habit.delete({
            where: { habitId, userId },
        })
        return { ok: true }
    } catch (e: any) {
        return { ok: false, error: e?.message || "삭제 실패" }
    }
}