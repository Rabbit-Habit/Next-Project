"use client";

import Link from "next/link";
import Header from "@/app/components/common/header";
import { Bell, Plus, Volume2, Vibrate } from "lucide-react";
import { useState } from "react";

const dummyNotifications = [
    {
        id: 1,
        habit: "물 2컵 마시기",
        days: ["월", "수", "금"],
        time: "08:10",
        sound: true,
        vibrate: true,
    },
    {
        id: 2,
        habit: "저녁 산책 20분",
        days: ["매일"],
        time: "21:40",
        sound: false,
        vibrate: true,
    },
    {
        id: 3,
        habit: "책 읽기 30분",
        days: ["화", "목"],
        time: "07:20",
        sound: true,
        vibrate: false,
    },
];

export default function NotificationsPage() {
    const [notis, setNotis] = useState(dummyNotifications);

    return (
        <div
            className="
      min-h-screen
      bg-gradient-to-b from-[#FFF5E8] via-[#FAEAD0] to-[#F7DDBE]
      flex flex-col
    "
        >
            <Header title="알림" />

            <div className="flex-1 px-5 py-6 space-y-6 max-w-md mx-auto w-full">

                {/* 섹션 헤더 */}
                <div className="space-y-1">
                    <h2 className="text-base font-semibold text-[#4A2F23] flex items-center gap-2">
                        <Bell size={18} className="text-[#C58752]" />
                        내 알람 목록
                    </h2>
                    <p className="text-xs text-[#8A6D55]">매일 정해진 시간에 습관을 잊지 않게 도와드릴게요.</p>
                </div>

                {/* 리스트 */}
                <div className="space-y-5">
                    {notis.map((item) => (
                        <div
                            key={item.id}
                            className="
              bg-[#FFFDF8]
              border border-[#EAD3BD]
              rounded-3xl
              shadow-sm
              px-5 py-4
              space-y-3
              transition
              hover:shadow-md hover:-translate-y-1
              active:scale-[0.98]
            "
                        >
                            {/* 상단 영역 - habit + toggle */}
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-[#F1C9A5]/40 flex items-center justify-center">
                                        <Bell size={15} className="text-[#C17C4F]" />
                                    </div>
                                    <span className="text-sm font-semibold text-[#4A2F23]">
                    {item.habit}
                  </span>
                                </div>

                                {/* 토글 */}
                                <div
                                    className={`
                    w-10 h-5 rounded-full flex items-center px-1
                    cursor-pointer transition
                    ${
                                        true
                                            ? "bg-[#F1C9A5] justify-end"
                                            : "bg-[#E0C7A8] justify-start"
                                    }
                  `}
                                >
                                    <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                                </div>
                            </div>

                            {/* 요일 pill */}
                            <div className="flex gap-2 flex-wrap text-[11px]">
                                {item.days.map((d, idx) => (
                                    <div
                                        key={idx}
                                        className="
                    px-2 py-[2px]
                    rounded-lg
                    bg-[#F7E5CF]
                    text-[#6D4B2F]
                    border border-[#ECCFB3]
                  "
                                    >
                                        {d}
                                    </div>
                                ))}
                            </div>

                            {/* 시간 + 아이콘들 */}
                            <div className="flex justify-between items-center">
                                <div className="text-sm font-semibold text-[#4A2F23]">
                                    {item.time}
                                </div>

                                <div className="flex gap-2 items-center text-[#8A6D55]">
                                    {item.sound && <Volume2 size={16} />}
                                    {item.vibrate && <Vibrate size={16} />}
                                </div>
                            </div>

                        </div>
                    ))}
                </div>
            </div>

            {/* Floating Button */}
            <Link
                href="/notifications/add"
                className="
        fixed bottom-6 right-6
        w-14 h-14 rounded-full
        bg-[#F1C9A5]
        border border-[#E0B693]/60
        shadow-[0_4px_12px_rgba(0,0,0,0.18)]
        flex items-center justify-center
        hover:bg-[#E3B68D]
        transition
        active:scale-90
      "
            >
                <Plus size={26} className="text-[#4A2F23]" />
            </Link>
        </div>
    );
}
