"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// 무한스크롤 로딩
export async function loadMoreHabitsAction(cursor: number | null) {
    const session = await getServerSession(authOptions);
    const uid = Number(session?.user?.uid);
    if (!uid) return { items: [], nextCursor: null };

    const TAKE = 10;

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

        ...(cursor
            ? {
                skip: 1,
                cursor: {
                    channelId: cursor, 
                },
            }
            : {}),
    });

    const nextCursor =
        channels.length > 0
            ? channels[channels.length - 1].channelId
            : null;

    return {
        items: channels,
        nextCursor,
    };
}
