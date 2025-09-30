"use client"

import {useState, useTransition} from "react";
import {deleteHabitAction, updateHabitAction} from "@/app/habits/[habitId]/edit/actions";
import FailModal from "@/app/components/modal/failModal";
import ConfirmModal from "@/app/components/modal/confirmModal";

// ✅ 서버에서 이미 직렬화된 형태로 받도록 타입 단순화
type HabitEditable = {
    habitId: string;              // bigint -> string
    title: string | null;
    rabbitName: string;
    goalDetail: string | null;
    goalCount: number | null;     // bigint -> number|null
    inviteCode: string | null;
    targetLat: number | null;     // Decimal -> number|null
    targetLng: number | null;     // Decimal -> number|null
    isAttendance: boolean;        // boolean|null -> boolean
}

export default function HabitEditForm({ habit }: { habit: HabitEditable }) {
    const [pending, startTransition] = useTransition()
    const [title, setTitle] = useState(habit.title ?? "")
    const [rabbitName, setRabbitName] = useState(habit.rabbitName)
    const [goalDetail, setGoalDetail] = useState(habit.goalDetail ?? "")
    const [goalCount, setGoalCount] = useState(habit.goalCount ? String(habit.goalCount) : "")
    const [targetLat, setTargetLat] = useState(habit.targetLat?.toString() ?? "")
    const [targetLng, setTargetLng] = useState(habit.targetLng?.toString() ?? "")
    const [isAttendance, setIsAttendance] = useState(!!habit.isAttendance)

    const [okMsg, setOkMsg] = useState<string | null>(null)
    const [errMsg, setErrMsg] = useState<string | null>(null)

    const [openDelete, setOpenDelete] = useState(false)
    const [openFail, setOpenFail] = useState(false)

    const handleSave = () => {
        setOkMsg(null); setErrMsg(null)
        startTransition(async () => {
            const res = await updateHabitAction({
                habitId: habit.habitId.toString(),
                title: title.trim() || null,
                rabbitName: rabbitName.trim(),
                goalDetail: goalDetail.trim() || null,
                goalCount: goalCount ? Number(goalCount) : null,
                targetLat: targetLat ? Number(targetLat) : null,
                targetLng: targetLng ? Number(targetLng) : null,
                isAttendance,
            })
            if (res.ok) setOkMsg("저장되었습니다.")
            else {
                setErrMsg(res.error || "저장 중 오류가 발생했습니다.")
                setOpenFail(true)
            }
        })
    }

    const handleDelete = () => {
        setOpenDelete(false)
        setOkMsg(null); setErrMsg(null)
        startTransition(async () => {
            const res = await deleteHabitAction(habit.habitId.toString())
            if (res.ok) {
                // 삭제 후 목록으로
                window.location.href = "/habits"
            } else {
                setErrMsg(res.error || "삭제 중 오류가 발생했습니다.")
                setOpenFail(true)
            }
        })
    }

    return (
        <>
            {/* 실패 모달 */}
            <FailModal
                open={openFail}
                onClose={() => setOpenFail(false)}
                title="실패"
                description={errMsg ?? "문제가 발생했어요."}
            />

            {/* 삭제 확인 모달 */}
            <ConfirmModal
                open={openDelete}
                onCancel={() => setOpenDelete(false)}
                onConfirm={handleDelete}
                title="삭제하시겠어요?"
                description={
                    <>이 습관을 삭제하면 기록도 더 이상 볼 수 없어요.<br/>정말 삭제할까요?</>
                }
            />

            <div className="space-y-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">제목</label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full border rounded-xl px-3 py-2"
                            placeholder="예) 물 2L 마시기"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium">토끼 이름</label>
                        <input
                            value={rabbitName}
                            onChange={(e) => setRabbitName(e.target.value)}
                            className="w-full border rounded-xl px-3 py-2"
                            placeholder="예) 토벅이"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium">목표 상세 (선택)</label>
                        <input
                            value={goalDetail}
                            onChange={(e) => setGoalDetail(e.target.value)}
                            className="w-full border rounded-xl px-3 py-2"
                            placeholder="예) 오전 500ml / 오후 500ml / 저녁 1L"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium">목표 횟수 (선택)</label>
                        <input
                            type="number"
                            min={1}
                            value={goalCount}
                            onChange={(e) => setGoalCount(e.target.value)}
                            className="w-full border rounded-xl px-3 py-2"
                            placeholder="예) 3"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium">위도(선택)</label>
                            <input
                                value={targetLat}
                                onChange={(e) => setTargetLat(e.target.value)}
                                className="w-full border rounded-xl px-3 py-2"
                                placeholder="37.5665"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">경도(선택)</label>
                            <input
                                value={targetLng}
                                onChange={(e) => setTargetLng(e.target.value)}
                                className="w-full border rounded-xl px-3 py-2"
                                placeholder="126.9780"
                            />
                        </div>
                    </div>

                    <label className="inline-flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={isAttendance}
                            onChange={(e) => setIsAttendance(e.target.checked)}
                        />
                        출석형 습관(하루 1회 체크)
                    </label>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleSave}
                        disabled={pending || !rabbitName.trim()}
                        className="flex-1 py-3 rounded-xl font-semibold border bg-black text-white disabled:opacity-50"
                    >
                        {pending ? "저장 중…" : "저장하기"}
                    </button>
                    <button
                        type="button"
                        onClick={() => setOpenDelete(true)}
                        disabled={pending}
                        className="px-4 py-3 rounded-xl font-semibold border border-red-300 text-red-600"
                    >
                        삭제
                    </button>
                </div>

                {okMsg && <p className="text-green-600">{okMsg}</p>}
            </div>
        </>
    )
}