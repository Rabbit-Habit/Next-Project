'use client'

import { useEffect, useState } from 'react'
import { Smile, Frown, Circle } from 'lucide-react'
import { getHabitWeeklyStatus } from '@/app/stat/actions'

export default function WeeklyStampComponent({ habitId }: { habitId: string }) {
    const [week, setWeek] = useState<{ date: string; day: string; done: boolean }[]>([])

    useEffect(() => {
        async function fetchData() {
            const data = await getHabitWeeklyStatus(habitId)
            setWeek(data)
        }
        fetchData()
    }, [habitId])

    const today = new Date()
    today.setHours(23, 59, 59, 999)

    const parseLocalDate = (dateStr: string) => {
        const [y, m, d] = dateStr.split('-').map(Number)
        return new Date(y, m - 1, d)
    }

    return (
        <div className="mt-3 border-t pt-3 w-full flex justify-center">
            <div className="w-full max-w-[500px] flex flex-col items-stretch text-center">
                {/* 요일 */}
                <div className="grid grid-cols-7 text-xs text-gray-500 mb-1">
                    {week.map((d) => (
                        <div key={d.day} className="font-medium text-center">
                            {d.day}
                        </div>
                    ))}
                </div>

                {/* 아이콘 */}
                <div className="grid grid-cols-7">
                    {week.map((d) => {
                        const date = parseLocalDate(d.date)
                        const isPast = date <= today

                        let icon = <Circle className="w-5 h-5 text-gray-300 mx-auto" />
                        if (isPast && d.done)
                            icon = <Smile className="w-5 h-5 text-emerald-500 mx-auto" />
                        else if (isPast && !d.done)
                            icon = <Frown className="w-5 h-5 text-red-400 mx-auto" />

                        return (
                            <div key={d.day} className="flex items-center justify-center">
                                {icon}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
