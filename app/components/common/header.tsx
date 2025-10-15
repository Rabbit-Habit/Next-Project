"use client";

import { useRouter } from "next/navigation";
import { IoArrowBackOutline } from "react-icons/io5";

interface HeaderProps {
    title: string;
    backUrl?: string;
}

function Header({ title, backUrl }: HeaderProps) {
    const router = useRouter();

    const handleBack = () => {
        if (backUrl) {
            router.push(backUrl)
        } else {
            router.back()
        }
    }

    return (
        <header
            className="flex items-center justify-between px-4 border-b border-gray-200 bg-white"
            style={{ height: "56px" }} // 고정 높이
        >
            {/* 왼쪽: 뒤로가기 버튼 */}
            <button
                onClick={handleBack}
                className="p-2 rounded-full hover:bg-gray-100 transition"
                aria-label="뒤로가기"
            >
                <IoArrowBackOutline size={22} className="text-gray-700" />
            </button>

            {/* 가운데: 타이틀 */}
            <h1 className="text-lg font-semibold text-gray-800 flex-1 text-center">
                {title}
            </h1>

            {/* 오른쪽: 공간 맞추기 (좌우 균형 유지용) */}
            <div className="w-9" />
        </header>
    )
}

export default Header