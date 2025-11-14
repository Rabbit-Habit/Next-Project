"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChevronDown, ChevronUp, User } from "lucide-react";

interface Habit {
    habitId: string;
    title: string | null;
}

interface HabitDropdownProps {
    habits: Habit[];
}

function HabitDropdown({ habits }: HabitDropdownProps) {
    const router = useRouter()

    const pathname = usePathname()
    const currentHabitId = pathname.split("/")[2]

    const [isOpen, setIsOpen] = useState(false)

    const currentTitle =
        habits.find((h) => h.habitId === currentHabitId)?.title

    const handleSelect = (habitId: string) => {
        setIsOpen(false)
        router.push(`/main/${habitId}`)
    }

    return (
        <header className="relative w-full border-b border-gray-200 bg-white z-30">
            <div className="flex items-center justify-between px-4 h-14">
                {/* 왼쪽: 드롭다운 버튼 */}
                <div className="relative inline-block">
                    <button
                        onClick={() => setIsOpen((prev) => !prev)}
                        className="flex items-center justify-between px-4 py-2 min-w-[180px] text-lg font-semibold text-gray-800 border border-gray-100 rounded-lg bg-white shadow-sm"
                    >
                        <span>{currentTitle}</span>
                        {isOpen ? (
                            <ChevronUp className="w-5 h-5 text-gray-600" />
                        ) : (
                            <ChevronDown className="w-5 h-5 text-gray-600" />
                        )}
                    </button>

                    {/* 드롭다운 메뉴 */}
                    {isOpen && (
                        <ul className="absolute left-0 w-full bg-white border border-gray-200 rounded-lg shadow-md z-40 overflow-hidden mt-1">
                            {habits.map((habit) => (
                                <li
                                    key={habit.habitId}
                                    onClick={() => handleSelect(habit.habitId)}
                                    className="px-4 py-3 hover:bg-[#FFF9F1] text-gray-700"
                                >
                                    {habit.title}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* 오른쪽: 마이페이지 버튼 */}
                <button
                    onClick={() => router.push("/users/mypage")}
                    className="w-10 h-10 rounded-full bg-[#FFF2E0] flex items-center justify-center"
                    aria-label="마이페이지"
                >
                    <User className="w-6 h-6 text-[#D07B4A]c" />
                </button>
            </div>
        </header>
    )
}

export default HabitDropdown