import Header from "@/app/components/common/header";
import prisma from "@/lib/prisma";
import {cookies} from "next/headers";
import HabitEditForm from "@/app/components/habits/habitEditForm";

function toBigint(id: string) {
    try { return BigInt(id) } catch { return null }
}

export default async function HabitEditPage({ params }: { params: { habitId: string } }) {
    const cookieStore = await cookies()
    const uid = cookieStore.get("uid")?.value
    const userId = uid ? Number(uid) : undefined

    const habitId = toBigint(params.habitId)
    if (!habitId || !userId) {
        return (
            <div className="p-6">
                <Header title="습관 수정" />
                <p className="text-red-600 mt-4">잘못된 접근입니다.</p>
            </div>
        )
    }

    const habit = await prisma.habit.findFirst({
        where: { habitId, userId },
        select: {
            habitId: true,
            title: true,
            rabbitName: true,
            goalDetail: true,
            goalCount: true,
            inviteCode: true,
            targetLat: true,
            targetLng: true,
            isAttendance: true,
        },
    })

    if (!habit) {
        return (
            <div className="p-6">
                <Header title="습관 수정" />
                <p className="text-red-600 mt-4">해당 습관을 찾을 수 없습니다.</p>
            </div>
        )
    }

    // 타입 에러 수정 중
    // ✅ 클라이언트로 넘길 “직렬화 가능한” 형태로 변환
    const viewModel = {
        habitId: habit.habitId.toString(),                          // bigint -> string
        title: habit.title ?? null,
        rabbitName: habit.rabbitName,
        goalDetail: habit.goalDetail ?? null,
        goalCount: habit.goalCount ? Number(habit.goalCount) : null, // bigint -> number|null
        inviteCode: habit.inviteCode ?? null,
        targetLat: habit.targetLat ? Number(habit.targetLat) : null, // Decimal -> number|null
        targetLng: habit.targetLng ? Number(habit.targetLng) : null, // Decimal -> number|null
        isAttendance: !!habit.isAttendance,                          // boolean|null -> boolean
    }

    return (
        <div className="p-6 max-w-xl mx-auto">
            <Header title="습관 수정" />
            <HabitEditForm habit={viewModel} />
        </div>
    )
}