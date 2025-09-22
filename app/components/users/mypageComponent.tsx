"use client"

import {useRouter} from "next/navigation";
import {Users, ListChecks, Bell, LogOut, Trash2, ChevronRight} from "lucide-react";
import React, {useState} from "react";
import ConfirmModal from "@/app/components/modal/confirmModal";
import {LogoutAction} from "@/app/users/mypage/actions";

interface MypageProps {
    nickname: string;
    imageUrl: string | null;
}

function MypageComponent({ nickname, imageUrl }: MypageProps) {
    const router = useRouter()

    const menuItems = [
        { label: "팀 관리", icon: <Users className="w-5 h-5 text-pink-400" /> },
        { label: "해빗 관리", icon: <ListChecks className="w-5 h-5 text-pink-400" /> },
        { label: "알람 설정", icon: <Bell className="w-5 h-5 text-pink-400" /> },
        { label: "로그아웃", icon: <LogOut className="w-5 h-5 text-pink-400" />, onClick: () => {setIsLogoutModalOpen(true)} },
        { label: "계정 탈퇴", icon: <Trash2 className="w-5 h-5 text-pink-400" /> },
    ]

    // 로그아웃 모달 상태 관리
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)

    return (
        <>
            {/* 로그아웃 모달 */}
            <ConfirmModal
                open={isLogoutModalOpen}
                onConfirm={LogoutAction}
                onCancel={() => setIsLogoutModalOpen(false)}
                title="로그아웃"
                description="정말로 로그아웃하시겠습니까?"
            />

            <div className="max-w-md mx-auto p-2 space-y-6 py-4">
                {/* 프로필 영역 */}
                <div className="flex flex-col items-center space-y-3 mx-2">
                    <img
                        src={imageUrl ?? "/icons/basic_profile.jpg"}
                        alt="프로필 이미지"
                        className="w-26 h-26 rounded-full object-cover"
                    />
                    <p className="text-lg font-semibold">{nickname}</p>
                    <button
                        className="w-full  bg-pink-400 text-white py-2 rounded-lg shadow transition"
                        onClick={() => router.push("/mypage/edit")}
                    >
                        개인 정보 수정
                    </button>
                </div>

                {/* 메뉴 리스트 */}
                <div className=" bg-white divide-y">
                    {menuItems.map((item, idx) => (
                        <button
                            key={idx}
                            className="flex items-center w-full px-4 py-4 space-x-3 hover:bg-pink-50 transition"
                            onClick={item.onClick}
                        >
                            <div className="flex items-center space-x-3">
                                {item.icon}
                                <span className="font-semibold text-gray-800">{item.label}</span>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
                        </button>
                    ))}
                </div>
            </div>
        </>
    )
}

export default MypageComponent