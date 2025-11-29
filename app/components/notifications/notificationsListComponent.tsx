"use client";

import {useEffect, useState} from "react";
import Link from "next/link";
import Header from "@/app/components/common/header";
import { Bell, Plus, Trash2 } from "lucide-react";
import {
    toggleNotificationAction,
    deleteNotificationAction,
} from "@/app/notifications/actions";
import ConfirmModal from "@/app/components/modal/confirmModal";

type NotificationListItem = {
    notificationId: string;
    habitId: string;
    userId: number;
    sendTime: string;
    daysOfWeek: string[];
    memo: string | null;
    isActive: boolean;
    habit: {
        title: string | null;
    };
};

export default function NotificationsListComponent({ notifications,}: { notifications: NotificationListItem[]; }) {
    const [list, setList] = useState<NotificationListItem[]>(notifications);

    // 삭제 모달 상태
    const [openDelete, setOpenDelete] = useState(false);
    const [targetId, setTargetId] = useState<string | null>(null);

    const korDays = { MON: "월", TUE: "화", WED: "수", THU: "목", FRI: "금", SAT: "토", SUN: "일",} as const;

    // 활성화 토글
    async function onToggle(id: string, current: boolean) {
        const res = await toggleNotificationAction(id, !current);
        if (!res.ok) return;

        setList((prev) =>
            prev.map((n) =>
                n.notificationId === id ? { ...n, isActive: !current } : n
            )
        );
    }

    function requestDelete(id: string) {
        setTargetId(id);
        setOpenDelete(true);
    }

    // 알람 삭제
    async function handleDelete() {
        if (!targetId) return;
        const res = await deleteNotificationAction(targetId);

        if (res.ok) {
            setList((prev) => prev.filter((n) => n.notificationId !== targetId));
        }

        setOpenDelete(false);
        setTargetId(null);
    }


    return (
        <div
            className="
              min-h-screen
              bg-gradient-to-b from-[#FFF5E8] via-[#FAEAD0] to-[#F7DDBE]
              flex flex-col
            "
        >
            <Header title="알람" />

            <div className="flex-1 px-5 py-6 space-y-6 max-w-md mx-auto w-full">

                {/* 헤더 */}
                <div className="space-y-1">
                    <h2 className="text-base font-semibold text-[#4A2F23] flex items-center gap-2">
                        <Bell size={18} className="text-[#C58752]" />
                        내 알람 목록
                    </h2>
                    <p className="text-xs text-[#8A6D55]">
                        매일 정해진 시간에 습관을 잊지 않게 도와드릴게요.
                    </p>
                </div>

                {/* 리스트 */}
                <div className="space-y-5">
                    {list.map((item) => (
                        <div
                            key={item.notificationId}
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
                            {/* 상단 전체 영역 */}
                            <div className="flex justify-between items-center">

                                {/* 왼쪽: 아이콘 + 제목 */}
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-[#F1C9A5]/40 flex items-center justify-center">
                                        <Bell size={15} className="text-[#C17C4F]" />
                                    </div>

                                    <span className="text-sm font-semibold text-[#4A2F23] truncate max-w-[170px] lg:max-w-[240px]">
                                      {item.habit.title || "제목 없음"}
                                    </span>
                                </div>

                                {/* 오른쪽: 시간 + 토글 + 삭제 */}
                                <div className="flex items-center gap-3">

                                    {/* 시간 */}
                                    <div className="text-base font-bold text-[#4A2F23] tracking-tight">
                                        {item.sendTime}
                                    </div>

                                    {/* 토글 */}
                                    <div
                                        onClick={() => onToggle(item.notificationId, item.isActive)}
                                        className={`
                                            w-10 h-5 rounded-full flex items-center px-1 cursor-pointer
                                            transition-all duration-200 ease-out
                                            ${
                                                item.isActive
                                                    ? "bg-emerald-200/70 justify-end"
                                                    : "bg-red-300/20 justify-start"
                                            }
                                        `}
                                    >
                                        <div className="w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200 ease-out" />
                                    </div>

                                </div>
                            </div>

                            {/* 메모*/}
                            {item.memo && (
                                <div className="ml-1 text-[11px] text-[#9B7A63] opacity-80">
                                    "{item.memo}"
                                </div>
                            )}

                            <div className="flex justify-between items-center mt-1">

                                {/* 요일 */}
                                <div className="flex gap-2 flex-wrap text-[11px]">
                                    {item.daysOfWeek.map((d) => (
                                        <div
                                            key={d}
                                            className="
                                              px-2 py-[2px]
                                              rounded-lg
                                              bg-[#F7E5CF]
                                              text-[#6D4B2F]
                                              border border-[#ECCFB3]
                                            "
                                        >
                                            {korDays[d as keyof typeof korDays]}
                                        </div>
                                    ))}
                                </div>

                                {/* 삭제 버튼 */}
                                <button
                                    onClick={() => requestDelete(item.notificationId)}
                                    className="
                                      text-[#B38A68] hover:text-[#8A6A4D]
                                      transition
                                      p-1
                                      rounded-lg
                                      border border-[#E4D2C0]
                                      shadow-sm
                                      active:scale-90
                                    "
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 추가 버튼 */}
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
                  transition active:scale-90
                "
            >
                <Plus size={26} className="text-[#4A2F23]" />
            </Link>

            {/* 삭제 모달 */}
            <ConfirmModal
                open={openDelete}
                onOpenChange={() => setOpenDelete(false)}
                onConfirm={handleDelete}
                title="삭제하시겠어요?"
                description={
                    <>
                        정말 삭제할까요?
                    </>
                }
            />
        </div>
    );
}
