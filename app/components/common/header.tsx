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
            router.back();
        }
    }

    return (
        <div className="relative flex items-center p-4 border-b border-gray-200">
            {/* 뒤로가기 버튼 */}
            <button
                onClick={handleBack}
                className="absolute left-4 p-2 rounded hover:bg-gray-100"
            >
                <IoArrowBackOutline size={24} />
            </button>

            {/* 페이지 타이틀 */}
            <h1 className="mx-auto text-xl font-semibold">{title}</h1>
        </div>
    )
}

export default Header