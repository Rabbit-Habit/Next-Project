'use server'


import prisma from "@/lib/prisma";

// 주간 통계 (월~일)
export async function getHabitWeeklyStatus(habitId: string) {
    const hId = BigInt(habitId)

    // 오늘을 KST 기준으로 보정
    const now = new Date()
    const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000)

    const day = kstNow.getUTCDay() // KST 기준 요일 (0=일)
    const diffToMonday = day === 0 ? -6 : 1 - day

    const monday = new Date(kstNow)
    monday.setUTCDate(kstNow.getUTCDate() + diffToMonday)
    monday.setUTCHours(0, 0, 0, 0)

    const sunday = new Date(monday)
    sunday.setUTCDate(monday.getUTCDate() + 6)
    sunday.setUTCHours(23, 59, 59, 999)

    // DB에서 한 주 기록 조회
    const records = await prisma.habitTeamHistory.findMany({
        where: {
            habitId: hId,
            checkDate: { gte: monday, lte: sunday },
        },
        select: { checkDate: true, isCompleted: true },
        orderBy: { checkDate: 'asc' },
    })

    // UTC → KST 변환 함수
    const toKSTDate = (utcDate: Date) => {
        const kst = new Date(utcDate.getTime() + 9 * 60 * 60 * 1000)
        return kst.toISOString().split('T')[0]
    }

    const doneDates = records
        .filter((r) => r.isCompleted)
        .map((r) => toKSTDate(new Date(r.checkDate)))

    const days = ['월', '화', '수', '목', '금', '토', '일']
    const week = days.map((d, i) => {
        const date = new Date(monday)
        date.setUTCDate(monday.getUTCDate() + i)
        const iso = date.toISOString().split('T')[0]
        return { day: d, date: iso, done: doneDates.includes(iso) }
    })

    return week
}



// 월간 히트맵
export async function getTeamMonthlyHeatmap(habitId: string, year?: number, month?: number) {
    const hId = BigInt(habitId)
    const now = new Date()
    const y = year ?? now.getFullYear()
    const m = month ?? (now.getMonth() + 1)

    // 날짜 범위 (이번 달 1일 ~ 다음 달 1일 직전까지)
    const start = new Date(y, m - 1, 1)
    const end = new Date(y, m, 1)

    // 습관 + 팀 정보
    const habit = await prisma.habit.findUnique({
        where: { habitId: hId },
        include: { team: { include: { members: true } } },
    })
    if (!habit?.teamId)
        return { days: [], meta: { target: 0, year: y, month: m } }

    // 한 달치 팀 기록
    const records = await prisma.habitTeamHistory.findMany({
        where: {
            habitId: hId,
            checkDate: { gte: start, lt: end },
        },
        select: { checkDate: true, isCompleted: true, userIds: true },
        orderBy: { checkDate: "asc" },
    })

    // UTC → 로컬 날짜로 변환
    const toLocalDate = (d: Date) => {
        const year = d.getFullYear()
        const month = (d.getMonth() + 1).toString().padStart(2, "0")
        const day = d.getDate().toString().padStart(2, "0")
        return `${year}-${month}-${day}`
    }

    // 날짜별 매핑
    const map = new Map<string, { count: number; isCompleted: boolean }>()
    records.forEach((r) => {
        const key = toLocalDate(r.checkDate)
        const userCount = Array.isArray(r.userIds) ? r.userIds.length : 0
        map.set(key, { count: userCount, isCompleted: r.isCompleted })
    })

    // 이번 달 총 일수
    const lastDay = new Date(y, m, 0).getDate()

    // 일자별 데이터 구성
    const days = Array.from({ length: lastDay }, (_, i) => {
        const date = new Date(y, m - 1, i + 1)
        const dateStr = toLocalDate(date)
        const rec = map.get(dateStr)
        const count = rec?.count ?? 0
        const isCompleted = rec?.isCompleted ?? false
        const isAnySuccess = count > 0
        return { date: dateStr, count, isAnySuccess, isCompleted }
    })

    return {
        days,
        meta: { year: y, month: m },
    }
}