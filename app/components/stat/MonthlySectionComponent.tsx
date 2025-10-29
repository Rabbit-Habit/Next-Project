'use client'

import { useEffect, useState } from 'react'
import { getTeamMonthlyHeatmap, getTeamMemberProgress } from '@/app/stat/actions'
import {ChevronLeft, ChevronRight, Loader2} from 'lucide-react'
import HeatmapComponent from './HeatmapComponent'
import TeamProgressbarComponent from './TeamProgressbarComponent'

export default function MonthlySectionComponent({ habitId }: { habitId: string }) {
    const [year, setYear] = useState(new Date().getFullYear())
    const [month, setMonth] = useState(new Date().getMonth() + 1)
    const [loading, setLoading] = useState(true)

    const [heatmapData, setHeatmapData] = useState<any>(null)
    const [progressData, setProgressData] = useState<any[]>([])

    // 월 이동 함수 (이제 상위에서 관리)
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

    // 데이터 로드 함수
    async function loadAll(y: number, m: number) {
        setLoading(true)
        try {
            const [heatmap, progress] = await Promise.all([
                getTeamMonthlyHeatmap(habitId, y, m),
                getTeamMemberProgress(habitId, y, m),
            ])
            setHeatmapData(heatmap)
            setProgressData(progress)
        } finally {
            setTimeout(() => setLoading(false), 200)
        }
    }

    useEffect(() => {
        loadAll(year, month)
    }, [habitId, year, month])

    return (
        <div className="relative p-4 border rounded-2xl bg-white shadow-sm overflow-hidden min-h-[360px]">
            {/* 상단 헤더 (항상 유지) */}
            <div className="flex items-center justify-between mb-3">
                <button
                    onClick={() => moveMonth(-1)}
                    disabled={loading}
                    className="p-1 hover:bg-gray-100 rounded-full"
                >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>

                <h3 className="font-semibold text-gray-700 text-center">
                    {year}년 {month}월
                </h3>

                <button
                    onClick={() => moveMonth(1)}
                    disabled={loading}
                    className="p-1 hover:bg-gray-100 rounded-full"
                >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
            </div>

            {/* 로딩 중 skeleton */}
            {loading && (
                <div className="absolute inset-x-0 bottom-0 top-[3.5rem] z-10 flex flex-col items-center bg-white/70 backdrop-blur-sm">
                    <div className="animate-pulse w-full space-y-6 px-2">
                        <div className="grid grid-cols-7 gap-1 mt-2">
                            {Array.from({ length: 35 }).map((_, i) => (
                                <div key={i} className="h-7 bg-gray-200/70 rounded-sm" />
                            ))}
                        </div>
                        <div className="flex items-center justify-center my-2">
                            <div className="w-1/2 h-[1px] bg-gray-200/60" />
                        </div>
                        <div className="space-y-3">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <div className="w-24 h-3 bg-gray-200/70 rounded" />
                                        <div className="w-12 h-3 bg-gray-200/70 rounded" />
                                    </div>
                                    <div className="w-full h-3 bg-gray-200/70 rounded-full" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* 실제 콘텐츠 */}
            <section
                className={`space-y-6 relative transition-opacity duration-300 ${
                    loading ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}
            >
                <HeatmapComponent
                    data={heatmapData}
                    year={year}
                    month={month}
                />

                <div className="relative flex items-center justify-center my-4">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                    </div>
                    <h3 className="relative bg-white px-3 text-sm font-semibold text-gray-600">
                        팀원별 개인 성공률
                    </h3>
                </div>

                <TeamProgressbarComponent data={progressData} />
            </section>
        </div>
    )
}