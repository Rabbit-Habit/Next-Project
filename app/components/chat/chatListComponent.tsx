"use client";

import Link from "next/link";
import {useEffect, useRef, useState} from "react";
import {useSession} from "next-auth/react";
import Header from "@/app/components/common/header";
import { MessageCircleMore } from "lucide-react";
import {loadMoreHabitsAction} from "@/app/chat/actions";

interface ChatListProps {
    initialChannels: any;
    initialCursor: any;
}

export default function ChatListComponent({
                                              initialChannels,
                                              initialCursor
                                          }: ChatListProps) {

    const { data: session } = useSession();
    const uid = session?.user?.uid ? Number(session.user.uid) : undefined;

    const [channels, setChannels] = useState<any[]>(initialChannels);
    const [cursor, setCursor] = useState(initialCursor);
    const [loading, setLoading] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);

    // 중복 방지 함수
    function mergeUnique(prev: any[], next: any[]) {
        const map = new Map();
        [...prev, ...next].forEach((c) => {
            map.set(c.channelId, c);
        });
        return Array.from(map.values());
    }

    // 정렬 함수 (메시지 없으면 channelId 정렬)
    function sortChannels(list: any[]) {
        return [...list].sort((a, b) => {
            const aHas = !!a.lastMessageAt;
            const bHas = !!b.lastMessageAt;

            // 둘 다 메시지 있음 → lastMessageAt DESC
            if (aHas && bHas) {
                return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
            }

            // 둘 다 메시지 없음 → channelId ASC
            if (!aHas && !bHas) {
                return a.channelId - b.channelId;
            }

            // 메시지 있는 쪽을 위
            return aHas ? -1 : 1;
        });
    }

    // 무한스크롤
    useEffect(() => {
        const onScroll = async () => {
            if (loading || !cursor) return;

            const bottom =
                window.innerHeight + window.scrollY >=
                document.body.offsetHeight - 200;

            if (bottom) {
                setLoading(true);

                const { items, nextCursor } = await loadMoreHabitsAction(cursor);

                // 새로 가져온 목록도 정렬해서 합치기
                setChannels((prev) =>
                    sortChannels(mergeUnique(prev, items))
                );

                setCursor(nextCursor);
                setLoading(false);
            }
        };

        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, [cursor, loading]);


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
                    setChannels((prev) =>
                        prev.map((channel: any) => {
                            if (channel.channelId !== data.channelId) return channel;

                            const updatedRead = channel.chatRead.map((r: any) =>
                                r.userId === data.userId
                                    ? { ...r, lastReadAt: data.lastReadAt }
                                    : r
                            );

                            return {
                                ...channel,
                                chatRead: updatedRead,
                            };
                        })
                    );
                    return;
                }

                // 새 메시지 수신
                if (data.channelId && !data.type) {
                    setChannels((prev) => {
                        const updated = prev.map((channel: any) => {
                            if (channel.channelId !== data.channelId) return channel;

                            return {
                                ...channel,
                                messages: [data], // 최신 메시지 덮어쓰기
                                lastMessageAt: data.regDate   // 정렬 기준 업데이트
                            };
                        });
                        return sortChannels(updated);   // 실시간 정렬
                    });
                    return;
                }

                // ✅ 메시지 삭제 이벤트
                if (data.type === "delete") {
                    setChannels((prev) =>{
                        const updated = prev.map((channel: any) => {
                            if (channel.channelId !== data.channelId) return channel;

                            const updatedMsgs = channel.messages.filter(
                                (m: any) => m.messageId !== data.messageId
                            );

                            return {
                                ...channel,
                                messages: updatedMsgs,
                            };
                        });
                        return sortChannels(updated);  // 삭제 후도 정렬 유지
                });
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

    // 서버 정렬 + 클라이언트 보정 정렬
    const sorted = sortChannels(channels);


    return (
        <div className="min-h-screen bg-gradient-to-b from-[#FFF5E6] via-[#FAE8CA] to-[#F5D7B0] flex flex-col">
            <Header title="내 채팅방" />

            {/* 채팅방 목록 */}
            <div className="flex-1 p-4 flex flex-col gap-3 overflow-y-auto">
                {sorted.length === 0 ? (
                    <p className="text-[#9B7A63] text-center">참여 중인 채팅방이 없습니다.</p>
                ) : (
                    sorted.map((channel) => {
                        const habit = channel.habit;
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
                                className={`
                                relative flex items-center rounded-3xl px-4 py-5
                                min-h-[80px] 
                                border shadow-sm transition
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

                                    <div className="flex flex-col overflow-hidden justify-start items-start">

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

                                        <div className="flex items-center gap-1 text-xs mt-2">
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
                {/* 로딩 표시 */}
                {loading && (
                    <div className="flex justify-center items-center py-2 sticky top-0 z-10 bg-gradient-to-b from-gray-50/95 to-transparent">
                        <div className="animate-spin h-5 w-5 border-2 border-yellow-500 border-t-transparent rounded-full"></div>
                    </div>
                )}
            </div>
        </div>
    );
}