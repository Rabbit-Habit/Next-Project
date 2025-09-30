"use client";

import React, {useActionState, useEffect, useState} from "react";
import { useRouter } from "next/navigation";
import {LoginAction} from "@/app/auth/login/actions";
import FailModal from "@/app/components/modal/failModal";
import {useLoginStore} from "@/app/store/useLoginStore";

const initState: LoginResult = {
    uid: -1,
    error: ""
}

const loginClientAction = async (
    state: LoginResult,
    formData: FormData
): Promise<LoginResult> => {
    return LoginAction(formData)
}

function AuthLoginPage() {
    const router = useRouter()

    const [state, action, isPending] = useActionState(loginClientAction, initState)

    // zustand 전역 상태 관리
    const {save} = useLoginStore()

    // 모달 상태 관리
    const [isModalOpen, setIsModalOpen] = useState(false)

    // 아이디, 비밀번호 상태 관리
    const [id, setId] = useState("")
    const [password, setPassword] = useState("")

    useEffect(() => {
        if (state.uid >= 0) {
            save(state.uid)
            router.push("/users/mypage");
        } else if (state.error) {
            setIsModalOpen(true);
        }
    }, [state, router]);

    return (
        <>
            {/* 로그인 실패 모달 */}
            <FailModal
                open={isModalOpen}
                onClose={() => {
                    setId("")
                    setPassword("")
                    setIsModalOpen(false)
                }}
                title="로그인 실패"
                description={
                    <>
                        {state.error}<br />
                        다시 시도해주세요.
                    </>
                }
            />

            <div className="min-h-screen flex flex-col items-center px-6 py-16">
                {/* 임시 텍스트 */}
                <div className="flex flex-col items-center mt-6 mb-16">
                    <span className="text-4xl font-bold text-pink-500 tracking-wide">
                        Rabbit<span className="text-yellow-500">Habit</span>
                    </span>
                    <span className="text-md text-gray-500 mt-1">
                        귀여운 습관 만들기 🐇
                    </span>
                </div>

                {/* 로그인 폼 */}
                <form action={action} className="flex flex-col gap-6 w-full max-w-md bg-white rounded-xl p-4">
                    {/* 아이디 */}
                    <div className="flex flex-col">
                        <label
                            htmlFor="id"
                            className="text-sm font-medium text-pink-500 mb-1"
                        >
                            아이디
                        </label>
                        <input
                            id="id"
                            type="text"
                            name="id"
                            value={id}
                            onChange={(e) => setId(e.target.value)}
                            placeholder="아이디"
                            required
                            className="border border-pink-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
                        />
                    </div>

                    {/* 비밀번호 */}
                    <div className="flex flex-col">
                        <label
                            htmlFor="password"
                            className="text-sm font-medium text-pink-500 mb-1"
                        >
                            비밀번호
                        </label>
                        <input
                            id="password"
                            type="password"
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="비밀번호"
                            required
                            className="border border-pink-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
                        />
                    </div>

                    {/* 로그인 버튼 */}
                    <button
                        type="submit"
                        disabled={!id || !password}
                        className={`font-semibold rounded-lg py-2 transition ${
                            id && password
                                ? "bg-pink-400 text-white hover:bg-pink-500"
                                : "bg-pink-300 text-white cursor-not-allowed"
                        }`}
                    >
                        로그인
                    </button>

                    {/* 추가 메뉴: 회원가입/아이디 찾기/비밀번호 찾기 */}
                    <div className="flex justify-center gap-5 text-sm text-gray-600">
                        <button
                            type="button"
                            onClick={() => router.push("/users/signup")}
                            className="hover:underline text-pink-500"
                        >
                            회원가입
                        </button>
                        <span>|</span>
                        <button
                            type="button"
                            className="hover:underline text-pink-500"
                        >
                            아이디 찾기
                        </button>
                        <span>|</span>
                        <button
                            type="button"
                            className="hover:underline text-pink-500"
                        >
                            비밀번호 찾기
                        </button>
                    </div>
                </form>

                {/* 구분선 */}
                <div className="flex items-center w-full max-w-md mt-2">
                    <div className="flex-grow h-px bg-gray-300" />
                    <span className="px-3 text-sm text-gray-500">간편 로그인</span>
                    <div className="flex-grow h-px bg-gray-300" />
                </div>

                {/* 카카오 로그인 */}
                <div className="w-full max-w-md rounded-xl p-4">
                    <button
                        type="button"
                        className="w-full max-w-md bg-[#FEE500] font-semibold rounded-lg flex items-center justify-center gap-2 py-3"
                    >
                        <img
                            src="/icons/kakao_text_speech.png"
                            alt="Kakao"
                            className="w-5 h-5"
                        />
                        <span>카카오톡으로 시작하기</span>
                    </button>
                </div>
            </div>
        </>
    )
}

export default AuthLoginPage