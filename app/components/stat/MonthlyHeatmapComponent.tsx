'use client'

import { getTeamMonthlyHeatmap } from "@/app/stat/actions"
import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, Loader2, PieChart, CheckCircle2 } from "lucide-react"


export default function MonthlyHeatmapComponent({ habitId }: { habitId: string }) {
    const [data, setData] = useState<any>(null)
    const [year, setYear] = useState<number>(new Date().getFullYear())
    const [month, setMonth] = useState<number>(new Date().getMonth() + 1)
    const [loading, setLoading] = useState(false)

    // 서버 액션 호출 함수 (월 변경 시마다 실행)
    async function loadData(y: number, m: number) {
        setLoading(true)
        try {
            const result = await getTeamMonthlyHeatmap(habitId, y, m)
            setData(result)
        } finally {
            setTimeout(() => setLoading(false), 250)
        }
    }

    // 최초 렌더링 시 / habitId·year·month 변경 시 실행
    useEffect(() => {
        loadData(year, month)
    }, [habitId, year, month])


    const days = data?.days ?? []
    const meta = data?.meta ?? { year, month }
    const firstDay = new Date(meta.year, meta.month - 1, 1).getDay() // 1일의 요일 (달력 시작 공백 계산용)
    const blanks = Array.from({ length: (firstDay + 6) % 7 }) // 월요일 시작 기준으로 앞쪽 빈칸 채우기 (요일 정렬)

    // 날짜 칸 색상 (히트맵 색상)
    const color = (d: { isAnySuccess: boolean; isCompleted: boolean }) => {
        if (!d.isAnySuccess) return "bg-gray-200 border border-gray-200"
        if (!d.isCompleted) return "bg-emerald-200 border border-emerald-300"
        return "bg-emerald-400 border border-emerald-500"
    }

    const textShadow = (d: { isCompleted: boolean }) =>
        d.isCompleted ? { textShadow: "0 0 1px rgba(0,0,0,0.6)" } : {}

    // 월 이동 함수 (좌우 화살표 클릭 시 호출)
    const moveMonth = (diff: number) => {
        let newMonth = month + diff
        let newYear = year
        if (newMonth < 1) {
            newMonth = 12
            newYear -= 1
        } else if (newMonth > 12) {
            newMonth = 1
            newYear += 1
        }
        setYear(newYear)
        setMonth(newMonth)
    }

    // 통계 계산
    const totalDays = days.length
    const completedDays = days.filter((d: any) => d.isCompleted).length
    const successRate =
        totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0

    return (
        <div className="p-4 border rounded-2xl bg-white shadow-sm relative">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-3">
                <button
                    onClick={() => moveMonth(-1)}
                    className="p-1 hover:bg-gray-100 rounded-full"
                    disabled={loading}
                >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>

                <h3 className="font-semibold text-gray-700 text-center">
                    {meta.year}년 {meta.month}월
                </h3>

                <button
                    onClick={() => moveMonth(1)}
                    className="p-1 hover:bg-gray-100 rounded-full"
                    disabled={loading}
                >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
            </div>

            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 gap-1 text-xs text-center mb-1 text-gray-400">
                {["월", "화", "수", "목", "금", "토", "일"].map((d) => (
                    <span key={d}>{d}</span>
                ))}
            </div>

            {/* 달력 본문 */}
            <div className="relative min-h-[160px]">
                <div
                    className={`grid grid-cols-7 gap-1 text-[10px] transition-opacity duration-300 ${
                        loading || !data ? "opacity-0" : "opacity-100"
                    }`}
                >
                    {blanks.map((_, i) => (
                        <div key={`b${i}`} className="h-7" />
                    ))}
                    {days.map(
                        (
                            d: {
                                date: string
                                isAnySuccess: boolean
                                isCompleted: boolean
                            },
                            i: number
                        ) => {
                            const dayNum = new Date(d.date).getDate()
                            return (
                                <div
                                    key={d.date}
                                    className={`relative h-7 rounded-sm flex items-center justify-center ${color(
                                        d
                                    )}`}
                                >
                                  <span
                                      className={`text-[10px] text-white font-semibold`}
                                      style={textShadow(d)}
                                  >
                                    {dayNum}
                                  </span>

                                </div>
                            )
                        }
                    )}
                </div>

                {/* 로딩 스피너 */}
                {(loading || !data) && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="animate-spin text-gray-500 w-6 h-6" />
                    </div>
                )}
            </div>

            {/* 달력 하단 통계줄 */}
            <div className="mt-3 flex items-center justify-center gap-4 text-sm font-medium text-gray-700">
                <div className="flex items-center gap-1">
                    <PieChart className="w-4 h-4 text-gray-700" />
                    <span>달성률</span>
                    <span className="text-gray-700 font-semibold">{successRate}%</span>
                </div>
                <span className="text-gray-300">|</span>
                <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-gray-700" />
                    <span className="text-gray-700 font-semibold">{completedDays}</span>회
                </div>
            </div>
        </div>
    )
}
