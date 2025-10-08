"use client";

import Link from "next/link";
import {useMemo} from "react";
import Header from "@/app/components/common/header";
import {useSession} from "next-auth/react";

export default function ChatListComponent({ habits }: { habits: any }) {

    const { data: session } = useSession();
    const uid = session?.user?.uid ? Number(session.user.uid) : undefined;

    // 최신 메시지 기준 정렬
    const sorted = useMemo(() => {
        return [...habits].sort((a, b) => {
            const aTime = new Date(a.chatChannel?.[0]?.messages?.[0]?.regDate || 0).getTime();
            const bTime = new Date(b.chatChannel?.[0]?.messages?.[0]?.regDate || 0).getTime();
            return bTime - aTime;
        });
    }, [habits]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* 상단 헤더 */}
            <Header title="내 채팅방"/>

            {/* 채팅방 목록 */}
            <div className="flex-1 p-4 flex flex-col gap-3 overflow-y-auto">
                {sorted.length === 0 ? (
                    <p className="text-gray-500">참여 중인 채팅방이 없습니다.</p>
                ) : (
                    sorted.map((habit) => {
                        const channel = habit.chatChannel?.[0];
                        const lastMsg = channel?.messages?.[0];
                        const lastTime = lastMsg
                            ? new Date(lastMsg.regDate).toLocaleTimeString("ko-KR", {
                                hour: "2-digit",
                                minute: "2-digit",
                            })
                            : "";

                        // 읽지 않은 채팅방 판별
                        const unread =
                            lastMsg &&
                            lastMsg.userId !== Number(uid) &&
                            channel?.chatRead?.every(
                                (r: any) =>
                                    r.userId !== Number(uid) ||
                                    new Date(r.lastReadAt) < new Date(lastMsg.regDate)
                            );

                        return (
                            <Link
                                key={habit.habitId.toString()}
                                href={`/chat/${channel?.channelId}`}
                                className={`relative flex items-center rounded-xl shadow p-4 transition ${
                                    unread
                                        ? "bg-blue-50 border border-blue-200"
                                        : "bg-white hover:bg-blue-50"
                                }`}
                            >
                                {/* 왼쪽: 아이콘 + 제목 + 마지막 메시지 */}
                                <div className="flex items-center gap-3 overflow-hidden pr-20">
                                    <span className="text-2xl">💬</span>

                                    <div className="flex flex-col overflow-hidden">
                                        <span
                                            className={`font-semibold truncate max-w-[220px] sm:max-w-[300px] ${
                                                unread ? "text-gray-900" : "text-gray-600"
                                            }`}
                                        >
                                          {habit.title || "이름 없는 습관"}
                                        </span>
                                        <span
                                            className={`text-xs truncate max-w-[220px] sm:max-w-[300px] ${
                                                unread ? "text-gray-800" : "text-gray-400"
                                            }`}
                                        >
                                            {lastMsg
                                                ? `${lastMsg.user?.nickname || "익명"}: ${
                                                    lastMsg.content
                                                }`
                                                : "아직 대화가 없습니다"}
                                        </span>
                                    </div>
                                </div>

                                {/* 오른쪽 상단: NEW + 시간 */}
                                <div className="absolute top-3 right-4 flex items-center gap-2">
                                    {unread && (
                                        <span
                                            className="text-[10px] text-blue-600 font-semibold bg-blue-100 px-2 py-0.5 rounded-full">
                                            NEW
                                        </span>
                                    )}
                                    {lastTime && (
                                        <span
                                            className={`text-[11px] whitespace-nowrap ${
                                                unread
                                                    ? "text-blue-600 font-medium"
                                                    : "text-gray-400"
                                            }`}
                                        >
                                            {lastTime}
                                        </span>
                                    )}
                                </div>
                            </Link>
                        );
                    })
                )}
            </div>
        </div>
    );
}