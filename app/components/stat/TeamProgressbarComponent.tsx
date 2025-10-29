'use client'
import { Medal } from 'lucide-react'
import { motion } from 'framer-motion'

export default function TeamProgressbarComponent({ data }: { data: any[] }) {
    if (!data || data.length === 0)
        return <p className="text-gray-400 text-sm text-center">데이터 없음</p>

    return (
        <div className="space-y-4">
            {data.map((m, i) => {
                const rate = m.rate
                const rank = m.rank

                const medalColor =
                    rank === 1
                        ? 'text-yellow-400 drop-shadow-sm'
                        : rank === 2
                            ? 'text-gray-400'
                            : rank === 3
                                ? 'text-amber-700'
                                : ''

                // 색상 팔레트 (팀원별 차이)
                const gradients = [
                    'from-emerald-400 to-emerald-600',
                    'from-sky-400 to-sky-600',
                    'from-violet-400 to-violet-600',
                    'from-orange-400 to-orange-600',
                ]
                const color = gradients[i % gradients.length]

                return (
                    <div key={m.nickname} className="space-y-1.5">
                        {/* 상단 텍스트 */}
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                {rank <= 3 ? (
                                    <Medal className={`w-4 h-4 ${medalColor}`} />
                                ) : (
                                    <span className="text-[11px] text-gray-400 font-medium">{rank}위</span>
                                )}
                                <span className="font-medium text-gray-800">{m.nickname}</span>
                            </div>

                            {/* 성공률 표기 */}
                            <div className="flex items-baseline gap-1">
                                <span className="text-gray-800 text-base">{rate}%</span>
                                <span className="text-gray-400 text-[11px] font-medium">
                  ({m.completedDays}/{m.totalDays})
                </span>
                            </div>
                        </div>

                        {/* Progress Bar + Motion */}
                        <div className="relative w-full h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                            <motion.div
                                className={`h-full bg-gradient-to-r ${color} rounded-full shadow-[0_0_5px_rgba(0,0,0,0.1)]`}
                                initial={{ width: 0 }}
                                animate={{ width: `${rate}%` }}
                                transition={{
                                    duration: 0.7,
                                    ease: 'easeOut',
                                }}
                            />
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
