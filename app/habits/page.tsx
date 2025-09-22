import prisma from "@/lib/prisma";

export default async function HabitsPage() {
  const habits = await prisma.habit.findMany({
    orderBy: { regDate: 'desc' },
    select: {
      habitId: true,
      title: true,
      rabbitName: true,
      rabbitStatus: true,
      regDate: true,
    },
  })

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">습관 목록</h1>

      <div className="space-y-2">
        {habits.map((h) => (
          <div key={h.habitId.toString()} className="border rounded p-3">
            <div className="font-semibold">{h.title ?? '(제목 없음)'}</div>
            <div>🐰 {h.rabbitName} · 상태: {h.rabbitStatus}</div>
            <div className="text-sm text-gray-500">
              등록일: {h.regDate ? new Date(h.regDate).toLocaleString() : '-'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

