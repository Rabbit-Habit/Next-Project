import { createServer } from "http";
import next from "next";
import { WebSocketServer } from "ws";
import prisma from "./lib/prisma";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

// WebSocket 전용 커스텀 서버
async function main() {
    await app.prepare();

    // HTTP 서버 생성 → Next.js 라우팅 요청 처리
    const server = createServer((req, res) => handle(req, res));

    // WebSocket 서버 초기화 (upgrade 요청을 직접 핸들링)
    const wss = new WebSocketServer({ noServer: true });

    // HTTP 서버에서 WebSocket 업그레이드 요청 감지
    server.on("upgrade", (req, socket, head) => {
        // "/ws" 경로로 들어온 업그레이드 요청만 WebSocket 처리
        if (req.url === "/ws") {
            wss.handleUpgrade(req, socket, head, (ws) => {
                wss.emit("connection", ws, req);
            });
        }
    });

    // WebSocket 클라이언트 연결 이벤트
    wss.on("connection", (socket) => {
        console.log("✅ WebSocket client connected");

        // 클라이언트가 메시지를 보냈을 때
        socket.on("message", async (raw) => {
            try {
                const msg = JSON.parse(raw.toString());

                // ✅ 메시지 삭제 이벤트
                if (msg.type === "delete") {
                    const { channelId, messageId } = msg;

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

                // ✅ 메시지 추가 이벤트
                const { channelId, userId, content } = msg;

                // DB에 저장된 메시지 다시 가져오기 (action에서 이미 저장했어도 확실히 맞추자)
                const newMessage = await prisma.chatMessage.findFirst({
                    where: { channelId, userId, content },
                    orderBy: { regDate: "desc" },
                    include: { user: true },
                });

                if (!newMessage) return;

                // 연결된 모든 클라에 메시지를 broadcast
                wss.clients.forEach((client: any) => {
                    if (client.readyState === 1) {
                        client.send(JSON.stringify(newMessage));
                    }
                });
            } catch (err) {
                console.error("❌ WebSocket error:", err);
            }
        });

        socket.on("error", (err) => {
            console.error("⚠️ WebSocket socket error:", err.message);
        });
    });

    server.listen(3000, () => {
        console.log("🚀 Server ready on http://localhost:3000");
    });
}

main().catch((err) => {
    console.error("❌ Server failed to start", err);
    process.exit(1);
});
