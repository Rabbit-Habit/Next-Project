"use client";

import {useEffect, useLayoutEffect, useRef, useState} from "react";
import {deleteMessageAction, sendMessageAction} from "@/app/chat/[channelId]/actions";
import {useRouter} from "next/navigation";
import {IoArrowBackOutline} from "react-icons/io5";
import {useSession} from "next-auth/react";

export default function ChatClientComponent({
    channelId,
    initialMessages,
    participants,
    chatReads,
    habitTitle
}: {
    channelId: string;
    initialMessages: any[];
    participants: any[];
    chatReads: any[];
    habitTitle: string | null | undefined;
}) {

    const router = useRouter();

    // 메시지 목록 상태
    const [messages, setMessages] = useState(initialMessages);

    // 로그인 uid 가져오기
    const { data: session, status } = useSession();
    const uid = session?.user?.uid ? Number(session.user.uid) : undefined;

    if (status === "loading") return <div>로딩 중...</div>;
    if (!uid) return <div>로그인이 필요합니다.</div>;

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

    // 아래로 자동 스크롤
    const bottomRef = useRef<HTMLDivElement | null>(null);
    const chatBoxRef = useRef<HTMLDivElement | null>(null);

    // 채팅방 처음 렌더될 때 → 스크롤 조작 없이 맨 아래 상태로 시작
    useLayoutEffect(() => {
        const el = chatBoxRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, []);

    useEffect(() => {
        // messages가 바뀔 때마다 맨 아래로 스크롤
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white shadow-sm">
                {/* 왼쪽: 뒤로가기 + 타이틀 */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push("/chat")}
                        className="p-2 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition"
                    >
                        <IoArrowBackOutline size={22} />
                    </button>

                    <h1 className="text-lg font-semibold truncate max-w-[220px] sm:max-w-[300px]">
                        {habitTitle ?? "이름 없는 습관"}
                    </h1>
                </div>

                {/* 오른쪽: 참여자 수 */}
                <span className="text-sm text-gray-500 whitespace-nowrap">
                    참여자 {participants?.length ?? 1}명
                </span>
            </div>

            {/* 메시지 표시 영역 */}
            <div
                ref={chatBoxRef}
                className="flex-1 overflow-y-auto p-4 flex flex-col gap-4"
                style={{ scrollBehavior: "auto" }}
            >
                {messages.map((m, idx) => {
                    const isMine = m.userId === uid;
                    const time = new Date(m.regDate).toLocaleTimeString("ko-KR", {
                        hour: "2-digit",
                        minute: "2-digit",
                    });

                    // 내가 보낸 메시지일 때, 안 읽은 사람 수 계산
                    let unreadCount = 0;
                    if (isMine && chatReads) {
                        unreadCount = participants.filter((p: any) => {
                            const read = chatReads.find((r: any) => r.userId === p.userId);
                            return !read || new Date(read.lastReadAt) < new Date(m.regDate);
                        }).length;
                    }

                    // 날짜 구분
                    const msgDate = new Date(m.regDate).toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                    });
                    let showDateDivider = idx === 0;
                    if (idx > 0) {
                        const prevDate = new Date(
                            messages[idx - 1].regDate
                        ).toLocaleDateString("ko-KR", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                        });
                        if (msgDate !== prevDate) showDateDivider = true;
                    }

                    let dateLabel = msgDate;
                    const today = new Date().toLocaleDateString("ko-KR");
                    const yesterday = new Date(
                        Date.now() - 24 * 60 * 60 * 1000
                    ).toLocaleDateString("ko-KR");
                    if (msgDate === today) dateLabel = "오늘";
                    else if (msgDate === yesterday) dateLabel = "어제";

                    return (
                        <div key={m.messageId} className="flex flex-col gap-2">
                            {showDateDivider && (
                                <div className="flex items-center my-2">
                                    <hr className="flex-1 border-gray-300" />
                                    <span className="px-2 text-xs text-gray-500">{dateLabel}</span>
                                    <hr className="flex-1 border-gray-300" />
                                </div>
                            )}

                            <div
                                className={`flex items-end gap-2 ${
                                    isMine ? "justify-end" : "justify-start"
                                }`}
                            >
                                {!isMine && (
                                    <img
                                        src={m.user?.imageUrl ?? "/icons/basic_profile.jpg"}
                                        alt="프로필"
                                        className="w-8 h-8 rounded-full border"
                                    />
                                )}

                                <div className="flex flex-col max-w-xs">
                                    {!isMine && (
                                        <span className="font-bold text-xs mb-1">
                                            {m.user?.nickname || m.userId}
                                        </span>
                                    )}
                                    <div
                                        className={`relative p-2 rounded-xl shadow-md text-sm ${
                                            isMine
                                                ? "bg-blue-500 text-white self-end rounded-br-none"
                                                : "bg-gray-200 text-black self-start rounded-bl-none"
                                        }`}
                                    >
                                        {m.content}
                                        {isMine && (() => {
                                            const now = new Date();
                                            const sent = new Date(m.regDate);
                                            const diffMinutes = (now.getTime() - sent.getTime()) / (1000 * 60);

                                            // 보낸 지 1시간 이내일 때만 버튼 표시
                                            if (diffMinutes <= 60) {
                                                return (
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
                                                        className="absolute -top-2 -right-2 bg-white border text-red-500 text-xs px-1 rounded shadow hover:bg-red-50"
                                                    >
                                                        ✕
                                                    </button>
                                                );
                                            }
                                            return null; // 1시간 지났으면 버튼 안 보이게
                                        })()}
                                    </div>
                                    <span
                                        className={`text-xs text-gray-500 mt-1 ${
                                            isMine ? "text-right" : "text-left"
                                        }`}
                                    >
                                        {time}
                                    </span>
                                </div>

                                {isMine && (
                                    <img
                                        src={m.user?.imageUrl ?? "/icons/basic_profile.jpg"}
                                        alt="프로필"
                                        className="w-8 h-8 rounded-full border"
                                    />
                                )}
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            {/* 메시지 입력창 */}
            <form
                onSubmit={handleSubmit}
                className="flex items-center gap-2 p-3 border-t bg-white sticky bottom-0"
            >
                <input
                    ref={inputRef}
                    type="text"
                    className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder={"메시지를 입력하세요"}
                    disabled={uid === -1}
                />
                <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full disabled:opacity-50"
                    disabled={uid === -1}
                >
                    전송
                </button>
            </form>
        </div>
    );

}
