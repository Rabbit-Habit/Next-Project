import prisma from "@/lib/prisma";
import ChatClientComponent from "@/app/components/chat/chatClientComponent";


export default async function ChatPage({ params }: { params: Promise<{ channelId: string }> })  {

    const { channelId } = await params;

    // DB에서 초기 메시지 불러오기
    const initialMessages = await prisma.chatMessage.findMany({
        where: { channelId: Number(channelId) },
        orderBy: { regDate: "asc" }, // 오래된 메시지부터 보여주기
        include: { user: true }, // 유저 정보 포함
    });

    return (
        <div className="p-4">
            <h1 className="text-xl mb-4">채팅방 #{channelId}</h1>
            <ChatClientComponent channelId={channelId} initialMessages={initialMessages} />
        </div>
    );
}