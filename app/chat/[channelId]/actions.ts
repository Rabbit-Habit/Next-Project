"use server";

import prisma from "@/lib/prisma";
import {getServerSession} from "next-auth";
import {authOptions} from "@/app/api/auth/[...nextauth]/route";

// 메시지 전송 액션
export async function sendMessageAction(formData: FormData): Promise<{ ok: boolean; error?: string; message?: any }> {

    // 1. FormData에서 값 꺼내오기
    const channelId = Number(formData.get("channelId"));
    const userId = Number(formData.get("userId"));
    const content = formData.get("content") as string;

    // 2. 유효성 검사
    if (!content || !userId || !channelId) {
        return { ok: false, error: "잘못된 요청" };
    }

    // 3. DB에 메시지 저장
    const message = await prisma.chatMessage.create({
        data: {
            channelId,
            userId,
            content,
        },
        include: { user: true }, // 유저 정보 같이 가져오기
    });

    // 마지막 시간 업데이트
    await prisma.chatChannel.update({
        where: { channelId },
        data: { lastMessageAt: new Date() }
    })


    return { ok: true, message };
}

// 메시지 삭제 액션
export async function deleteMessageAction(messageId: number, userId: number){
    try{
        // 메시지 가져오기 (삭제 제한 확인용)
        const message = await prisma.chatMessage.findUnique({
            where: {messageId},
            select: {userId: true, regDate: true},
        });

        if (!message || message.userId !== userId) {
            return { ok: false };
        }

        // 보낸지 1시간 넘었으면 삭제하지 않음
        const now = new Date();
        const diff = (now.getTime() - new Date(message.regDate).getTime()) / 1000 / 60;
        if (diff > 60) return { ok: false };

        // 1시간 이내면 삭제 진행
        await prisma.chatMessage.delete({ where: { messageId } });
        return { ok: true };

    } catch (err) {
        console.error("❌ deleteMessageAction error", err);
        return { ok: false };
    }
}

// 읽음 처리 액션
export async function updateReadStatusAction(channelId: number) {
    const session = await getServerSession(authOptions)
    const uid = Number(session?.user.uid)
    if (!uid) return { ok: false, message: "로그인 필요" }

    try {
        await prisma.chatRead.upsert({
            where: {
                userId_channelId: {
                    userId: Number(uid),
                    channelId: Number(channelId),
                },
            },
            update: { lastReadAt: new Date() },
            create: {
                userId: Number(uid),
                channelId: Number(channelId),
            },
        })


        return { ok: true }
    } catch (e) {
        console.error("❌ updateReadStatus error", e)
        return { ok: false, message: "DB update 실패" }
    }
}

// 과거 메시지 불러오기(무한 스크롤용)
export async function loadOlderMessagesAction(channelId: number, cursor?: number) {
    const take = 20; // 한 번에 가져올 개수

    const messages = await prisma.chatMessage.findMany({
        where: { channelId },
        orderBy: { regDate: "desc" },
        take,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { messageId: cursor } : undefined,
        include: { user: true },
    });

    // 다음 커서 설정
    const nextCursor = messages.length === take ? messages[messages.length - 1].messageId : null;

    return {
        messages: messages.reverse(),
        nextCursor,
    };
}