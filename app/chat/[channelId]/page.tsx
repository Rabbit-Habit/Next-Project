import prisma from "@/lib/prisma";
import ChatClientComponent from "@/app/components/chat/chatClientComponent";
import {updateReadStatusAction} from "@/app/chat/[channelId]/actions";
import {getServerSession} from "next-auth";
import {authOptions} from "@/app/api/auth/[...nextauth]/route";
import {redirect} from "next/navigation";


export default async function ChatPage({ params }: { params: Promise<{ channelId: string }> })  {

    const { channelId } = await params;

    // 로그인 유저 확인
    const session = await getServerSession(authOptions)
    const uid = Number(session?.user.uid)
    if (!uid) redirect("/login"); // 로그인 안 했을 때

    const channel = await prisma.chatChannel.findUnique({
        where: { channelId: Number(channelId) },
        include: {
            messages: {
                orderBy: { regDate: "desc" },
                take: 20, // 처음엔 최근 20개만
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

    // 존재하지 않는 채널 or 권한 없는 유저 → 접근 차단
    if (!channel) redirect("/chat");
    const isMember = channel.habit?.team?.members?.some((m) => Number(m.userId) === uid);
    if (!isMember) redirect("/chat"); // URL로 직접 접근 차단

    // 초기 메시지 불러오기
    const initialMessages = channel?.messages.reverse() ?? [];

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