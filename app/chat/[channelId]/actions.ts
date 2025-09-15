"use server";

import prisma from "@/lib/prisma";

//메시지 전송 액션 - 채팅 메시지를 DB에 저장
export async function sendMessageAction(
    prevState: { ok: boolean; error?: string; message?: any },
    formData: FormData
): Promise<{ ok: boolean; error?: string; message?: any }> {
    const channelId = Number(formData.get("channelId"));
    const userId = Number(formData.get("userId"));
    const content = formData.get("content") as string;

    // 빈 문자열 방지
    if (!content || !content.trim()) {
        return { ok: false, error: "메시지를 입력하세요." };
    }

    // DB에 메시지 저장
    const message = await prisma.chatMessage.create({
        data: {
            channel_id: channelId,
            user_id: userId,
            content,
        },
        include: {
            user: true, // 닉네임 같은 유저 정보도 함께 가져오기
        },
    });

    return { ok: true, message };
}
