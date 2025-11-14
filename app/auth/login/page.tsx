"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import FailModal from "@/app/components/modal/failModal";

function AuthLoginPage() {
    const router = useRouter()

    // 모달 상태 관리
    const [isModalOpen, setIsModalOpen] = useState(false)

    // 에러 메세지 상태 관리
    const [errorMsg, setErrorMsg] = useState("")

    // 아이디, 비밀번호 상태 관리
    const [id, setId] = useState("")
    const [password, setPassword] = useState("")

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()

        const res = await signIn("credentials", {
            redirect: false,
            id,
            password,
        })

        if (res?.error) {
            setErrorMsg(res.error)
            setIsModalOpen(true)
        } else {
            router.push("/main")
        }
    }

    const handleKakaoLogin = async (e: React.FormEvent) => {
        e.preventDefault()

        const res = await signIn("kakao", {
            callbackUrl: '/main'
        })

        if (res?.error) {
            setErrorMsg(res.error)
            setIsModalOpen(true)
        }
    }

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
                        {errorMsg}<br />
                        다시 시도해주세요.
                    </>
                }
            />

            <div className="min-h-screen flex flex-col items-center px-6 py-16 bg-gradient-to-b from-[#FFF5E6] via-[#FAE8CA] to-[#F5D7B0]">
                {/* 임시 텍스트 */}
                <div className="flex flex-col items-center mt-6 mb-16">
                    <span className="text-4xl font-bold text-rose-600 tracking-wide">
                        Rabbit<span className="text-amber-500">Habit</span>
                    </span>
                    <span className="text-md font-semibold text-maber-700 mt-1">
                        귀여운 습관 만들기 🐇
                    </span>
                </div>

                {/* 로그인 폼 */}
                <form onSubmit={handleLogin} className="flex flex-col gap-4 w-full max-w-md p-4">
                    {/* 아이디 */}
                    <div className="flex flex-col">
                        <label
                            htmlFor="id"
                            className="text-sm font-medium text-amber-600 mb-1"
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
                            className="bg-[#FFF9F1] border border-[#E0B693] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#E0B693]"
                        />
                    </div>

                    {/* 비밀번호 */}
                    <div className="flex flex-col">
                        <label
                            htmlFor="password"
                            className="text-sm font-medium text-amber-600 mb-1"
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
                            className="bg-[#FFF9F1] border border-[#E0B693] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#E0B693]"
                        />
                    </div>

                    {/* 로그인 버튼 */}
                    <button
                        type="submit"
                        disabled={!id || !password}
                        className={`font-semibold rounded-lg py-2 mt-4 transition ${
                            id && password
                                ? "bg-[#EDB17C] text-[#4A2F23] hover:bg-[#dea472] border border-[#C47A5A]"
                                : "bg-[#F1C9A5]  text-[#4A2F23] border border-[#E0B693] cursor-not-allowed"
                        }`}
                    >
                        로그인
                    </button>

                    {/* 추가 메뉴: 회원가입/아이디 찾기/비밀번호 찾기 */}
                    <div className="flex justify-center gap-5 text-sm text-gray-600">
                        <button
                            type="button"
                            onClick={() => router.push("/users/signup")}
                            className="hover:underline text-amber-600"
                        >
                            회원가입
                        </button>
                        <span>|</span>
                        <button
                            type="button"
                            className="hover:underline text-amber-600"
                        >
                            아이디 찾기
                        </button>
                        <span>|</span>
                        <button
                            type="button"
                            className="hover:underline text-amber-600"
                        >
                            비밀번호 찾기
                        </button>
                    </div>
                </form>

                {/* 구분선 */}
                <div className="flex items-center w-full max-w-md mt-2">
                    <div className="flex-grow h-px bg-[#9B7A63]" />
                    <span className="px-3 text-sm text-[#9B7A63]">간편 로그인</span>
                    <div className="flex-grow h-px bg-[#9B7A63]" />
                </div>

                {/* 카카오 로그인 */}
                <div className="w-full max-w-md rounded-xl p-4">
                    <button
                        type="button"
                        onClick={handleKakaoLogin}
                        className="w-full max-w-md text-[#4A2F23] bg-[#FEE500] border border-yellow-400 font-semibold rounded-lg flex items-center justify-center gap-2 py-3"
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