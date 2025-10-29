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
    Legend,
} from 'recharts'
import { getTeamMonthlyStatsWithUser } from '@/app/stat/actions'
import { useSession } from 'next-auth/react'

export default function AccumulatedStatComponent({ habitId }: { habitId: string }) {
    const { data: session } = useSession()
    const uid = Number(session?.user?.uid)

    const [data, setData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            if (!uid) return
            setLoading(true)
            try {
                const result = await getTeamMonthlyStatsWithUser(habitId, uid)
                setData(result)
            } finally {
                setTimeout(() => setLoading(false), 250)
            }
        }
        load()
    }, [habitId, uid])

    if (loading)
        return <div className="p-6 text-center text-gray-400 text-sm animate-pulse">불러오는 중...</div>

    if (!data || data.length === 0)
        return <p className="text-gray-400 text-sm text-center mt-2">누적 통계 없음</p>

    return (
        <div className="p-4 border rounded-2xl bg-white shadow-sm">
            <div className="flex justify-center items-center gap-5 mb-2 text-sm font-medium text-gray-700">
                <div className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded-sm bg-emerald-300"></span>
                    팀 평균
                </div>
                <div className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded-full bg-emerald-600"></span>
                    내 달성률
                </div>
            </div>

            <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={data}
                        margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis domain={[0, 100]} />

                        <Tooltip
                            formatter={(value, name) => {
                                if (name === 'teamRate') return [`${value}%`, '팀 평균']
                                if (name === 'myRate') return [`${value}%`, '내 달성률']
                                return value
                            }}
                            labelFormatter={(label) => `${label}`}
                            contentStyle={{
                                fontSize: '12px',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb',
                            }}
                        />

                        <Bar dataKey="teamRate" fill="#86efac" barSize={26} radius={[4, 4, 0, 0]} />
                        <Line
                            type="monotone"
                            dataKey="myRate"
                            stroke="#10b981"
                            strokeWidth={2.5}
                            dot={{ r: 4, fill: '#10b981' }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
