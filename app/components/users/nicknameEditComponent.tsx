"use client"

import React, {useActionState, useEffect, useState} from "react";
import {CheckNicknameAction} from "@/app/users/signup/actions";
import {NicknameEditAction} from "@/app/users/mypage/nickname/actions";
import FailModal from "@/app/components/modal/failModal";
import SuccessModal from "@/app/components/modal/successModal";

interface NicknameEditProps {
    nickname: string;
}

const initState: EditResult = {
    uid: -1,
    error: "",
}

const nicknameEditClientAction = async (
    state: EditResult,
    formData: FormData
): Promise<EditResult> => {
    return NicknameEditAction(formData)
}

function NicknameEditComponent({ nickname }: NicknameEditProps) {
    const [state, action, isPending] = useActionState(nicknameEditClientAction, initState)

    // 실패 모달 상태 관리
    const [isFailModalOpen, setIsFailModalOpen] = useState(false)

    // 성공 모달 상태 관리
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)

    // 닉네임 상태 관리
    const [newNickname, setNewNickname] = useState<string>("")

    // 닉네임 중복 체크 상태 관리
    const [isNicknameChecked, setIsNicknameChecked] = useState<boolean | null>(null)

    const checkNickname = async () => {
        const available = await CheckNicknameAction(newNickname)
        setIsNicknameChecked(available)
    }

    useEffect(() => {
        if (state.uid >= 0) {
            setIsSuccessModalOpen(true)
        } else if (state.error) {
            setIsFailModalOpen(true)
        }
    }, [state])

    return (
        <>
            {/* 닉네임 변경 실패 모달 */}
            <FailModal
                open={isFailModalOpen}
                onOpenChange={() => {
                    setNewNickname("")
                    setIsNicknameChecked(null)
                    setIsFailModalOpen(false)
                }}
                title="닉네임 변경 실패"
                description={
                    <>
                        닉네임 변경중 문제가 발생했습니다.<br />
                        다시 시도해주세요.
                    </>
                }
            />

            {/* 닉네임 변경 성공 모달 */}
            <SuccessModal
                open={isSuccessModalOpen}
                onClose={() => {
                    setNewNickname("")
                    setIsNicknameChecked(null)
                    setIsSuccessModalOpen(false)
                }}
                title="닉네임 변경 성공"
                description={
                    <>
                        닉네임이 성공적으로 변경되었습니다.<br />
                    </>
                }
            />

            <div className="min-h-screen flex flex-col items-center px-4 py-4 bg-gradient-to-b from-[#FFF5E6] via-[#FAE8CA] to-[#F5D7B0]">
                {/* 흰색 박스 */}
                <div className="w-full max-w-md bg-[#FFF9F1] border-[#F0D4B2] rounded-lg shadow-md p-4">
                    <form action={action} className="flex flex-col gap-6 w-full max-w-md">
                        {/* 닉네임 */}
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="nickname" className="text-sm font-medium text-amber-600 mb-1">
                                닉네임
                            </label>
                            <div className="flex gap-2 items-stretch">
                                <input
                                    id="nickname"
                                    type="text"
                                    name="nickname"
                                    placeholder="닉네임"
                                    required
                                    value={newNickname}
                                    onChange={(e) => {
                                        setNewNickname(e.target.value)
                                        setIsNicknameChecked(null)
                                    }}
                                    className="flex-[3] border border-[#E0B693] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#E0B693]"
                                />
                                <button
                                    type="button"
                                    onClick={checkNickname}
                                    disabled={!newNickname || isNicknameChecked !== null}
                                    className={`flex-[2] rounded-lg text-sm flex items-center justify-center transition font-semibold
                                ${
                                        !newNickname || isNicknameChecked !== null
                                            ? "bg-[#FFF2E0]  text-[#4A2F23] border border-[#E7C8A9] cursor-not-allowed"
                                            : "bg-[#F1C9A5] text-[#4A2F23] hover:bg-[#E4B88F] border border-[#E0B693]"
                                    }`}
                                >
                                    중복확인
                                </button>
                            </div>

                            {/* 기존 닉네임 */}
                            {isNicknameChecked === null && (
                                <span className="mt-1 text-sm text-[#4A2F23]">기존 닉네임: {nickname}</span>
                            )}

                            {/* 중복 확인 결과 메시지 */}
                            {isNicknameChecked === true && (
                                <span className="mt-1 text-sm text-blue-500">사용할 수 있는 닉네임입니다.</span>
                            )}
                            {isNicknameChecked === false && (
                                <span className="mt-1 text-sm text-red-500">중복되는 닉네임입니다.</span>
                            )}
                        </div>
                        <button
                            type="submit"
                            disabled={!newNickname || !isNicknameChecked}
                            className={`font-semibold rounded-lg py-2 mt-2 transition
                    ${
                                !newNickname || !isNicknameChecked
                                    ? "bg-[#FFF2E0] text-[#4A2F23] border border-[#E7C8A9] cursor-not-allowed"
                                    : "bg-[#F1C9A5]  text-[#4A2F23] hover:bg-[#E4B88F] border border-[#E0B693]"
                            }`}
                        >
                            변경하기
                        </button>
                    </form>
                </div>
            </div>
        </>
    )
}

export default NicknameEditComponent