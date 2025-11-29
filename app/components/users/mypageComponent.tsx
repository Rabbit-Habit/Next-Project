"use client"

import {useRouter} from "next/navigation";
import {Users, ListChecks, Bell, Lock, LogOut, Trash2, ChevronRight, MessageSquare} from "lucide-react";
import React, {useState} from "react";
import ConfirmModal from "@/app/components/modal/confirmModal";
import ProfileChangeModal from "@/app/components/modal/profileChangeModal";
import {signOut} from "next-auth/react";

interface MypageProps {
    id: string;
    nickname: string;
    imageUrl: string | null;
}

function MypageComponent({ id, nickname, imageUrl }: MypageProps) {
    const router = useRouter()

    const menuItems = [
        { label: "팀 관리", icon: <Users className="w-5 h-5 text-amber-600" /> },
        { label: "해빗 관리", icon: <ListChecks className="w-5 h-5 text-amber-600" />, onClick: () => {router.push("/habits")} },
        { label: "채팅 목록", icon: <MessageSquare className="w-5 h-5 text-amber-600" />, onClick: () => { router.push("/chat") } },
        { label: "알람 설정", icon: <Bell className="w-5 h-5 text-amber-600" />, onClick: () => { router.push("/notifications") } },
        { label: "비밀번호 변경", icon: <Lock className="w-5 h-5 text-amber-600" />, onClick: () => {router.push("/users/mypage/password")}},
        { label: "계정 탈퇴", icon: <Trash2 className="w-5 h-5 text-amber-600" />, onClick: () => {router.push("/users/mypage/delete")}},
        { label: "로그아웃", icon: <LogOut className="w-5 h-5 text-amber-600" />, onClick: () => {setIsLogoutModalOpen(true)} },
    ]

    // 프로필 변경 모달 상태 관리
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)

    // 로그아웃 모달 상태 관리
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)

    const handleLogout = async () => {
        await signOut({
            redirect: true,
            callbackUrl: "/auth/login"
        })
    }

    return (
        <>
            {/* 로그아웃 모달 */}
            <ConfirmModal
                open={isLogoutModalOpen}
                onConfirm={handleLogout}
                onOpenChange={() => setIsLogoutModalOpen(false)}
                title="로그아웃"
                description="정말로 로그아웃하시겠습니까?"
            />

            {/* 프로필 변경 모달 */}
            <ProfileChangeModal
                key={isProfileModalOpen ? "profile-open" : "profile-closed"}
                open={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
            />

            <div className="min-h-screen flex flex-col items-center p-6 bg-gradient-to-b from-[#FFF5E6] via-[#FAE8CA] to-[#F5D7B0]">
                <div className="w-full max-w-md space-y-4">
                    {/* 프로필 영역 */}
                    <div className="flex items-center space-x-4">
                        {/* 프로필 사진 */}
                        <img
                            src={imageUrl ?? "/icons/basic_profile.jpg"}
                            alt="프로필 이미지"
                            className="w-20 h-20 rounded-full object-cover border border-[#E7C8A9]"
                        />

                        {/* 닉네임 / 아이디 */}
                        <div className="flex flex-col justify-center">
                            <p className="text-xl font-semibold text-[#4A2F23]">{nickname}</p>
                            <p className="text-[#9B7A63] text-md">아이디: {id}</p>
                        </div>
                    </div>

                    {/* 버튼 영역 */}
                    <div className="flex flex-row gap-2 text-sm">
                        <button
                            className="flex-1 py-2 rounded-md font-semibold bg-[#F1C9A5]  text-[#4A2F23] border border-[#E0B693] hover:bg-[#E4B88F] transition"
                            onClick={() => setIsProfileModalOpen(true)}
                        >
                            프로필 이미지 변경
                        </button>
                        <button
                            className="flex-1 rounded-md font-semibold bg-[#F1C9A5]  text-[#4A2F23] border border-[#E0B693] hover:bg-[#E4B88F] transition"
                            onClick={() => router.push("/users/mypage/nickname")}
                        >
                            닉네임 변경
                        </button>
                    </div>

                    {/* 메뉴 리스트 */}
                    <div className=" bg-[#FFF9F1] border-[#F0D4B2] divide-y border rounded-lg mt-6">
                        {menuItems.map((item, idx) => (
                            <button
                                key={idx}
                                className="flex items-center w-full px-4 py-4 space-x-3 hover:bg-[#F0D4B2] transition"
                                onClick={item.onClick}
                            >
                                <div className="flex items-center space-x-3">
                                    {item.icon}
                                    <span className="font-semibold text-[#4A2F23]">{item.label}</span>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </>
    )
}

export default MypageComponent