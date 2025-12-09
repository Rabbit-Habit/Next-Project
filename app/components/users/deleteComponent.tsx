"use client"

import FailModal from "@/app/components/modal/failModal";
import React, {startTransition, useActionState, useEffect, useState} from "react";
import ConfirmModal from "@/app/components/modal/confirmModal";
import SuccessModal from "@/app/components/modal/successModal";
import {UserDeleteAction} from "@/app/users/mypage/delete/actions";
import {signOut} from "next-auth/react";

interface DeleteProps {
    nickname: string | null;
}

const initState: DeleteResult = {
    uid: -1,
    error: "",
}

const UserDeleteClientAction = async (
    state: DeleteResult,
    formData: FormData
): Promise<DeleteResult> => {
    return UserDeleteAction(formData)
}

function DeleteComponent({ nickname }: DeleteProps) {
    const [state, action, isPending] = useActionState(UserDeleteClientAction, initState)

    // 실패 모달 상태 관리
    const [isFailModalOpen, setIsFailModalOpen] = useState(false)

    // 성공 모달 상태 관리
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)

    // 탈퇴 의사 확인 모달 상태 관리
    const [isCheckModalOpen, setIsCheckModalOpen] = useState(false)

    const handleDelete = async () => {
        const formData = new FormData()
        formData.append("reason", selectedReason === "직접 입력" ? customReason : selectedReason)
        startTransition(() => {
            action(formData)
        })
    }

    useEffect(() => {
        if (state.uid >= 0) {
            setIsCheckModalOpen(false)
            setIsSuccessModalOpen(true)
        } else if (state.error) {
            setIsCheckModalOpen(false)
            setIsFailModalOpen(true)
        }
    }, [state])

    const reasons = [
        "서비스 이용이 불편해서",
        "원하는 기능이 부족해서",
        "사용 빈도가 낮아서",
        "개인정보 삭제를 원해서",
        "직접 입력",
    ]

    const [selectedReason, setSelectedReason] = useState<string>("")
    const [customReason, setCustomReason] = useState("")

    const isButtonEnabled =
        selectedReason &&
        (selectedReason !== "직접 입력" || (selectedReason === "직접 입력" && customReason.trim().length > 0))

    return (
        <>
            {/* 삭제 의사 확인 모달 */}
            <ConfirmModal
                open={isCheckModalOpen}
                onConfirm={handleDelete}
                onOpenChange={() => setIsCheckModalOpen(false)}
                title="회원 탈퇴"
                description="정말로 탈퇴하시겠습니까?"
                isPending={isPending}
            />

            {/* 탈퇴 실패 모달 */}
            <FailModal
                open={isFailModalOpen}
                onOpenChange={() => {setIsFailModalOpen(false)}}
                title="회원 탈퇴 실패"
                description={
                    <>
                        {state.error}<br />
                        다시 시도해주세요.
                    </>
                }
            />

            {/* 탈퇴 변경 성공 모달 */}
            <SuccessModal
                open={isSuccessModalOpen}
                onClose={() => {
                    setIsSuccessModalOpen(false)
                    signOut({
                        redirect: true,
                        callbackUrl: "/auth/login"
                    }).then()
                }}
                title="회원 탈퇴 성공"
                description={
                    <>
                        회원 정보가 정삭적으로 파기되었습니다.<br />
                    </>
                }
            />

            <div className="min-h-screen flex flex-col items-center px-4 py-6 bg-gradient-to-b from-[#FFF5E6] via-[#FAE8CA] to-[#F5D7B0]">
                {/* 상단 안내 문구 */}
                <div className="mb-6 text-left">
                    <h2 className="text-xl font-semibold text-[#4A2F23]">
                        {nickname}님,<br/>
                        탈퇴하기 전에 안내드립니다.
                    </h2>
                    <p className="text-sm text-[#9B7A63] mt-2">
                        탈퇴 시 회원 정보는 즉시 삭제되며 복구 불가능합니다.<br />
                        마지막으로 탈퇴 사유를 선택해주세요.
                    </p>
                </div>

                {/* 흰색 박스 - 탈퇴 사유 선택 */}
                <div className="w-full max-w-md bg-[#FFF9F1] border border-[#F0D4B2] rounded-lg shadow p-4">
                    <div className="space-y-4">
                        {reasons.map((reason) => (
                            <label key={reason} className="flex items-center gap-2 cursor-pointer p-1">
                                <input
                                    type="radio"
                                    name="reason"
                                    value={reason}
                                    checked={selectedReason === reason}
                                    onChange={() => setSelectedReason(reason)}
                                />
                                <span className="text-[#4A2F23] text-md">{reason}</span>
                            </label>
                        ))}
                    </div>

                    {/* 기타 선택 시 입력창 노출 */}
                    {selectedReason === "직접 입력" && (
                        <textarea
                            placeholder="사유를 입력해주세요"
                            value={customReason}
                            onChange={(e) => {
                                setCustomReason(e.target.value)
                                const textarea = e.target;
                                textarea.style.height = "auto";
                                textarea.style.height = textarea.scrollHeight + "px"
                            }}
                            rows={3}
                            className="mt-3 w-full text-sm border border-[#E0B693] rounded-lg px-4 py-2 resize-none
                            focus:outline-none focus:ring-1 focus:ring-[#E0B693] text-gray-800 leading-6"
                            style={{ minHeight: "72px" }}
                        />
                    )}
                </div>

                {/* 탈퇴 버튼 */}
                <button
                    className={`mt-6 w-full max-w-md py-3 rounded-lg text-white font-semibold
                    transition ${
                        isButtonEnabled
                            ? "bg-red-500 hover:bg-red-600 cursor-pointer"
                            : "bg-red-300 cursor-not-allowed"
                    }`}
                    disabled={!isButtonEnabled}
                    onClick={() => setIsCheckModalOpen(true)}
                >
                    회원 탈퇴하기
                </button>
            </div>
        </>
    );
}

export default DeleteComponent