"use client";

import {CheckIdAction, CheckNicknameAction, SignupAction} from "@/app/users/signup/actions";
import React, { useActionState, useEffect } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import FailModal from "@/app/components/modal/failModal";

const initState: SignupResult = {
    result: 0,
    error: "",
}

interface FormState {
    id: string;
    nickname: string;
    password: string;
    passwordConfirm: string;
    isIdChecked: boolean | null;
    isNicknameChecked: boolean | null;
    isPasswordMatched: boolean | null;
    profilePreview: string;
}

const initFormState: FormState = {
    id: "",
    nickname: "",
    password: "",
    passwordConfirm: "",
    isIdChecked: null,
    isNicknameChecked: null,
    isPasswordMatched: null,
    profilePreview: "/icons/basic_profile.jpg",
};

const signupClientAction = async (
    state: SignupResult,
    formData: FormData
): Promise<SignupResult> => {
    return SignupAction(formData)
}

function SignupComponent() {
    const router = useRouter()

    const [state, action, isPending] = useActionState(signupClientAction, initState)

    // 모달 상태 관리
    const [isModalOpen, setIsModalOpen] = useState(false)

    // 폼 데이터 상태 관리
    const [formState, setFormState] = useState<FormState>(initFormState)

    // 디바운스용 상태
    const [debouncedConfirm, setDebouncedConfirm] = useState(formState.passwordConfirm)

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setFormState((prev) => ({
                ...prev,
                profilePreview: URL.createObjectURL(file),
            }))
        }
    }

    const checkId = async () => {
        const available = await CheckIdAction(formState.id)
        setFormState((prev) => ({ ...prev, isIdChecked: available }))
    };

    const checkNickname = async () => {
        const available = await CheckNicknameAction(formState.nickname)
        setFormState((prev) => ({ ...prev, isNicknameChecked: available }))
    };

    const handlePasswordConfirmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setFormState((prev) => ({ ...prev, passwordConfirm: value }))
    };

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedConfirm(formState.passwordConfirm)
        }, 500)

        return () => clearTimeout(handler)
    }, [formState.passwordConfirm])


    useEffect(() => {
        if (debouncedConfirm === "") {
            setFormState((prev) => ({ ...prev, isPasswordMatched: null }))
        } else {
            setFormState((prev) => ({
                ...prev,
                isPasswordMatched: prev.password === debouncedConfirm,
            }))
        }
    }, [debouncedConfirm, formState.password])

    useEffect(() => {
        if (state.result > 0) {
            router.push("/auth/login")
        } else if (state.error) {
            setIsModalOpen(true)
        }
    }, [state, router])

    return (
        <>
            {/* 회원가입 실패 모달 */}
            <FailModal
                open={isModalOpen}
                onClose={() => {
                    setDebouncedConfirm("")
                    setFormState(initFormState)
                    setIsModalOpen(false)
                }}
                title="회원가입 실패"
                description={
                    <>
                        회원가입 도중 문제가 발생했습니다.<br />
                        다시 시도해주세요.
                    </>
                }
            />

            <div className="min-h-screen flex flex-col items-center px-6 py-12">
                <form action={action} className="flex flex-col gap-6 w-full max-w-md">
                    {/* 프로필 업로드 */}
                    <div className="flex flex-col items-center mb-4">
                        <label
                            htmlFor="imageURL"
                            className="relative w-28 h-28 rounded-full border-1 border-gray-400 flex items-center justify-center cursor-pointer overflow-hidden"
                        >
                            <img
                                src={formState.profilePreview}
                                alt="Profile Preview"
                                className="w-full h-full object-cover"
                            />
                        </label>
                        <input
                            id="imageURL"
                            type="file"
                            name="imageURL"
                            accept="image/*"
                            className="hidden"
                            onChange={handleProfileChange}
                        />
                    </div>

                    {/* 아이디 */}
                    <div className="flex flex-col">
                        <label htmlFor="id" className="text-sm font-medium text-pink-500 mb-1">
                            아이디
                        </label>
                        <div className="flex gap-2 items-stretch">
                            <input
                                id="id"
                                type="text"
                                name="id"
                                placeholder="아이디"
                                required
                                value={formState.id}
                                onChange={(e) =>
                                    setFormState((prev) => ({
                                        ...prev,
                                        id: e.target.value,
                                        isIdChecked: null,
                                    }))
                                }
                                className="flex-[3] border border-pink-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
                            />
                            <button
                                type="button"
                                onClick={checkId}
                                disabled={!formState.id || formState.isIdChecked !== null}
                                className={`flex-[2] rounded-lg text-sm flex items-center justify-center transition
                                    ${
                                    !formState.id || formState.isIdChecked !== null
                                        ? "bg-pink-300 text-white"
                                        : "bg-pink-400 text-white"
                                }`}
                            >
                                중복확인
                            </button>
                        </div>

                        {formState.isIdChecked === true && (
                            <span className="mt-1 text-sm text-blue-500">사용할 수 있는 아이디입니다.</span>
                        )}
                        {formState.isIdChecked === false && (
                            <span className="mt-1 text-sm text-red-500">중복되는 아이디입니다.</span>
                        )}
                    </div>

                    {/* 닉네임 */}
                    <div className="flex flex-col">
                        <label htmlFor="nickname" className="text-sm font-medium text-pink-500 mb-1">
                            닉네임
                        </label>
                        <div className="flex gap-2 items-stretch">
                            <input
                                id="nickname"
                                type="text"
                                name="nickname"
                                placeholder="닉네임"
                                required
                                value={formState.nickname}
                                onChange={(e) =>
                                    setFormState((prev) => ({
                                        ...prev,
                                        nickname: e.target.value,
                                        isNicknameChecked: null,
                                    }))
                                }
                                className="flex-[3] border border-pink-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
                            />
                            <button
                                type="button"
                                onClick={checkNickname}
                                disabled={!formState.nickname || formState.isNicknameChecked !== null}
                                className={`flex-[2] rounded-lg text-sm flex items-center justify-center transition
                                    ${
                                    !formState.nickname || formState.isNicknameChecked !== null
                                        ? "bg-pink-300 text-white"
                                        : "bg-pink-400 text-white"
                                }`}
                            >
                                중복확인
                            </button>
                        </div>

                        {formState.isNicknameChecked === true && (
                            <span className="mt-1 text-sm text-blue-500">사용할 수 있는 닉네임입니다.</span>
                        )}
                        {formState.isNicknameChecked === false && (
                            <span className="mt-1 text-sm text-red-500">중복되는 닉네임입니다.</span>
                        )}
                    </div>

                    {/* 비밀번호 */}
                    <div className="flex flex-col gap-3">
                        <label htmlFor="password" className="text-sm font-medium text-pink-500 mb-1">
                            비밀번호
                        </label>
                        <input
                            id="password"
                            type="password"
                            name="password"
                            placeholder="비밀번호"
                            required
                            value={formState.password}
                            onChange={(e) =>
                                setFormState((prev) => ({
                                    ...prev,
                                    password: e.target.value,
                                    isPasswordMatched:
                                        prev.passwordConfirm !== ""
                                            ? e.target.value === prev.passwordConfirm
                                            : null,
                                }))
                            }
                            className="border border-pink-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
                        />
                        <input
                            type="password"
                            placeholder="비밀번호 확인"
                            value={formState.passwordConfirm}
                            onChange={handlePasswordConfirmChange}
                            required
                            className="border border-pink-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
                        />

                        {formState.isPasswordMatched === true && (
                            <span className="mt-1 text-sm text-blue-500">비밀번호가 일치합니다.</span>
                        )}
                        {formState.isPasswordMatched === false && (
                            <span className="mt-1 text-sm text-red-500">비밀번호가 일치하지 않습니다.</span>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={
                            !(formState.isIdChecked === true &&
                                formState.isNicknameChecked === true &&
                                formState.isPasswordMatched === true) || isPending
                        }
                        className={`font-semibold rounded-lg py-2 mt-2 transition
                        ${
                            formState.isIdChecked === true &&
                            formState.isNicknameChecked === true &&
                            formState.isPasswordMatched === true
                                ? "bg-pink-400 text-white hover:bg-pink-500"
                                : "bg-pink-300 text-white cursor-not-allowed"
                        }`}
                    >
                        가입하기
                    </button>
                </form>
            </div>
        </>
    )
}

export default SignupComponent
