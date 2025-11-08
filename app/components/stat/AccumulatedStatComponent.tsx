'use client'

import { useEffect, useState } from 'react'
import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
} from 'recharts'
import { getTeamMonthlyStatsWithUser } from '@/app/stat/actions'
import { useSession } from 'next-auth/react'
import {ChevronLeft, ChevronRight} from "lucide-react";

export default function AccumulatedStatComponent({ habitId }: { habitId: string }) {
    const { data: session } = useSession()
    const uid = Number(session?.user?.uid)

    const [data, setData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [year, setYear] = useState(new Date().getFullYear())

    const moveYear = (diff: number) => {
        setYear((prev) => prev + diff)
    }

    async function loadData(y: number) {
        if (!uid) return
        setLoading(true)
        try {
            const result = await getTeamMonthlyStatsWithUser(habitId, uid, y)
            setData(result)
        } finally {
            setTimeout(() => setLoading(false), 800)
        }
    }

    useEffect(() => {
        loadData(year)
    }, [habitId, uid, year])

    if (!loading && (!data || data.length === 0))
        return (
            <p className="text-gray-400 text-sm text-center mt-2">
                누적 통계 없음
            </p>
        )

    return (
        <div className="p-4 border rounded-2xl bg-white shadow-sm">
            {/* 상단 헤더 */}
            <div className="flex items-center justify-between mb-2">
                <button
                    onClick={() => moveYear(-1)}
                    className="p-1 hover:bg-gray-100 rounded-full"
                >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>

                <h3 className="font-semibold text-gray-700 text-center">
                    {year}년 누적 통계
                </h3>

                <button
                    onClick={() => moveYear(1)}
                    className="p-1 hover:bg-gray-100 rounded-full"
                >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
            </div>

            {/* 로딩 중 skeleton*/}
            {loading && (
                <div className="absolute inset-x-0 bottom-0 top-[3.5rem] z-10 flex flex-col items-center bg-white/70 backdrop-blur-sm">
                    <div className="animate-pulse w-full space-y-6 px-2">
                        <div className="w-full h-56 bg-gray-200/70 rounded-xl mt-6"></div>
                        <div className="flex items-center justify-center my-2">
                            <div className="w-1/2 h-[1px] bg-gray-200/60" />
                        </div>
                        <div className="space-y-3">
                            {Array.from({ length: 2 }).map((_, i) => (
                                <div key={i} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <div className="w-24 h-3 bg-gray-200/70 rounded" />
                                        <div className="w-12 h-3 bg-gray-200/70 rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <section>
                <div className="flex justify-center items-center gap-5 mb-2 text-sm font-medium text-gray-700">
                    <div className="flex items-center gap-1">
                        <span className="inline-block w-3 h-3 rounded-sm bg-[#F8CBB8]"></span>
                        팀 평균
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="inline-block w-3 h-3 rounded-full bg-[#ed827b]"></span>
                        내 달성률
                    </div>
                </div>

                <div className="w-full h-60">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                            data={data}
                            margin={{ top: 10, right: 0, left: -30, bottom: -10 }}
                        >
                            <CartesianGrid stroke="#E7E4DE" strokeDasharray="3 3" />
                            <XAxis
                                dataKey="month"
                                tick={{ fill: "#6B6258", fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                                interval="preserveStartEnd"
                                minTickGap={15}
                                padding={{ left: 0, right: 0 }}
                            />
                            <YAxis domain={[0, 100]} tick={{ fill: "#6B6258", fontSize: 12 }} />

                            <Tooltip
                                formatter={(value, name) => {
                                    if (name === "teamRate") return [`${value}%`, "팀 평균"];
                                    if (name === "myRate") return [`${value}%`, "내 달성률"];
                                    return value;
                                }}
                                labelFormatter={(label) => `${label}`}
                                contentStyle={{
                                    fontSize: "12px",
                                    borderRadius: "8px",
                                    border: "1px solid #E7E4DE",
                                    backgroundColor: "rgba(255,253,248,0.95)",
                                    color: "#4B3A24",
                                }}
                            />

                            {/* 팀 평균 bar */}
                            <Bar
                                dataKey="teamRate"
                                fill="#F8CBB8"
                                barSize={26}
                                radius={[4, 4, 0, 0]}
                            />
                            <Line
                                type="monotone"
                                dataKey="myRate"
                                stroke="#ed827b"
                                strokeWidth={2.5}
                                dot={{ r: 4, fill: "#F6A6A1", strokeWidth: 0 }}
                            />

                        </ComposedChart>
                    </ResponsiveContainer>

                </div>
            </section>
        </div>
    )
}
