"use server";

import prisma from "@/lib/prisma";

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

    return { ok: true, message };
}

// 메시지 삭제 액션
export async function deleteMessageAction(messageId: number, userId: number){
    try{
        const deleted = await prisma.chatMessage.deleteMany({
            where: {
                messageId,
                userId, //본인 메시지만 삭제 가능
            },
        });
        return { ok: deleted.count > 0 };
    } catch (err) {
        console.error("❌ deleteMessageAction error", err);
        return { ok: false };
    }
}