import prisma from "@/lib/prisma";
import ChatListComponent from "@/app/components/chat/chatListComponent";
import {getServerSession} from "next-auth";
import {authOptions} from "@/app/api/auth/[...nextauth]/route";
import Header from "@/app/components/common/header";
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
                        userId: Number(uid ?? 0),
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

    return (
        <div>
            <Header title={"내 채팅방"} backUrl={"/users/mypage"} />
            <ChatListComponent habits={filteredHabits} />
        </div>
    );
}
