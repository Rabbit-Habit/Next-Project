"use client";

import {CheckIdAction, CheckNicknameAction, SignupAction} from "@/app/users/signup/actions";
import React, { useActionState, useEffect } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";

const initState: SignupResult = {
    result: 0,
    error: "",
}

export const signupClientAction = async (
    state: SignupResult,
    formData: FormData
): Promise<SignupResult> => {
    return SignupAction(formData);
}

function SignupComponent() {
    const router = useRouter()

    const [state, action, isPending] = useActionState(signupClientAction, initState)

    // 프로필 상태 관리
    const [profilePreview, setProfilePreview] = useState<string>("/icons/basic_profile.jpg")

    // 아이디, 닉네임 상태
    const [id, setId] = useState("")
    const [nickname, setNickname] = useState("")

    // 아이디, 닉네임 중복 확인 상태
    const [isIdChecked, setIsIdChecked] = useState<boolean | null>(null)
    const [isNicknameChecked, setIsNicknameChecked] = useState<boolean | null>(null)

    // 비밀번호 상태
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("")

    // 비밀번호 일치 확인 상태
    const [isPasswordMatched, setIsPasswordMatched] = useState<boolean | null>(null)

    // 디바운스용 상태
    const [debouncedConfirm, setDebouncedConfirm] = useState(passwordConfirm);

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setProfilePreview(URL.createObjectURL(e.target.files[0]))
        }
    }

    const checkId = async () => {
        const available = await CheckIdAction(id)

        if (available) {
            setIsIdChecked(true)
        } else {
            setIsIdChecked(false)
        }
    }

    const checkNickname = async () => {
        const available = await CheckNicknameAction(nickname)

        if (available) {
            setIsNicknameChecked(true)
        } else {
            setIsNicknameChecked(false)
        }
    }

    const handlePasswordConfirmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setPasswordConfirm(value)
    }

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedConfirm(passwordConfirm);
        }, 500);

        return () => clearTimeout(handler);
    }, [passwordConfirm]);

    useEffect(() => {
        if (debouncedConfirm === "") {
            setIsPasswordMatched(null);
        } else {
            setIsPasswordMatched(password === debouncedConfirm);
        }
    }, [debouncedConfirm, password]);

    useEffect(() => {
        if (state.result > 0) {
            router.push("/auth/login");
        }
    }, [state.result, router]);

    return (
        <div className="min-h-screen flex flex-col items-center px-6 py-12">
            {/* 폼 */}
            <form action={action} className="flex flex-col gap-6 w-full max-w-md">
                {/* 프로필 업로드 */}
                <div className="flex flex-col items-center mb-4">
                    <label
                        htmlFor="imageURL"
                        className="relative w-28 h-28 rounded-full border-1 border-gray-400  flex items-center justify-center cursor-pointer overflow-hidden"
                    >
                        <img
                            src={profilePreview}
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
                            className="flex-[3] border border-pink-200 rounded-lg px-4 py-2
                                       focus:outline-none focus:ring-2 focus:ring-pink-300"
                            onChange={(e) => {
                                setId(e.target.value);
                                setIsIdChecked(null);
                            }}
                        />
                        <button
                            type="button"
                            onClick={checkId}
                            disabled={!id || isIdChecked !== null}
                            className={`flex-[2] rounded-lg text-sm flex items-center justify-center transition
                                ${!id || isIdChecked !== null ? "bg-pink-300 text-white" : "bg-pink-400 text-white"}`}
                        >
                            중복확인
                        </button>
                    </div>

                    {/* 검증 상태에 따른 메시지 */}
                    {isIdChecked === true && (
                        <span className="mt-1 text-sm text-blue-500">
                            사용할 수 있는 아이디입니다.
                        </span>
                    )}
                    {isIdChecked === false && (
                        <span className="mt-1 text-sm text-red-500">
                            중복되는 아이디입니다.
                        </span>
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
                            className="flex-[3] border border-pink-200 rounded-lg px-4 py-2
                                       focus:outline-none focus:ring-2 focus:ring-pink-300"
                            onChange={(e) => {
                                setNickname(e.target.value);
                                setIsNicknameChecked(null);
                            }}
                        />
                        <button
                            type="button"
                            onClick={checkNickname}
                            disabled={!nickname || isNicknameChecked !== null}
                            className={`flex-[2] rounded-lg text-sm flex items-center justify-center transition
                                ${!nickname || isNicknameChecked !== null ? "bg-pink-300 text-white" : "bg-pink-400 text-white"}`}
                        >
                            중복확인
                        </button>
                    </div>

                    {/* 검증 상태에 따른 메시지 */}
                    {isNicknameChecked === true && (
                        <span className="mt-1 text-sm text-blue-500">
                            사용할 수 있는 닉네임입니다.
                        </span>
                    )}
                    {isNicknameChecked === false && (
                        <span className="mt-1 text-sm text-red-500">
                            중복되는 닉네임입니다.
                        </span>
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
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            // 확인 입력이 있으면 다시 검증
                            if (passwordConfirm !== "") {
                                setIsPasswordMatched(e.target.value === passwordConfirm);
                            }
                        }}
                        className="border border-pink-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
                    />
                    <input
                        type="password"
                        placeholder="비밀번호 확인"
                        value={passwordConfirm}
                        onChange={handlePasswordConfirmChange}
                        required
                        className="border border-pink-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
                    />

                    {/* 비밀번호 일치 여부 메시지 */}
                    {isPasswordMatched === true && (
                        <span className="mt-1 text-sm text-blue-500">
                            비밀번호가 일치합니다.
                        </span>
                    )}
                    {isPasswordMatched === false && (
                        <span className="mt-1 text-sm text-red-500">
                            비밀번호가 일치하지 않습니다.
                        </span>
                    )}
                </div>

                {/* 가입하기 버튼 */}
                <button
                    type="submit"
                    disabled={
                        !(
                            isIdChecked === true &&
                            isNicknameChecked === true &&
                            isPasswordMatched === true
                        ) || isPending
                    }
                    className={`font-semibold rounded-lg py-2 mt-2 transition
    ${
                        isIdChecked === true &&
                        isNicknameChecked === true &&
                        isPasswordMatched === true
                            ? "bg-pink-400 text-white hover:bg-pink-500"
                            : "bg-pink-300 text-white cursor-not-allowed"
                    }`}
                >
                    가입하기
                </button>
            </form>
        </div>
    )
}

export default SignupComponent;
