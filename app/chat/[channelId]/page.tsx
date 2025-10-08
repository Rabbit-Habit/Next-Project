import prisma from "@/lib/prisma";
import ChatClientComponent from "@/app/components/chat/chatClientComponent";
import {updateReadStatusAction} from "@/app/chat/[channelId]/actions";


export default async function ChatPage({ params }: { params: Promise<{ channelId: string }> })  {

    const { channelId } = await params;

    const channel = await prisma.chatChannel.findUnique({
        where: { channelId: Number(channelId) },
        include: {
            messages: {
                orderBy: { regDate: "asc" }, // 오래된 메시지부터 보여주기
                include: { user: true },
            },
            chatRead: true,
            // habit -> team -> teamMember -> user
            habit: {
                include: {
                    team: {
                        include: {
                            members: {
                                include: { team: true },
                            },
                        },
                    },
                },
            },
        },
    });

    // 초기 메시지 불러오기
    const initialMessages = channel?.messages ?? [];

    // 참여자 가져오기
    const participants = channel?.habit?.team?.members ?? [];

    // 읽음 상태 가져오기
    const chatReads = channel?.chatRead ?? [];

    // 읽음 상태 액션 호출
    await updateReadStatusAction(Number(channelId));

    return (
        <ChatClientComponent
            channelId={channelId}
            initialMessages={initialMessages}
            participants={participants}
            chatReads={chatReads}
            habitTitle={channel?.habit?.title}
        />
    );
}