'use server'
import prisma from "@/lib/prisma"

// 공통 유틸 함수

// 월의 시작~끝 날짜 범위 반환
function getMonthRange(year: number, month: number) {
    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 1)
    return { start, end }
}

// 이번 주(월~일)의 시작/끝(KST 기준) 계산
function getWeekRangeKST() {
    const now = new Date()
    const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000)
    const day = kstNow.getUTCDay() // 요일 (0=일, 1=월...)
    const diffToMonday = day === 0 ? -6 : 1 - day

    // 월요일 0시
    const monday = new Date(kstNow)
    monday.setUTCDate(kstNow.getUTCDate() + diffToMonday)
    monday.setUTCHours(0, 0, 0, 0)

    // 일요일 23:59:59
    const sunday = new Date(monday)
    sunday.setUTCDate(monday.getUTCDate() + 6)
    sunday.setUTCHours(23, 59, 59, 999)

    return { monday, sunday }
}

// JS Date → YYYY-MM-DD 문자열 변환
function toLocalDate(d: Date) {
    const y = d.getFullYear()
    const m = (d.getMonth() + 1).toString().padStart(2, "0")
    const day = d.getDate().toString().padStart(2, "0")
    return `${y}-${m}-${day}`
}

// 팀원 + 닉네임 조회
async function getTeamMembers(habitId: bigint) {
    const habit = await prisma.habit.findUnique({
        where: { habitId },
        select: { teamId: true },
    })
    if (!habit?.teamId) return []

    const members = await prisma.teamMember.findMany({
        where: { teamId: habit.teamId },
        select: { userId: true },
    })
    if (members.length === 0) return []

    const users = await prisma.user.findMany({
        where: { userId: { in: members.map(m => m.userId) } },
        select: { userId: true, nickname: true },
    })

    return users
}

// 1. 주간 통계 (이번 주 월~일)
export async function getHabitWeeklyStatus(habitId: string) {
    const hId = BigInt(habitId)
    const { monday, sunday } = getWeekRangeKST()

    // 이번 주 팀 기록 조회
    const records = await prisma.habitTeamHistory.findMany({
        where: { habitId: hId, checkDate: { gte: monday, lte: sunday } },
        select: { checkDate: true, isCompleted: true },
        orderBy: { checkDate: 'asc' },
    })

    // 완료된 날짜만 추출
    const doneDates = records
        .filter(r => r.isCompleted)
        .map(r => toLocalDate(new Date(r.checkDate)))

    // 월~일까지 날짜 생성
    const days = ['월', '화', '수', '목', '금', '토', '일']
    return days.map((d, i) => {
        const date = new Date(monday)
        date.setUTCDate(monday.getUTCDate() + i)
        const iso = toLocalDate(date)
        return { day: d, date: iso, done: doneDates.includes(iso) }
    })
}

// 2. 월간 히트맵 (팀 전체)
export async function getTeamMonthlyHeatmap(habitId: string, year?: number, month?: number) {
    const hId = BigInt(habitId)
    const now = new Date()
    const y = year ?? now.getFullYear()
    const m = month ?? now.getMonth() + 1
    const { start, end } = getMonthRange(y, m)

    // habitTeamHistory 기준으로 월간 팀 기록 조회
    const teamRecords = await prisma.habitTeamHistory.findMany({
        where: { habitId: hId, checkDate: { gte: start, lt: end } },
        select: { checkDate: true, isCompleted: true },
        orderBy: { checkDate: "asc" },
    })

    // 개인 기록 중에서 성공한 사람들 가져오기
    const histories = await prisma.habitHistory.findMany({
        where: {
            habitId: hId,
            isCompleted: true,
            checkDate: { gte: start, lt: end },
        },
        select: { checkDate: true, userId: true },
    })

    // 날짜별 성공자 수 map
    const successMap = new Map<string, Set<number>>()
    for (const h of histories) {
        const key = toLocalDate(h.checkDate)
        if (!successMap.has(key)) successMap.set(key, new Set())
        successMap.get(key)!.add(Number(h.userId))
    }

    // 이번 달의 총 일수
    const lastDay = new Date(y, m, 0).getDate()

    // 일자별 히트맵 구성
    const days = Array.from({ length: lastDay }, (_, i) => {
        const date = new Date(y, m - 1, i + 1)
        const key = toLocalDate(date)
        const teamRec = teamRecords.find(
            (r) => toLocalDate(r.checkDate) === key
        )
        const userSet = successMap.get(key)
        const successCount = userSet?.size ?? 0
        return {
            date: key,
            count: successCount,
            isAnySuccess: successCount > 0,      // 누군가 성공했는가
            isCompleted: teamRec?.isCompleted ?? false, // 팀 전체 성공 여부
        }
    })

    return { days, meta: { year: y, month: m } }
}

