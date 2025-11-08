"use client";

import { useState, useTransition } from "react";
import {
    deleteHabitAction,
    updateHabitAction,
} from "@/app/habits/[habitId]/edit/actions";
import FailModal from "@/app/components/modal/failModal";
import ConfirmModal from "@/app/components/modal/confirmModal";

// ✅ 서버에서 이미 직렬화된 형태로 받도록 타입 단순화
type HabitEditable = {
    habitId: string; // bigint -> string
    title: string | null;
    rabbitName: string;
    goalDetail: string | null;
    goalCount: number | null; // bigint -> number|null
    inviteCode: string | null;
    targetLat: number | null; // Decimal -> number|null
    targetLng: number | null; // Decimal -> number|null
    isAttendance: boolean; // boolean|null -> boolean
};

export default function HabitEditForm({ habit }: { habit: HabitEditable }) {
    const [pending, startTransition] = useTransition();
    const [title, setTitle] = useState(habit.title ?? "");
    const [rabbitName, setRabbitName] = useState(habit.rabbitName);
    const [goalDetail, setGoalDetail] = useState(habit.goalDetail ?? "");
    const [goalCount, setGoalCount] = useState(
        habit.goalCount ? String(habit.goalCount) : ""
    );
    const [targetLat, setTargetLat] = useState(
        habit.targetLat?.toString() ?? ""
    );
    const [targetLng, setTargetLng] = useState(
        habit.targetLng?.toString() ?? ""
    );
    const [isAttendance, setIsAttendance] = useState(!!habit.isAttendance);

    const [okMsg, setOkMsg] = useState<string | null>(null);
    const [errMsg, setErrMsg] = useState<string | null>(null);

    const [openDelete, setOpenDelete] = useState(false);
    const [openFail, setOpenFail] = useState(false);

    const handleSave = () => {
        setOkMsg(null);
        setErrMsg(null);
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
            });
            if (res.ok) setOkMsg("저장되었습니다.");
            else {
                setErrMsg(res.error || "저장 중 오류가 발생했습니다.");
                setOpenFail(true);
            }
        });
    };

    const handleDelete = () => {
        setOpenDelete(false);
        setOkMsg(null);
        setErrMsg(null);
        startTransition(async () => {
            const res = await deleteHabitAction(habit.habitId.toString());
            if (res.ok) {
                // 삭제 후 목록으로
                window.location.href = "/habits";
            } else {
                setErrMsg(res.error || "삭제 중 오류가 발생했습니다.");
                setOpenFail(true);
            }
        });
    };

    return (
        <div
            className="
                w-full min-h-[calc(100vh-80px)]
                bg-gradient-to-b from-[#FFF5E6] via-[#FAE8CA] to-[#F5D7B0]
                flex justify-center items-start
                px-4 py-8
            "
        >
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
                    <>
                        이 습관을 삭제하면 기록도 더 이상 볼 수 없어요.
                        <br />
                        정말 삭제할까요?
                    </>
                }
            />

            {/* 에딧 카드 래퍼 */}
            <div
                className="
          mt-4 w-full max-w-md mx-auto
          rounded-3xl border border-[#F0D4B2]
          bg-gradient-to-b from-[#FFF9F1] to-[#F7E4CC]
          shadow-md px-6 py-6 space-y-6
        "
            >
                {/* 타이틀 */}
                <div className="text-center space-y-1">
                    <h2 className="text-lg font-bold text-[#4A2F23]">
                        📝 습관 정보 수정
                    </h2>
                </div>

                {/* 폼 필드들 */}
                <div className="space-y-4 text-sm">
                    <div>
                        <label className="block mb-1 text-xs font-semibold text-[#5C3B28]">
                            제목
                        </label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="
                w-full border border-[#F0D4B2]/80 rounded-2xl px-3 py-2
                text-sm bg-[#FFFDF8] text-[#4A2F23]
                focus:outline-none focus:ring-2 focus:ring-[#F1C9A5] focus:border-transparent
              "
                            placeholder="예) 물 2L 마시기"
                        />
                    </div>

                    <div>
                        <label className="block mb-1 text-xs font-semibold text-[#5C3B28]">
                            토끼 이름
                        </label>
                        <input
                            value={rabbitName}
                            onChange={(e) => setRabbitName(e.target.value)}
                            className="
                w-full border border-[#F0D4B2]/80 rounded-2xl px-3 py-2
                text-sm bg-[#FFFDF8] text-[#4A2F23]
                focus:outline-none focus:ring-2 focus:ring-[#F1C9A5] focus:border-transparent
              "
                            placeholder="예) 토벅이"
                        />
                    </div>

                    <div>
                        <label className="block mb-1 text-xs font-semibold text-[#5C3B28]">
                            목표 상세 (선택)
                        </label>
                        <input
                            value={goalDetail}
                            onChange={(e) => setGoalDetail(e.target.value)}
                            className="
                w-full border border-[#F0D4B2]/80 rounded-2xl px-3 py-2
                text-sm bg-[#FFFDF8] text-[#4A2F23]
                focus:outline-none focus:ring-2 focus:ring-[#F1C9A5] focus:border-transparent
              "
                            placeholder="예) 오전 500ml / 오후 500ml / 저녁 1L"
                        />
                    </div>

                    <div>
                        <label className="block mb-1 text-xs font-semibold text-[#5C3B28]">
                            목표 횟수 (선택)
                        </label>
                        <input
                            type="number"
                            min={1}
                            value={goalCount}
                            onChange={(e) => setGoalCount(e.target.value)}
                            className="
                w-full border border-[#F0D4B2]/80 rounded-2xl px-3 py-2
                text-sm bg-[#FFFDF8] text-[#4A2F23]
                focus:outline-none focus:ring-2 focus:ring-[#F1C9A5] focus:border-transparent
              "
                            placeholder="예) 3"
                        />
                    </div>
                </div>

                {/* 버튼들 */}
                <div className="flex gap-2 pt-1">
                    <button
                        onClick={handleSave}
                        disabled={pending || !rabbitName.trim()}
                        className={`
              flex-1 py-3 rounded-2xl font-semibold border border-[#E0B693]/60
              ${
                            pending || !rabbitName.trim()
                                ? "bg-[#F3DEC6] text-[#B39A82] cursor-not-allowed"
                                : "bg-[#F1C9A5] text-[#4A2F23] hover:bg-[#E4B88F]"
                        }
              transition
            `}
                    >
                        {pending ? "저장 중…" : "저장하기"}
                    </button>

                    <button
                        type="button"
                        onClick={() => setOpenDelete(true)}
                        disabled={pending}
                        className="
              px-4 py-3 rounded-2xl font-semibold border border-[#F3B4B4]
              text-[#C0392B] bg-[#FDECEC] hover:bg-[#FAD3D3]
              disabled:opacity-60 disabled:cursor-not-allowed text-sm
            "
                    >
                        삭제
                    </button>
                </div>

                {okMsg && (
                    <p className="text-xs text-green-700 text-center">{okMsg}</p>
                )}
            </div>
        </div>
    );
}
