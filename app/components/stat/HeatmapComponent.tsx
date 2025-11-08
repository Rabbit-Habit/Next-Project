'use client'

import { PieChart, CheckCircle2 } from "lucide-react"


export default function HeatmapComponent({
    data,
    year,
    month,
}: {
    data: any
    year: number
    month: number
}) {

    const days = data?.days ?? []
    const meta = data?.meta ?? { year, month }

    const firstDay = new Date(meta.year, meta.month - 1, 1).getDay() // 1일의 요일 (달력 시작 공백 계산용)
    const blanks = Array.from({ length: (firstDay + 6) % 7 }) // 월요일 시작 기준으로 앞쪽 빈칸 채우기 (요일 정렬)

    // 날짜 칸 색상 (히트맵 색상)
    const color = (d: { isAnySuccess: boolean; isCompleted: boolean }) => {
        if (!d.isAnySuccess) return "bg-gray-200/60 border border-gray-200/60"
        if (!d.isCompleted) return "bg-[#FFF3D9] border border-[#FFF3D9]"
        return "bg-[#FFE6A7] border border-[#FFE6A7]"
    }

    // 통계 계산
    const totalDays = days.length
    const completedDays = days.filter((d: any) => d.isCompleted).length
    const successRate =
        totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0

    return (
        <div>

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
                        !data ? "opacity-0" : "opacity-100"
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
                                      className="text-[11px] font-semibold text-white"
                                      style={{ opacity: 0.9 }}
                                  >
                                    {dayNum}
                                  </span>

                                </div>
                            )
                        }
                    )}
                </div>
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
