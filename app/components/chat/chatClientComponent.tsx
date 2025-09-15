"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {sendMessageAction} from "@/app/chat/[channelId]/actions";

export default function ChatClientComponent({
                                     channelId,
                                     initialMessages,
                                 }: {
    channelId: string;
    initialMessages: any[];
}) {
    // 메시지 목록 상태
    const [messages, setMessages] = useState(initialMessages);

    // form 제출 시 sendMessage 실행
    const [state, formAction] = useActionState(sendMessageAction, { ok: false });

    // 입력창 ref → 전송 후 입력값 비우기용
    const inputRef = useRef<HTMLInputElement>(null);

    // 새 메시지가 전송된 경우 state 업데이트 감지
    useEffect(() => {
        if (state.ok && state.message) {
            setMessages((prev) => [...prev, state.message]); // 새 메시지 추가
            if (inputRef.current) inputRef.current.value = ""; // 입력창 초기화
        }
    }, [state]);

    return (
        <div>
            {/* 메시지 표시 영역 */}
            <div className="h-80 overflow-y-auto border mb-2 p-2">
                {messages.map((m) => (
                    <div key={m.message_id} className="p-1">
                        <span className="font-bold">{m.user?.name || m.user_id}</span>: {m.content}
                    </div>
                ))}
            </div>

            {/* 메시지 입력 폼 */}
            <form action={formAction} className="flex gap-2">
                {/* 채널/유저 정보 hidden input으로 전달 (임시) */}
                <input type="hidden" name="channelId" value={channelId} />
                <input type="hidden" name="userId" value="1" />  {/*바꿔줘야 함*/}

                {/* 메시지 입력창 */}
                <input
                    ref={inputRef}
                    type="text"
                    name="content"
                    className="flex-1 border p-2"
                    placeholder="메시지를 입력하세요..."
                />

                {/* 전송 버튼 */}
                <button type="submit" className="bg-blue-500 text-white px-4">
                    전송
                </button>
            </form>
        </div>
    );
}
