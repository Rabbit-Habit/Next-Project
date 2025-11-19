import prisma from "@/lib/prisma";
import ChatListComponent from "@/app/components/chat/chatListComponent";
import {getServerSession} from "next-auth";
import {authOptions} from "@/app/api/auth/[...nextauth]/route";

export default async function ChatListPage() {


    // 로그인 uid 가져오기
    const session = await getServerSession(authOptions)
    const uid = Number(session?.user.uid)
    if (!uid) return <div className="p-4">로그인이 필요합니다.</div>;

    const TAKE = 10;


    // 습관 목록 + 채팅방 + 최근 메시지 불러오기
    const channels = await prisma.chatChannel.findMany({
        where: {
            habit: {
                team: {
                    members: { some: { userId: uid } },
                },
            },
        },
        include: {
            habit: {
                include: {
                    team: { include: { members: true } },
                },
            },
            messages: {
                orderBy: { regDate: "desc" },
                take: 1,
                include: { user: true },
            },
            chatRead: true,
        },
        orderBy: [
            { lastMessageAt: "desc" },
            { channelId: "asc" }
        ],
        take: TAKE,
    });

    const nextCursor =
        channels.length > 0 ? channels[channels.length - 1].channelId : null;

    return (
        <div>
            <ChatListComponent
                initialChannels={channels}
                initialCursor={nextCursor}
            />
        </div>
    );
}
