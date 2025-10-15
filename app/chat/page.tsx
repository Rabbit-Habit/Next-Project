import prisma from "@/lib/prisma";
import ChatListComponent from "@/app/components/chat/chatListComponent";
import {getServerSession} from "next-auth";
import {authOptions} from "@/app/api/auth/[...nextauth]/route";
export default async function ChatListPage() {

    // 로그인 uid 가져오기
    const session = await getServerSession(authOptions)
    const uid = Number(session?.user.uid)
    if (!uid) return <div className="p-4">로그인이 필요합니다.</div>;

    // 습관 목록 + 채팅방 + 최근 메시지 불러오기
    const habits = await prisma.habit.findMany({
        where: {
            team: {
                members: {
                    some: {
                        userId: BigInt(uid ?? 0),
                    },
                },
            },
        },
        include: {
            team: { include: { members: true } },
            chatChannel: {
                include: {
                    messages: {
                        orderBy: {regDate: "desc"},
                        take: 1,
                        include: { user: true },
                    },
                    chatRead: true,
                },
            },
        },
    });

    // 2명 이상 팀만 필터링
    const filteredHabits = habits.filter((h) => h.team.members.length > 1);

    return (
        <ChatListComponent habits={filteredHabits} />
    );
}
