"use server"

import {getServerSession} from "next-auth";
import {authOptions} from '@/lib/auth';
import prisma from "@/backend/lib/prisma";

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
                // 본인이 속한 team member 행 삭제
                await tx.teamMember.deleteMany({
                    where: { userId, teamId: { in: memberTeamIds } },
                })

                // 해당 팀들에 속한 habitIds 조회
                const memberHabits = await tx.habit.findMany({
                    where: { teamId: { in: memberTeamIds } },
                    select: { habitId: true },
                })
                const habitIds = memberHabits.map((h) => h.habitId)

                // 개인 habit history 삭제(본인)
                await tx.habitHistory.deleteMany({
                    where: { habitId: { in: habitIds }, userId },
                })

                // chat read 제거 (사용자의 읽음 레코드)
                for (const habitId of habitIds) {
                    const channel = await tx.chatChannel.findUnique({
                        where: { habitId },
                        select: { channelId: true },
                    })

                    if (channel) {
                        await tx.chatRead.deleteMany({ where: { channelId: channel.channelId, userId } });
                    }
                }
            }

            // 3. LEADER 처리
            if (leaderTeamIds.length > 0) {
                // 해당 팀들에 속한 habitIds 조회
                const leaderHabits = await tx.habit.findMany({
                    where: { teamId: { in: leaderTeamIds } },
                    select: { habitId: true },
                })
                const habitIds = leaderHabits.map((h) => h.habitId)

                // 모든 팀원 habit history, 팀 habit team history 삭제
                await tx.habitHistory.deleteMany({ where: { habitId: { in: habitIds } } })
                await tx.habitTeamHistory.deleteMany({ where: { habitId: { in: habitIds } } })

                // chat read, chat message, chat channel 전부 삭제
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

                // team member, habit, team 전부 삭제
                await tx.teamMember.deleteMany({ where: { teamId: { in: leaderTeamIds } } })
                await tx.habit.deleteMany({ where: { teamId: { in: leaderTeamIds } } })
                await tx.team.deleteMany({ where: { teamId: { in: leaderTeamIds } } })
            }

            // 4) 사용자 개인정보 마스킹(soft delete)
            await tx.user.update({
                where: { userId },
                data: {
                    isDeleted: true,
                    id: null,
                    password: null,
                    imageUrl: null,
                    nickname: `탈퇴 사용자${userId}`,
                }
            })
        })

        return { uid: user.userId, error: "" }
    } catch (err: any) {
        console.error("User deletion failed:", err)
        return {
            uid: -1,
            error: err.message || "알 수 없는 오류가 발생했습니다.",
        }
    }
}