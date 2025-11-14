"use client";

import {useEffect, useLayoutEffect, useRef, useState} from "react";
import {deleteMessageAction, loadOlderMessagesAction, sendMessageAction} from "@/app/chat/[channelId]/actions";
import {useRouter} from "next/navigation";
import {IoArrowBackOutline} from "react-icons/io5";
import {useSession} from "next-auth/react";
import {Send, SendHorizonal} from "lucide-react";

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
    

    // 로그인 uid 가져오기
    const { data: session } = useSession();
    const uid = session?.user?.uid ? Number(session.user.uid) : undefined;
    if (!uid) return <div>로그인이 필요합니다.</div>;

    // 상태 관리
    const [messages, setMessages] = useState(initialMessages); // 메시지 목록 상태
    const [chatReadsState, setChatReads] = useState(chatReads); // 읽음 상태
    const [cursor, setCursor] = useState<number | null>(null); // 이전 메시지 로드용 커서
    const [isLoadingMore, setIsLoadingMore] = useState(false); // 위쪽 로딩 스피너 표시
    const [isPrepending, setIsPrepending] = useState(false); // 메시지 prepend 중 여부

    // Ref 관리
    const inputRef = useRef<HTMLInputElement>(null); // 입력창 비우기용
    const chatBoxRef = useRef<HTMLDivElement | null>(null); // 채팅 컨테이너
    const bottomRef = useRef<HTMLDivElement | null>(null); // 맨 아래 스크롤용
    const isUserScrollingUpRef = useRef(false); // 자동 스크롤 제어 플래그
    const wsRef = useRef<WebSocket | null>(null); // WebSocket 인스턴스 저장

    // 1. WebSocket 연결 관리
    useEffect(() => {
        // 이미 연결돼 있다면 새로 만들지 않음 (중복 연결 방지)
        if (wsRef.current) return;

        // 서버의 "/ws" 엔드포인트와 연결
        const ws = new WebSocket("ws://localhost:3000/ws"); // 배포 시 wss:// 로 교체
        wsRef.current = ws;

        ws.onopen = () => {
            // 연결 직후 내 읽음 상태 전송
            ws.send(
                JSON.stringify({
                    type: "read_update",
                    channelId: Number(channelId),
                    userId: uid,
                })
            );
        };

        // 서버에서 broadcast된 메시지 수신
        ws.onmessage = (event) => {
            try {
                const newMessage = JSON.parse(event.data);

                // 읽음 상태 업데이트 이벤트
                if (newMessage.type === "read_update") {
                    setChatReads((prev) => {
                        const existing = prev.find((r) => r.userId === newMessage.userId);
                        if (existing) {
                            // 이미 존재 → lastReadAt 갱신
                            return prev.map((r) =>
                                r.userId === newMessage.userId
                                    ? { ...r, lastReadAt: newMessage.lastReadAt }
                                    : r
                            );
                        } else {
                            // 없으면 새로 추가
                            return [
                                ...prev,
                                { userId: newMessage.userId, lastReadAt: newMessage.lastReadAt },
                            ];
                        }
                    });


                    // 강제 리렌더 트리거 (읽음 카운트 갱신)
                    setMessages((prev) => [...prev]);
                    return;
                }

                if (newMessage.channelId !== Number(channelId)) return;
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

    // 읽음 상태 자동 업데이트
    useEffect(() => {
        if (!messages.length) return;
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(
                JSON.stringify({
                    type: "read_update",
                    channelId: Number(channelId),
                    userId: uid,
                })
            );
        }
    }, [messages.length]);

    // 초기 진입 시 맨 아래로 이동
    useLayoutEffect(() => {
        const el = chatBoxRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, []);

    // 새 메시지 수신 시 자동 스크롤
    useEffect(() => {
        // 위쪽 메시지 불러오는 중이면 스크롤 유지
        if (isPrepending) return;

        // 사용자가 위로 스크롤 중이면 자동 스크롤 안 함
        if (isUserScrollingUpRef.current) return;

        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // 초기 커서 설정 (가장 오래된 메시지 ID)
    useEffect(() => {
        if (initialMessages.length > 0) {
            setCursor(initialMessages[0].messageId);
        }
    }, [initialMessages]);

    // 이전 메시지 무한 스크롤 로드
    async function loadOlderMessages() {
        const box = chatBoxRef.current;
        if (!box || isLoadingMore || !cursor) return;
        if (box.scrollTop >= 100) return; // 맨 위 근처에서만 실행

        setIsLoadingMore(true);
        setIsPrepending(true);

        const prevScrollTop = box.scrollTop;
        const prevScrollHeight = box.scrollHeight;
        const res = await loadOlderMessagesAction(Number(channelId), cursor);

        if (res.messages.length > 0) {
            // messages 상태 업데이트 전 플래그 유지
            await new Promise((resolve) => requestAnimationFrame(resolve));

            setMessages((prev) => [...res.messages, ...prev]);
            setCursor(res.nextCursor);

            // 스크롤 위치 보정
            requestAnimationFrame(() => {
                const newScrollHeight = box.scrollHeight;
                const heightDiff = newScrollHeight - prevScrollHeight;
                box.scrollTop = prevScrollTop + heightDiff;
            });

            // 자동 스크롤 잠깐 막기 (messages useEffect 타이밍 차단)
            setTimeout(() => setIsPrepending(false), 50);
        } else {
            setIsPrepending(false);
        }

        setIsLoadingMore(false);
    }

    // 스크롤 이벤트 관리
    useEffect(() => {
        const box = chatBoxRef.current;
        if (!box) return;

        const handleScroll = () => {
            const isAtBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 10; // 거의 아래
            const isAtTop = box.scrollTop <= 50; // 거의 위

            // 아래쪽 여부 추적
            isUserScrollingUpRef.current = !isAtBottom;

            // 맨 위 근처면 과거 메시지 로드
            if (isAtTop && !isLoadingMore && cursor) {
                loadOlderMessages();
            }
        };

        box.addEventListener("scroll", handleScroll);
        return () => box.removeEventListener("scroll", handleScroll);
    }, [cursor, isLoadingMore]);


    return (
        <div className="flex flex-col h-screen bg-[#F3E5D6]/40">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white"
                 style={{ height: "56px" }}
            >
                {/* 왼쪽: 뒤로가기 + 타이틀 */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition"
                    >
                        <IoArrowBackOutline size={22} />
                    </button>

                    <h1 className="text-lg font-semibold truncate max-w-[220px] sm:max-w-[300px]">
                        {habitTitle ?? "이름 없는 습관"}
                    </h1>
                </div>

                <span
                    className="px-2 py-[2px] text-[11px] font-medium rounded-full
               bg-[#F3E5D6] text-[#7A523A] border border-[#E4C3A8] whitespace-nowrap flex items-center gap-1"
                >
                    {/* 사람 아이콘 */}
                                    <svg className="w-3 h-3" fill="none" stroke="#7A523A" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M17 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M7 21v-2a4 4 0 0 1 3-3.87" />
                        <circle cx="12" cy="7" r="4" />
                    </svg>

                    참여자 {participants?.length ?? 1}명
                </span>

            </div>

            {/* 메시지 표시 영역 */}
            <div
                ref={chatBoxRef}
                className="flex-1 overflow-y-auto p-4 flex flex-col gap-4"
                style={{ scrollBehavior: "auto" }}
            >
                {/* 위쪽 로딩 스피너 */}
                {isLoadingMore && (
                    <div className="flex justify-center items-center py-2 sticky top-0 z-10 bg-gradient-to-b from-gray-50/95 to-transparent">
                        <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    </div>
                )}

                {messages.map((m, idx) => {
                    const isMine = m.userId === uid;
                    const time = new Date(m.regDate).toLocaleTimeString("ko-KR", {
                        hour: "2-digit",
                        minute: "2-digit",
                    });

                    // 안읽은 사람 수 계산
                    let unreadCount = 0;

                    unreadCount = participants.filter((p: any) => {
                        const participantId = Number(p.userId);
                        const senderId = Number(m.userId);

                        if (participantId === senderId) return false; // 보낸 사람은 제외
                        const read = chatReadsState.find(
                            (r: any) => Number(r.userId) === participantId
                        );
                        if (!read || new Date(read.lastReadAt) < new Date(m.regDate)) return true;

                        return false;
                    }).length;

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

                                <div className="flex flex-col max-w-xs relative">
                                    {!isMine && (
                                        <span className="font-bold text-xs mb-1">
                                            {m.user?.nickname || m.userId}
                                        </span>
                                    )}
                                    <div className={`flex items-end gap-1 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
                                        <div
                                            className={`relative p-2 rounded-xl shadow-md text-sm break-words whitespace-pre-wrap max-w-[70vw] sm:max-w-300%] ${
                                                isMine
                                                    ? "bg-[#EED0B9]/50 text-black self-end rounded-br-none"
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

                                        {/* 읽음 수 */}
                                        {unreadCount > 0 && (
                                            <span className="flex items-center gap-[3px] text-[10px] text-[#E57373]/80">
                                                  {unreadCount}
                                            </span>
                                        )}


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
                    className="flex-1 border border-[#F5D1D1]/60 rounded-full px-4 py-2
               bg-white/60 focus:outline-none focus:ring-2 focus:ring-[#FADCD9]"
                    placeholder={"메시지를 입력하세요"}
                    disabled={uid === -1}
                />
                <button
                    type="submit"
                    className="bg-[#EBC5A7]/60 hover:bg-[#F8B2B2]/60 text-gray-600 px-4 py-2
               rounded-full transition-all shadow-sm font-medium"
                    disabled={uid === -1}
                >
                    <Send className="w-5 h-5" />
                </button>
            </form>
        </div>
    );

}
