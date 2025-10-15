"use client"

import React, {useActionState, useEffect, useState} from "react";
import {ChangePasswordAction} from "@/app/users/mypage/password/actions";
import FailModal from "@/app/components/modal/failModal";
import SuccessModal from "@/app/components/modal/successModal";
import {useRouter} from "next/navigation";

interface PasswordEditProps {
    isSocial: boolean;
}

const initState: EditResult = {
    uid: -1,
    error: "",
}

interface FormState {
    oldPasswordConfirm: string,
    newPassword: string,
    newPasswordConfirm: string,
    isNewPasswordMatched: boolean | null,
}

const initFormState: FormState = {
    oldPasswordConfirm: "",
    newPassword: "",
    newPasswordConfirm: "",
    isNewPasswordMatched: null,
}

const passwordEditClientAction = async (
    state: EditResult,
    formData: FormData
): Promise<EditResult> => {
    return ChangePasswordAction(formData)
}

function PasswordEditComponent({ isSocial }: PasswordEditProps) {
    const [state, action, isPending] = useActionState(passwordEditClientAction, initState)

    const router = useRouter()

    // 실패 모달 상태 관리
    const [isFailModalOpen, setIsFailModalOpen] = useState(false)

    // 성공 모달 상태 관리
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)

    // 소셜 로그인 모달 상태 관리
    const [isSocialModalOpen, setIsSocialModalOpen] = useState(false)

    // 폼 데이터 상태 관리
    const [formState, setFormState] = useState(initFormState);

    // 디바운스용 상태 관리
    const [debouncedNewPasswordConfirm, setDebouncedNewPasswordConfirm] = useState(formState.newPasswordConfirm);

    const handleOldPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFormState((prev) => ({...prev, oldPasswordConfirm: value,}))
    }

    const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFormState((prev) => ({...prev, newPassword: value,}))
    }

    const handleNewPasswordConfirmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setFormState((prev) => ({ ...prev, newPasswordConfirm: value }))
    }

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedNewPasswordConfirm(formState.newPasswordConfirm)
        }, 500)

        return () => clearTimeout(handler)
    }, [formState.newPasswordConfirm])

    useEffect(() => {
        if (debouncedNewPasswordConfirm === "") {
            setFormState((prev) => ({ ...prev, isNewPasswordMatched: null }))
        } else {
            setFormState((prev) => ({
                ...prev,
                isNewPasswordMatched: prev.newPassword === debouncedNewPasswordConfirm,
            }))
        }
    }, [debouncedNewPasswordConfirm, formState.newPassword])

    useEffect(() => {
        if (state.uid >= 0) {
            setIsSuccessModalOpen(true)
        } else if (state.error) {
            setIsFailModalOpen(true)
        }
    }, [state])

    useEffect(() => {
        if (isSocial) {
            setIsSocialModalOpen(true)
        }
    }, [isSocial])

    return (
        <>
            {/* 소셜 로그인 비밀번호 변경 불가능 모달 */}
            <FailModal
                open={isSocialModalOpen}
                onClose={() => {
                    setIsSocialModalOpen(false)
                    router.back()
                }}
                title="비밀번호 변경 불가능"
                description={
                    <>
                        소셜 로그인 사용자의 경우<br />
                        비밀번호를 변경할 수 없습니다.
                    </>
                }
            />

            {/* 비밀번호 변경 실패 모달 */}
            <FailModal
                open={isFailModalOpen}
                onClose={() => {
                    setFormState(initFormState)
                    setIsFailModalOpen(false)
                }}
                title="비밀번호 변경 실패"
                description={
                    <>
                        {state.error}<br />
                        다시 시도해주세요.
                    </>
                }
            />

            {/* 비밀번호 변경 성공 모달 */}
            <SuccessModal
                open={isSuccessModalOpen}
                onClose={() => {
                    setFormState(initFormState)
                    setIsSuccessModalOpen(false)
                }}
                title="비밀번호 변경 성공"
                description={
                    <>
                        비밀번호가 성공적으로 변경되었습니다.<br />
                    </>
                }
            />
            <div className="min-h-screen flex flex-col items-center px-6 py-4">
                <form action={action} className="flex flex-col gap-6 w-full max-w-md">
                    {/* 기존 비밀번호 */}
                    <div className="flex flex-col">
                        <label htmlFor="oldPassword" className="text-sm font-medium text-pink-500 mb-1">
                            기존 비밀번호
                        </label>
                        <input
                            id="oldPassword"
                            type="password"
                            name="oldPassword"
                            placeholder="기존 비밀번호"
                            required
                            value={formState.oldPasswordConfirm}
                            onChange={handleOldPasswordChange}
                            className="border border-pink-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
                        />
                    </div>

                    {/* 새 비밀번호 */}
                    <div className="flex flex-col gap-3">
                        <label htmlFor="newPassword" className="text-sm font-medium text-pink-500 mb-1">
                            새 비밀번호
                        </label>
                        <input
                            id="newPassword"
                            type="password"
                            name="newPassword"
                            placeholder="새 비밀번호"
                            required
                            value={formState.newPassword}
                            onChange={handleNewPasswordChange}
                            className="border border-pink-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
                        />
                        <input
                            type="password"
                            name="newPasswordConfirm"
                            placeholder="새 비밀번호 확인"
                            required
                            value={formState.newPasswordConfirm}
                            onChange={handleNewPasswordConfirmChange}
                            className="border border-pink-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
                        />

                        {formState.isNewPasswordMatched === true && (
                            <span className="mt-1 text-sm text-blue-500">새 비밀번호가 일치합니다.</span>
                        )}
                        {formState.isNewPasswordMatched === false && (
                            <span className="mt-1 text-sm text-red-500">새 비밀번호가 일치하지 않습니다.</span>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={
                            !(
                                formState.oldPasswordConfirm !== "" &&
                                formState.isNewPasswordMatched === true &&
                                formState.newPassword !== ""
                            )
                        }
                        className={`font-semibold rounded-lg py-2 mt-2 transition
                    ${
                            formState.oldPasswordConfirm !== "" &&
                            formState.isNewPasswordMatched === true &&
                            formState.newPassword !== ""
                                ? "bg-pink-400 text-white hover:bg-pink-500"
                                : "bg-pink-300 text-white cursor-not-allowed"
                        }`}
                    >
                        비밀번호 변경
                    </button>
                </form>
            </div>
        </>
    )
}

export default PasswordEditComponent