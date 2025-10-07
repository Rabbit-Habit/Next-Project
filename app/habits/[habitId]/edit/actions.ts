"use server"

import {cookies} from "next/headers";
import prisma from "@/lib/prisma";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";

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

const toBigInt = (v?: string | null) => (v ? BigInt(v) : null)

// function toBigint(id: string) {
//     try { return BigInt(id) } catch { return null }
// }

// 수정(update)
export async function updateHabitAction(input: UpdateInput) {
    const cookieStore = await cookies()
    const uid = cookieStore.get("uid")?.value
    const userId = toBigInt(uid)
    const habitId = toBigInt(input.habitId)
    if (!userId || !habitId) return { ok: false, error: "권한 또는 파라미터 오류" }

    const result = await prisma.habit.updateMany({
        where: { habitId, userId }, // 유저 소유일 때만 업데이트
        data: {
            title: input.title,
            rabbitName: input.rabbitName,
            goalDetail: input.goalDetail,
            goalCount: input.goalCount !== null ? BigInt(input.goalCount) : null,
            targetLat: input.targetLat, // Decimal 컬럼: number 전달 OK
            targetLng: input.targetLng,
            isAttendance: input.isAttendance,
            modDate: new Date(),
        },
    })

    if (result.count === 0) {
        return { ok: false, error: "수정 대상이 없거나 권한이 없습니다." }
    }

    // 목록이랑 상세페이지의 캐시 무효화 후, 상세페이지로 이동
    revalidatePath("/habits")
    revalidatePath(`/habits/${input.habitId}`)
    redirect(`/habits/${input.habitId}?updated=1`)
}

// 삭제
export async function deleteHabitAction(habitIdStr: string) {
    const cookieStore = await cookies()
    const uid = cookieStore.get("uid")?.value
    const userId = toBigInt(uid)
    const habitId = toBigInt(habitIdStr)
    if (!userId || !habitId) return { ok: false, error: "권한 또는 파라미터 오류" }

    const result = await prisma.habit.deleteMany({
        where: { habitId, userId },
    })

    if (result.count === 0) {
        return { ok: false, error: "삭제 대상이 없거나 권한이 없습니다." }
    }

    revalidatePath("/habits")
    redirect("/habits?deleted=1")
}