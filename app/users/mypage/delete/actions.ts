"use server"

import {getServerSession} from "next-auth";
import {authOptions} from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function UserDeleteAction(formData: FormData): Promise<DeleteResult> {
    const session = await getServerSession(authOptions)
    const userId = session?.user.uid

    console.log("User Delete Reason: ", formData.get("reason"))

    if (!userId) {
        console.log("User authentication failed")

        return {
            uid: -1,
            error: "로그인이 필요합니다.",
        }
    }

    try {
        const user = await prisma.user.findUnique({ where: { userId } });
        if (!user) {
            return { uid: -1, error: "사용자를 찾을 수 없습니다." }
        }

        await prisma.$transaction(async (tx) => {
            // 1. 팀 멤버 정보 조회
            const userTeams = await tx.teamMember.findMany({
                where: { userId },
                select: { teamId: true, role: true },
            });

            const leaderTeamIds = userTeams
                .filter((t) => t.role === "LEADER")
                .map((t) => t.teamId)
            const memberTeamIds = userTeams
                .filter((t) => t.role === "MEMBER")
                .map((t) => t.teamId)

            // 2. MEMBER 처리
            if (memberTeamIds.length > 0) {
                await tx.teamMember.deleteMany({
                    where: { userId, teamId: { in: memberTeamIds } },
                })

                const memberHabits = await tx.habit.findMany({
                    where: { teamId: { in: memberTeamIds } },
                    select: { habitId: true },
                })
                const habitIds = memberHabits.map((h) => h.habitId)

                await tx.habitHistory.deleteMany({
                    where: { habitId: { in: habitIds }, userId },
                })

                // 채팅 삭제
                for (const habitId of habitIds) {
                    const channel = await tx.chatChannel.findUnique({
                        where: { habitId },
                        select: { channelId: true },
                    })
                    if (channel) {
                        await tx.chatRead.deleteMany({ where: { channelId: channel.channelId, userId } });
                        await tx.chatMessage.deleteMany({ where: { channelId: channel.channelId, userId } });
                    }
                }
            }

            // 3. LEADER 처리
            if (leaderTeamIds.length > 0) {
                const leaderHabits = await tx.habit.findMany({
                    where: { teamId: { in: leaderTeamIds } },
                    select: { habitId: true },
                })
                const habitIds = leaderHabits.map((h) => h.habitId)

                await tx.habitHistory.deleteMany({ where: { habitId: { in: habitIds } } })
                await tx.habitTeamHistory.deleteMany({ where: { habitId: { in: habitIds } } })

                for (const habitId of habitIds) {
                    const channel = await tx.chatChannel.findUnique({
                        where: { habitId },
                        select: { channelId: true },
                    })
                    if (channel) {
                        await tx.chatRead.deleteMany({ where: { channelId: channel.channelId } })
                        await tx.chatMessage.deleteMany({ where: { channelId: channel.channelId } })
                        await tx.chatChannel.delete({ where: { channelId: channel.channelId } })
                    }
                }

                await tx.teamMember.deleteMany({ where: { teamId: { in: leaderTeamIds } } })
                await tx.habit.deleteMany({ where: { teamId: { in: leaderTeamIds } } })
                await tx.team.deleteMany({ where: { teamId: { in: leaderTeamIds } } })
            }

            // 4. 사용자 삭제
            await tx.user.delete({ where: { userId } })
        });

        return { uid: user.userId, error: "" }
    } catch (err: any) {
        console.error("User deletion failed:", err)
        return {
            uid: -1,
            error: err.message || "알 수 없는 오류가 발생했습니다.",
        }
    }
}