// 3. 팀원별 달성률 (해당 월)
export async function getTeamMemberProgress(habitId: string, year?: number, month?: number) {
    const hId = BigInt(habitId)
    const now = new Date()
    const y = year ?? now.getFullYear()
    const m = month ?? now.getMonth() + 1
    const { start, end } = getMonthRange(y, m)
    const totalDays = new Date(y, m, 0).getDate()

    // 팀원 목록 + 닉네임 조회
    const users = await getTeamMembers(hId)
    if (users.length === 0) return []

    // 각 팀원별 성공 일수 계산
    const results = await Promise.all(
        users.map(async (u) => {
            const completedDates = await prisma.habitHistory.findMany({
                where: {
                    habitId: hId,
                    userId: u.userId,
                    isCompleted: true,
                    checkDate: { gte: start, lt: end },
                },
                select: { checkDate: true },
            })

            const uniqueDates = new Set(
                completedDates.map(h => h.checkDate.toISOString().split('T')[0])
            )

            const completedDays = uniqueDates.size
            const rate = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0
            return { userId: u.userId, nickname: u.nickname, completedDays, totalDays, rate }
        })
    )

    // 달성률 순 정렬 + 동점 처리
    results.sort((a, b) => b.rate - a.rate)
    let lastRate: number | null = null
    let lastRank = 0

    return results.map((r, i) => {
        if (r.rate === lastRate) return { ...r, rank: lastRank }
        lastRate = r.rate
        lastRank = i + 1
        return { ...r, rank: lastRank }
    })
}

// 4. 누적 통계 (팀 평균 vs 개인)
export async function getTeamMonthlyStatsWithUser(habitId: string, userId: number, year?: number) {
    const hId = BigInt(habitId)

    // year가 안 들어오면 현재 연도로 기본값 설정
    const now = new Date()
    const y = year ?? now.getFullYear()

    // y년도의 데이터만 필터링
    const start = new Date(y, 0, 1)
    const end = new Date(y + 1, 0, 1)


    // 1) 1년치 habitHistory 한 번에 가져오기
    const allHistory = await prisma.habitHistory.findMany({
        where: {
            habitId: hId,
            checkDate: {
                gte: start,
                lt: end,
            },
        },
        select: { userId: true, checkDate: true, isCompleted: true },
    })

    // 해당 팀 멤버 미리 불러오기 (매달 반복 호출 방지)
    const members = await getTeamMembers(hId)

    // 2) 1~12월 루프 돌며 JS로 그룹화
    const months = Array.from({ length: 12 }, (_, i) => i + 1)
    const results = await Promise.all(
        months.map(async (m) => {
        const { start, end } = getMonthRange(y, m)

        // 이번 달 기록만 필터링
        const monthRecords = allHistory.filter(
            (r) => r.checkDate >= start && r.checkDate < end
        )

        if (monthRecords.length === 0) return { month: `${m}월`, teamRate: 0, myRate: 0 }

        // 유저별로 그룹화
        const groupedByUser = members.map(({ userId: uid }) => {
            const myDays = monthRecords.filter(r => Number(r.userId) === uid && r.isCompleted)
            const unique = new Set(myDays.map(r => toLocalDate(r.checkDate)))
            return { uid, completed: unique.size }
        })

        const totalDays = new Date(y, m, 0).getDate()

        // 3) 팀 평균 계산 (모든 유저의 달성률 평균)
        const teamRate = Math.round(
            groupedByUser.reduce((acc, u) => acc + (u.completed / totalDays) * 100, 0) /
            groupedByUser.length
        )

        // 4) 내 달성률 계산
        const me = groupedByUser.find(u => u.uid === userId)
        const myRate = me ? Math.round((me.completed / totalDays) * 100) : 0

        return { month: `${m}월`, teamRate, myRate }
    })
    )
    // 5) [{ month, teamRate, myRate }] 형태 반환
    return results
}
