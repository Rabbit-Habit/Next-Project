"use client";

import Link from "next/link";
import {useEffect, useMemo, useRef, useState} from "react";
import {useSession} from "next-auth/react";
import Header from "@/app/components/common/header";
import {
    Bubbles,
    Inbox,
    Mail, MailCheck,
    MessageCircle,
    MessageCircleMore,
    MessageSquare,
    MessageSquareText,
    MessagesSquare, NotebookText,
    Send, Speech, Stamp
} from "lucide-react";

export default function ChatListComponent({ habits }: { habits: any }) {

    const { data: session } = useSession();
    const uid = session?.user?.uid ? Number(session.user.uid) : undefined;

    // habits를 로컬 상태로 관리 (실시간 갱신용)
    const [habitList, setHabitList] = useState<any[]>(habits);
    const wsRef = useRef<WebSocket | null>(null);

    // WebSocket 연결 (한 번만)
    useEffect(() => {
        if (wsRef.current) return;
        const ws = new WebSocket("ws://localhost:3000/ws");
        wsRef.current = ws;

        ws.onopen = () => console.log("✅ ChatList WS 연결됨");

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                // ✅ 읽음 상태 업데이트 수신
                if (data.type === "read_update") {
                    setHabitList((prev) =>
                        prev.map((habit: any) => {
                            const channel = habit.chatChannel;
                            if (!channel || channel.channelId !== data.channelId) return habit;

                            const updatedRead = channel.chatRead.map((r: any) =>
                                r.userId === data.userId
                                    ? { ...r, lastReadAt: data.lastReadAt }
                                    : r
                            );

                            return {
                                ...habit,
                                chatChannel: {
                                    ...channel,
                                    chatRead: updatedRead,
                                },
                            };
                        })
                    );
                    return;
                }

                // 새 메시지 수신
                if (data.channelId && !data.type) {
                    setHabitList((prev) =>
                        prev.map((habit: any) => {
                            const channel = habit.chatChannel;
                            if (!channel || channel.channelId !== data.channelId) return habit;

                            return {
                                ...habit,
                                chatChannel: {
                                    ...channel,
                                    messages: [data], // 최신 메시지 덮어쓰기
                                },
                            };
                        })
                    );
                }

                // ✅ 메시지 삭제 이벤트
                if (data.type === "delete") {
                    setHabitList((prev) =>
                        prev.map((habit: any) => {
                            const channel = habit.chatChannel;
                            if (!channel || channel.channelId !== data.channelId) return habit;

                            const updatedMsgs = channel.messages.filter(
                                (m: any) => m.messageId !== data.messageId
                            );

                            return {
                                ...habit,
                                chatChannel: {
                                    ...channel,
                                    chatRead: updatedMsgs,
                                },
                            };
                        })
                    );
                    return;
                }
            } catch (err) {
                console.error("❌ ChatList WS parse error", err);
            }
        };

        return () => {
            ws.close();
            wsRef.current = null;
        };
    }, []);

    // 최신 메시지 기준 정렬
    const sorted = useMemo(() => {
        return [...habitList].sort((a, b) => {
            const aTime = new Date(a.chatChannel?.messages?.[0]?.regDate || 0).getTime();
            const bTime = new Date(b.chatChannel?.messages?.[0]?.regDate || 0).getTime();
            return bTime - aTime;
        });
    }, [habitList]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#FFF5E6] via-[#FAE8CA] to-[#F5D7B0] flex flex-col">
            <Header title="내 채팅방" />

            <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto">
                {sorted.length === 0 ? (
                    <p className="text-[#9B7A63] text-center">참여 중인 채팅방이 없습니다.</p>
                ) : (
                    sorted.map((habit) => {
                        const channel = habit.chatChannel;
                        const lastMsg = channel?.messages?.[0];
                        const lastTime = lastMsg
                            ? new Date(lastMsg.regDate).toLocaleTimeString("ko-KR", {
                                hour: "2-digit",
                                minute: "2-digit",
                            })
                            : "";

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
                                className={`relative flex items-center rounded-3xl px-4 py-4 border shadow-sm transition
                                ${
                                    unread
                                        ? "bg-[#FFE5E5]/30 border-[#FFC8C8] shadow-[0_0_8px_rgba(255,200,200,0.35)]"
                                        : "bg-white/80 hover:bg-[#FFF5EB] border-[#F0D4B2]"
                                }`}

                            >
                                {/* LEFT: 아이콘 + 제목 + 메시지 */}
                                <div className="flex items-start gap-3 overflow-hidden pr-20">
                                    <div className="
                                        flex-shrink-0
                                        w-10 h-10
                                        rounded-full
                                        bg-[#FBEAD4]
                                        border border-[#E7C8A9]
                                        flex items-center justify-center
                                    ">
                                        <MessageCircleMore className="w-5 h-5 text-[#B05C31]" />

                                    </div>

                                    <div className="flex flex-col overflow-hidden">
                                        <div className="flex items-center flex-wrap gap-x-2 gap-y-[2px]">
                                            <span
                                                className={`font-semibold truncate max-w-[230px] sm:max-w-[260px] ${
                                                    unread ? "text-[#4A2F23]" : "text-[#6D4B36]"
                                                }`}
                                            >
                                                {habit.title || "이름 없는 습관"}
                                            </span>

                                            {habit.team && (
                                                <span className="text-[11px] truncate flex items-center gap-1">

        {/* 구분용 점 */}

                                                    {/* 태그는 무조건 */}
                                                    <span className="flex items-center gap-1 px-1.5 py-[1px] rounded-md bg-[#F3E5D6] text-[#795A3A]">

            {/* 사람 아이콘 — 항상 표시 */}
                                                        <svg
                                                            className="w-3 h-3"
                                                            fill="none"
                                                            stroke="#795A3A"
                                                            strokeWidth="2"
                                                            viewBox="0 0 24 24"
                                                        >
                <path d="M17 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M7 21v-2a4 4 0 0 1 3-3.87" />
                <circle cx="12" cy="7" r="4" />
            </svg>

                                                        {/* 팀명은 2명 이상일 때만 */}
                                                        {habit.team.members?.length > 1 && (
                                                            <span>
                    {habit.team.name}
                </span>
                                                        )}

                                                        {/* 명수는 항상 */}
                                                        <span className="text-[#A88672]">
                ({habit.team.members?.length ?? 0}명)
            </span>

        </span>

    </span>
                                            )}




                                        </div>

                                        <div className="flex items-center gap-1 text-xs">
                                            <span
                                                className={`truncate max-w-[220px] sm:max-w-[300px] ${
                                                    unread ? "text-[#4A2F23]" : "text-[#9B7A63]"
                                                }`}
                                            >
                                                {lastMsg
                                                    ? `${lastMsg.user?.nickname}: ${lastMsg.content}`
                                                    : "아직 대화가 없습니다"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT: 시간 + NEW */}
                                <div className="absolute top-3 right-4 flex flex-col items-end gap-1">
                                    {lastTime && (
                                        <span
                                            className={`text-[11px] whitespace-nowrap ${
                                                unread ? "text-[#6D4B36]" : "text-[#9B7A63]"
                                            }`}
                                        >
                                            {lastTime}
                                        </span>
                                    )}

                                    {/* NEW 뱃지 */}
                                    {unread && (
                                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full
                                            bg-[#FF8C8C] text-white shadow-md animate-pulse">
                                            NEW
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