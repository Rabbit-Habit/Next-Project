'use client'

import { useState } from 'react'

type Props = {
  addHabitAction: (fd: FormData) => Promise<{ ok: boolean; message?: string } | void>
}

export default function HabitAddComponent({ addHabitAction }: Props) {
  const [message, setMessage] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function action(formData: FormData) {
    setPending(true)
    setMessage(null)
    try {
      const res = (await addHabitAction(formData)) as { ok: boolean; message?: string } | void
      if (res && !res.ok) setMessage(res.message || '등록 실패')
    } finally {
      setPending(false)
    }
  }

  return (
    <form action={action} className="space-y-3 max-w-md">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm mb-1">User ID*</label>
          <input name="userId" required className="w-full border rounded p-2" placeholder="1" />
        </div>
        <div>
          <label className="block text-sm mb-1">Team ID*</label>
          <input name="teamId" required className="w-full border rounded p-2" placeholder="1" />
        </div>
      </div>

      <div>
        <label className="block text-sm mb-1">습관 제목</label>
        <input name="title" className="w-full border rounded p-2" placeholder="물 2L 마시기" />
      </div>

      <div>
        <label className="block text-sm mb-1">상세 목표</label>
        <input name="goalDetail" className="w-full border rounded p-2" placeholder="하루 2L 이상" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm mb-1">목표 카운트</label>
          <input name="goalCount" className="w-full border rounded p-2" placeholder="1" />
        </div>
        <div>
          <label className="block text-sm mb-1">초대 코드</label>
          <input name="inviteCode" className="w-full border rounded p-2" placeholder="INV123" />
        </div>
      </div>

      <div>
        <label className="block text-sm mb-1">토끼 이름*</label>
        <input name="rabbitName" required className="w-full border rounded p-2" placeholder="Mocha" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm mb-1">위도</label>
          <input name="targetLat" className="w-full border rounded p-2" placeholder="37.5665" />
        </div>
        <div>
          <label className="block text-sm mb-1">경도</label>
          <input name="targetLng" className="w-full border rounded p-2" placeholder="126.9780" />
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded bg-blue-600 text-white py-2 disabled:opacity-50"
      >
        {pending ? '등록 중…' : '등록하기'}
      </button>

      {message && <p className="text-red-600 text-sm">{message}</p>}
    </form>
  )
}
