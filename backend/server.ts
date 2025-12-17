import { createServer } from "http";
import { WebSocketServer } from "ws";
import prisma from "../lib/prisma";

/**
 * 🚀 Railway 전용 WebSocket 서버
 * - Next.js 서버는 Vercel에서 이미 실행 중
 * - 여기서는 WebSocket + DB 연동만 담당
 */

// HTTP 서버 생성 (Next.js 라우팅 ❌)
const server = createServer();

/**
 * WebSocket 서버 초기화
 * - noServer: true → HTTP upgrade 요청을 직접 핸들링
 */
const wss = new WebSocketServer({ noServer: true });

/**
 * HTTP 서버에서 WebSocket 업그레이드 요청 감지
 */
server.on("upgrade", (req, socket, head) => {
    // "/ws" 경로로 들어온 업그레이드 요청만 WebSocket 처리
    if (req.url === "/ws") {
        wss.handleUpgrade(req, socket, head, (ws) => {
            wss.emit("connection", ws, req);
        });
    }
});

/**
 * WebSocket 클라이언트 연결 이벤트
 */
wss.on("connection", (socket) => {
    console.log("✅ WebSocket client connected");

    /**
     * 클라이언트가 메시지를 보냈을 때
     */
    socket.on("message", async (raw) => {
        try {
            const msg = JSON.parse(raw.toString());

            /**
             * ✅ 메시지 삭제 이벤트
             */
            if (msg.type === "delete") {
                const { channelId, messageId } = msg;

                // 연결된 모든 클라이언트에 삭제 이벤트 broadcast
                wss.clients.forEach((client: any) => {
                    if (client.readyState === 1) {
                        client.send(
                            JSON.stringify({
                                type: "delete",
                                channelId,
                                messageId,
                            })
                        );
                    }
                });
                return;
            }

            /**
             * ✅ 읽음 이벤트 (클라이언트 → 서버)
             */
            if (msg.type === "read_update") {
                const { channelId, userId } = msg;

                // 현재 채널의 가장 최근 메시지 시간 가져오기
                const latestMessage = await prisma.chatMessage.findFirst({
                    where: { channelId },
                    orderBy: { regDate: "desc" },
                    select: { regDate: true },
                });

                // 최근 메시지가 없으면 지금 시각으로 대체
                const lastReadAt = latestMessage?.regDate ?? new Date();

                // DB 업데이트
                await prisma.chatRead.upsert({
                    where: { userId_channelId: { userId, channelId } },
                    update: { lastReadAt },
                    create: { userId, channelId, lastReadAt },
                });

                // 읽음 상태 broadcast
                wss.clients.forEach((client: any) => {
                    if (client.readyState === 1) {
                        client.send(
                            JSON.stringify({
                                type: "read_update",
                                channelId,
                                userId,
                                lastReadAt: lastReadAt.toISOString(),
                            })
                        );
                    }
                });
                return;
            }

            /**
             * ✅ 메시지 추가 이벤트
             */
            const { channelId, userId, content } = msg;

            // DB에 저장된 메시지 다시 가져오기
            // (action에서 이미 저장했어도 순서/정합성 맞추기 위함)
            const newMessage = await prisma.chatMessage.findFirst({
                where: { channelId, userId, content },
                orderBy: { regDate: "desc" },
                include: { user: true },
            });

            if (!newMessage) return;

            // 연결된 모든 클라이언트에 메시지 broadcast
            wss.clients.forEach((client: any) => {
                if (client.readyState === 1) {
                    client.send(JSON.stringify(newMessage));
                }
            });
        } catch (err) {
            console.error("❌ WebSocket error:", err);
        }
    });

    /**
     * 소켓 에러 핸들링
     */
    socket.on("error", (err) => {
        console.error("⚠️ WebSocket socket error:", err.message);
    });
});

/**
 * Railway에서 지정해주는 PORT 사용
 */
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Railway WebSocket server ready on port ${PORT}`);
});
