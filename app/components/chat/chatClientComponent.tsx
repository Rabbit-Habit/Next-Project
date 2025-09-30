"use client";

import { useEffect, useRef, useState } from "react";
import { useLoginStore } from "@/app/store/useLoginStore";
import {deleteMessageAction, sendMessageAction} from "@/app/chat/[channelId]/actions";

export default function ChatClientComponent({
                                                channelId,
                                                initialMessages,
                                            }: {
    channelId: string;
    initialMessages: any[];
}) {
    // 메시지 목록 상태
    const [messages, setMessages] = useState(initialMessages);

    // 로그인 uid 가져오기
    const uid = useLoginStore((state) => state.uid);

    // 입력창 ref (메시지 전송 후 입력값 비우기용)
    const inputRef = useRef<HTMLInputElement>(null);

    // WebSocket 객체 저장용 ref
    const wsRef = useRef<WebSocket | null>(null);

    // 1. WebSocket 연결 관리
    useEffect(() => {
        // 이미 연결돼 있다면 새로 만들지 않음 (중복 연결 방지)
        if (wsRef.current) return;

        // 서버의 "/ws" 엔드포인트와 연결
        const ws = new WebSocket("ws://localhost:3000/ws"); // 배포 시 wss:// 로 교체
        wsRef.current = ws;

        ws.onopen = () => {
            console.log("✅ WebSocket 연결됨");
        };

        // 서버에서 broadcast된 메시지 수신
        ws.onmessage = (event) => {
            try {
                const newMessage = JSON.parse(event.data);

                // 메시지 추가 이벤트
                if (newMessage.channelId === Number(channelId)) {
                    setMessages((prev) =>
                        prev.some((m) => m.messageId === newMessage.messageId)
                            ? prev
                            : [...prev, newMessage]
                    );
                }

                // 메시지 삭제 이벤트
                if (newMessage.type === "delete") {
                    setMessages((prev) =>
                        prev.filter((m) => m.messageId !== newMessage.messageId)
                    );
                    return;
                }

            } catch (err) {
                console.error("❌ WebSocket message parse error", err);
            }
        };

        ws.onclose = (e) => {
            console.log("🔌 WebSocket 닫힘:", e.code, e.reason);
        };

        // cleanup: 컴포넌트 언마운트/리렌더 시 소켓 정상 종료
        return () => {
            if (
                wsRef.current &&
                (wsRef.current.readyState === WebSocket.OPEN ||
                    wsRef.current.readyState === WebSocket.CONNECTING)
            ) {
                wsRef.current.close(1000, "Normal Closure"); // 정상 종료
            }
            wsRef.current = null; // 참조 초기화
        };
    }, [channelId]);


    // 2. 메시지 전송 핸들러
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const content = inputRef.current?.value?.trim();
        if (!content || uid === -1) return;

        const formData = new FormData();
        formData.append("channelId", channelId);
        formData.append("userId", uid.toString());
        formData.append("content", content);

        // 1) 서버 액션으로 DB 저장
        const res = await sendMessageAction(formData);

        if (res.ok && res.message) {
            // 내가 보낸 메시지는 바로 반영
            setMessages((prev) => [...prev, res.message]);
            if (inputRef.current) inputRef.current.value = "";
        }

        // 2) WebSocket으로 서버에 알리기 → 다른 클라에 브로드캐스트
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(
                JSON.stringify({
                    channelId: Number(channelId),
                    userId: uid,
                    content,
                })
            );
        }
    };

    return (
        <div>
            {/* 메시지 표시 영역 */}
            <div className="h-80 overflow-y-auto border mb-2 p-2 flex flex-col gap-2">
                {messages.map((m) => {
                    const isMine = m.userId === uid;
                    return (
                        <div
                            key={m.messageId}
                            className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`relative max-w-xs p-2 rounded-xl text-sm ${
                                    isMine
                                        ? "bg-blue-500 text-white rounded-br-none"
                                        : "bg-gray-200 text-black rounded-bl-none"
                                }`}
                            >
                                {/* 상대 메시지만 닉네임 표시 */}
                                {!isMine && (
                                    <div className="font-bold text-xs mb-1">
                                        {m.user?.nickname || m.userId}
                                    </div>
                                )}

                                <div>{m.content}</div>

                                {/* 내가 보낸 메시지일 경우 삭제 버튼 */}
                                {isMine && (
                                    <button
                                        onClick={async () => {
                                            const res = await deleteMessageAction(m.messageId, uid);
                                            if (res.ok) {
                                                setMessages((prev) =>
                                                    prev.filter((msg) => msg.messageId !== m.messageId)
                                                );

                                                if (wsRef.current?.readyState === WebSocket.OPEN) {
                                                    wsRef.current.send(
                                                        JSON.stringify({
                                                            type: "delete",
                                                            channelId: Number(channelId),
                                                            messageId: m.messageId,
                                                        })
                                                    );
                                                }
                                            }
                                        }}
                                        className="absolute -top-2 -right-2 bg-white border text-red-500 text-xs px-1 rounded"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>


            {/* 메시지 입력 폼 */}
            <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                    ref={inputRef}
                    type="text"
                    className="flex-1 border p-2"
                    placeholder={
                        uid === -1
                            ? "로그인 후 채팅을 입력할 수 있습니다"
                            : "메시지를 입력하세요..."
                    }
                    disabled={uid === -1}
                />
                <button
                    type="submit"
                    className="bg-blue-500 text-white px-4"
                    disabled={uid === -1}
                >
                    전송
                </button>
            </form>
        </div>
    );
}
