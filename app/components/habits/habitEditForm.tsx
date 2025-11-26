"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    updateHabitAction,
    deleteHabitAction,
    type UpdateHabitInput,
} from "@/app/habits/[habitId]/edit/actions";
import FailModal from "@/app/components/modal/failModal";
import ConfirmModal from "@/app/components/modal/confirmModal";
import SuccessModal from "@/app/components/modal/successModal";

type HabitEditable = {
    habitId: string;
    title: string;
    rabbitName: string;
    goalDetail: string;
    goalCount: number | null;
    teamName: string;
    isTeamHabit: boolean;
    canEdit: boolean;
};

const commonInputBase =
    "w-full px-3 py-2 rounded-2xl border border-[#F0D4B2]/80 text-sm sm:text-sm outline-none";
const editableInput =
    "bg-white/90 border-[#F0D4B2] focus:ring-2 focus:ring-[#F1C9A5] focus:border-transparent";
const readonlyInput =
    "bg-[#F3E5D0] border-transparent text-[#9B7A63] cursor-not-allowed";

export default function HabitEditForm({ habit }: { habit: HabitEditable }) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();

    const [title, setTitle] = useState(habit.title);
    const [rabbitName, setRabbitName] = useState(habit.rabbitName);
    const [goalDetail, setGoalDetail] = useState(habit.goalDetail);
    const [goalCount, setGoalCount] = useState(
        habit.goalCount != null ? String(habit.goalCount) : ""
    );
    const [teamName, setTeamName] = useState(habit.teamName);

    // 모달 상태들
    const [openFail, setOpenFail] = useState(false);
    const [errMsg, setErrMsg] = useState<string | null>(null);
    const [openDelete, setOpenDelete] = useState(false);
    const [openSuccess, setOpenSuccess] = useState(false);

    const { isTeamHabit, canEdit } = habit;

    const handleSave = () => {
        if (!canEdit || !rabbitName.trim()) return;

        const input: UpdateHabitInput = {
            habitId: habit.habitId,
            title: title.trim(),
            rabbitName: rabbitName.trim(),
            goalDetail: goalDetail.trim(),
            goalCount:
                isTeamHabit && goalCount.trim()
                    ? Number.parseInt(goalCount.trim(), 10)
                    : null,
            teamName: isTeamHabit ? teamName : undefined,
        };

        startTransition(async () => {
            const res = await updateHabitAction(input);
            if (!res.ok) {
                setErrMsg(res.message ?? "문제가 발생했어요.");
                setOpenFail(true);
            } else {
                setOpenSuccess(true);
            }
        });
    };

    const handleDelete = () => {
        if (!canEdit) return;

        startTransition(async () => {
            const res = await deleteHabitAction(habit.habitId);
            if (!res.ok) {
                setErrMsg(res.message ?? "삭제 중 문제가 발생했어요.");
                setOpenFail(true);
            } else {
                router.push("/habits");
            }
        });
    };

    const saveDisabled = pending || !rabbitName.trim() || !canEdit;

    // ✅ 팀 습관 + 권한 없으면 폼 대신 안내 카드
    if (isTeamHabit && !canEdit) {
        return (
            <div
                className=" w-full min-h-screen
                            bg-gradient-to-b from-[#FFF5E6] via-[#FAE8CA] to-[#F5D7B0]
                            flex justify-center items-start
                            px-4 py-8
                          "
            >
                <div
                    className="
                                mt-3 w-full max-w-md mx-auto
                                rounded-3xl border border-[#F0D4B2]
                                bg-gradient-to-b from-[#FFF9F1] to-[#F7E4CC]
                                px-6 py-6 space-y-2
                              "
                >
                    <p className="text-sm font-semibold text-[#4A2F23]">
                        이 팀의 리더만 습관 정보를 수정할 수 있어요.
                    </p>
                    <p className="text-xs text-[#9B7A63]">
                        팀장에게 부탁해서 수정해 달라고 해 보세요 🐰
                    </p>
                    <div className="flex gap-3 mt-4">
                        <button
                            onClick={() => router.back()}
                            className="
                                        flex-1 py-2 text-sm font-semibold rounded-xl
                                        bg-[#F1C9A5]/30 text-[#4A2F23]
                                        border border-[#E0B693]/60
                                        shadow-sm
                                        hover:bg-[#E4B88F]
                                        transition
                                      "
                        >
                            <span>⬅️</span> 돌아가기
                        </button>
                        <button
                            onClick={() => router.push(`/chat/${habit.habitId}`)}
                            className="
                                        flex-1 py-2 text-sm font-semibold rounded-xl
                                        bg-[#F1C9A5] text-[#4A2F23]
                                        border border-[#E0B693]
                                        shadow-sm
                                        hover:bg-[#FAD3D3]
                                        transition
                                      "
                        >
                            <span>💬</span> 채팅방으로 이동
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="
                        w-full min-h-screen
                        bg-gradient-to-b from-[#FFF5E6] via-[#FAE8CA] to-[#F5D7B0]
                        flex justify-center items-start
                        px-4 py-8
                      "
        >
            <SuccessModal
                open={openSuccess}
                onClose={() => {
                    setOpenSuccess(false);
                    router.push(`/habits/${habit.habitId}`); // 저장 후 이동
                }}
                title="저장 완료!"
                description="습관 정보가 성공적으로 수정되었어요 🐰✨"
            />

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
                <div className="space-y-4 rounded-2xl bg-[#FFF7EC] px-4 py-4 border border-[#F0D4B2]/60">
                    {/* 팀 이름 (팀 습관일 때만 노출) */}
                    {isTeamHabit && (
                        <div>
                            <label className="block mb-1 text-xs font-semibold text-[#5C3B28]">
                                팀 이름
                            </label>
                            <input
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                                className={`${commonInputBase} ${editableInput}`}
                                placeholder="예) 아침독서 5인팀 📚"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block mb-1 text-xs font-semibold text-[#5C3B28]">
                            제목
                        </label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className={`${commonInputBase} ${editableInput}`}
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
                            className={`${commonInputBase} ${editableInput}`}
                            placeholder="예) 토벅이"
                        />
                    </div>

                    <div>
                        <label className="block mb-1 text-xs font-semibold text-[#5C3B28]">
                            목표 상세
                        </label>
                        <textarea
                            value={goalDetail}
                            onChange={(e) => setGoalDetail(e.target.value)}
                            className={`
                                        ${commonInputBase} ${editableInput}
                                        min-h-[70px]    // 기본 약 3줄
                                        max-h-[200px]   // 너무 커지지 않도록 제한(optional)
                                        resize-none     // 사용자가 크기 조절 못하게 (optional)
                                        overflow-auto   // 내용 많아지면 스크롤
                                        leading-5
                                    `}
                            placeholder="언제, 어떻게 등 목표에 대해 자세히 기록해보세요."
                        />
                    </div>

                    {/* 목표 횟수: 팀 습관일 때만 생성 */}
                    {isTeamHabit && (
                        <div>
                            <label className="block mb-1 text-xs font-semibold text-[#5C3B28]">
                                목표 횟수 (선택)
                            </label>
                            <input
                                type="number"
                                min={1}
                                value={goalCount}
                                onChange={(e) => setGoalCount(e.target.value)}
                                className={`${commonInputBase} ${editableInput}`}
                                placeholder="예) 3"
                            />
                        </div>
                    )}
                </div>

                {/* 버튼들 */}
                <div className="flex gap-2">
                    <button
                        onClick={handleSave}
                        disabled={saveDisabled}
                        className={`
              flex-1 py-2 rounded-2xl font-semibold border border-[#E0B693]/60
              ${
                            saveDisabled
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
                        onClick={() => canEdit && setOpenDelete(true)}
                        disabled={pending || !canEdit}
                        className="
              px-4 rounded-2xl font-semibold border border-[#F3B4B4]
              text-[#C0392B] bg-[#FDECEC] hover:bg-[#FAD3D3]
              disabled:opacity-60 disabled:cursor-not-allowed text-sm
            "
                    >
                        삭제
                    </button>
                </div>
            </div>
        </div>
    );
}