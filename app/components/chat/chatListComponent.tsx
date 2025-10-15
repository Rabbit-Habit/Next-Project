"use client";

import Link from "next/link";
import {useEffect, useMemo, useRef, useState} from "react";
import Header from "@/app/components/common/header";
import {useSession} from "next-auth/react";

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
                            const channel = habit.chatChannel?.[0];
                            if (!channel || channel.channelId !== data.channelId) return habit;

                            const updatedRead = channel.chatRead.map((r: any) =>
                                r.userId === data.userId
                                    ? { ...r, lastReadAt: data.lastReadAt }
                                    : r
                            );

                            return {
                                ...habit,
                                chatChannel: [
                                    {
                                        ...channel,
                                        chatRead: updatedRead,
                                    },
                                ],
                            };
                        })
                    );
                    return;
                }

                // 새 메시지 수신
                if (data.channelId && !data.type) {
                    setHabitList((prev) =>
                        prev.map((habit: any) => {
                            const channel = habit.chatChannel?.[0];
                            if (!channel || channel.channelId !== data.channelId) return habit;

                            return {
                                ...habit,
                                chatChannel: [
                                    {
                                        ...channel,
                                        messages: [data], // 최신 메시지 덮어쓰기
                                    },
                                ],
                            };
                        })
                    );
                }

                // ✅ 메시지 삭제 이벤트
                if (data.type === "delete") {
                    setHabitList((prev) =>
                        prev.map((habit: any) => {
                            const channel = habit.chatChannel?.[0];
                            if (!channel || channel.channelId !== data.channelId) return habit;

                            const updatedMsgs = channel.messages.filter(
                                (m: any) => m.messageId !== data.messageId
                            );

                            return {
                                ...habit,
                                chatChannel: [
                                    {
                                        ...channel,
                                        messages: updatedMsgs,
                                    },
                                ],
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
            const aTime = new Date(a.chatChannel?.[0]?.messages?.[0]?.regDate || 0).getTime();
            const bTime = new Date(b.chatChannel?.[0]?.messages?.[0]?.regDate || 0).getTime();
            return bTime - aTime;
        });
    }, [habitList]);

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
                                <div className="flex items-start gap-3 overflow-hidden pr-20">
                                    <span className="text-2xl mt-1">💬</span>
                                    <div className="flex flex-col overflow-hidden">
                                        <div className="flex items-center gap-1 flex-wrap">
                                              <span
                                                  className={`font-semibold truncate max-w-[200px] sm:max-w-[280px] ${
                                                      unread ? "text-gray-900" : "text-gray-700"
                                                  }`}
                                              >
                                                {habit.title || "이름 없는 습관"}
                                              </span>

                                            {/* 팀 이름 + 인원수 */}
                                            {habit.team && (
                                                <span className="text-[12px] text-gray-400 truncate flex items-center gap-1">
                                                  | {habit.team.name}

                                                      <span className="text-gray-400">
                                                        ({habit.team.members?.length ?? 0}명)
                                                      </span>
                                                </span>
                                            )}
                                        </div>

                                        {/* 마지막 메시지 */}
                                        <span
                                            className={`text-xs truncate max-w-[220px] sm:max-w-[300px] ${
                                                unread ? "text-gray-800" : "text-gray-400"
                                            }`}
                                        >
                                          {lastMsg
                                              ? `${lastMsg.user?.nickname || "익명"}: ${lastMsg.content}`
                                              : "아직 대화가 없습니다"}
                                        </span>
                                    </div>
                                </div>


                                {/* 오른쪽 상단: NEW + 시간 */}
                                <div className="absolute top-3 right-4 flex flex-col items-end gap-2">
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
                                    {unread && (
                                        <span
                                            className="text-[10px] text-blue-600 font-semibold bg-blue-100 px-2 py-0.5 rounded-full">
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