'use server'

import { z } from 'zod'
import prisma from "@/lib/prisma";
import {revalidatePath} from "next/cache";
import {getServerSession} from "next-auth";
import {authOptions} from "@/app/api/auth/[...nextauth]/route";

// 로그인 id 가져오기
async function getCurrentUserId(): Promise<number  | null> {
    const session = await getServerSession(authOptions)
    const userId = Number(session?.user.uid)
    return Number.isFinite(userId) && userId > 0 ? userId : null
}

// 초대 코드 생성기
function generateInviteCode() {
    const r = () => Math.random().toString(36).slice(2, 6).toUpperCase()
    return `RH-${r()}-${r()}`
}

// 공통 입력란 검증
const habitCore = {
    title: z.string().min(1, '제목은 필수입니다.').max(255),
    rabbitName: z.string().min(1, '토끼 이름은 필수입니다.').max(255),
    goalDetail: z.string().max(255).optional().nullable(),
    goalCount: z.coerce.number().int().min(1).max(9999).optional(),
}

const personalHabitSchema = z.object(habitCore)

const teamCreateSchema = z.object({
    teamName: z.string().min(1, '팀 이름은 필수입니다.').max(255),
    ...habitCore,
    generateInvite: z.boolean().optional(),
})

// 개인 습관
export async function createPersonalHabit(input: z.infer<typeof personalHabitSchema>) {
    const parsed = personalHabitSchema.safeParse(input)
    if (!parsed.success) {
        return {ok: false, error: parsed.error.issues[0]?.message}
    }
    const userId = await getCurrentUserId()
    if (!userId) return { ok: false, error: '로그인이 필요합니다.' }

    const now = new Date()
    const oneMinAgo = new Date(now.getTime() - 60_000)
    const gcount = BigInt(parsed.data.goalCount ?? 1)

    try {

        // 60초 이내, 제목이랑 토끼가 같으면 새로 만들지 않음
        const existig = await prisma.habit.findFirst({
            where: {
                userId,
                title: parsed.data.title.trim(),
                rabbitName: parsed.data.rabbitName.trim(),
                regDate: { gte: oneMinAgo },
            },
            select: { habitId: true, teamId: true },
        })
        if (existig) {
            revalidatePath('/habits')
            return { ok: true, deduped: true as const, ...existig }
        }

        const res = await prisma.$transaction(async (tx)=> {
            const team = await tx.team.create({
                data: { name: `personal:${userId.toString()}:${Date.now()}`, regDate: now },
            })
            await tx.teamMember.create({
                data: { teamId: team.teamId, userId, role: 'LEADER', regDate: now },
            })
            const habit = await tx.habit.create({
                data: {
                    teamId: team.teamId,
                    userId,
                    title: parsed.data.title.trim(),
                    goalDetail: parsed.data.goalDetail ?? null,
                    goalCount: gcount,
                    rabbitName: parsed.data.rabbitName.trim(),
                    rabbitStatus: 'alive',
                    inviteCode: null,
                    combo: BigInt(0),
                    isAttendance: true,
                    regDate: now,
                },
                select: { habitId: true, teamId: true },
            });

            // 채팅방 생성
            await tx.chatChannel.create({
                data: {
                    habitId: habit.habitId,
                    regDate: now,
                },
            });

            return habit
        })

        revalidatePath('/habits')
        revalidatePath('/teams')
        return { ok: true, deduped: false as const, ...res }
    } catch (e: any) {
        return { ok: false, error: e?.message ?? 'DB 오류가 발생' }
    }
}

// 팀 습관
export async function createTeamHabit(input: z.infer<typeof teamCreateSchema>) {
    const parsed = teamCreateSchema.safeParse(input)
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message }

    const userId = await getCurrentUserId()
    if (!userId) return { ok: false, error: '로그인이 필요합니다.' }

    const now = new Date()
    const oneMinAgo = new Date(now.getTime() - 60_000)
    const gcount = parsed.data.goalCount != null ? BigInt(parsed.data.goalCount) : null
    const invite = parsed.data.generateInvite ? generateInviteCode() : null

    try {
        // 60초 내 내가 만든 같은 팀이름+같은 습관제목이 이미 있으면 멱등 처리
        const existing = await prisma.habit.findFirst({
            where: {
                userId,
                title: parsed.data.title.trim(),
                regDate: { gte: oneMinAgo },
                team: { name: parsed.data.teamName.trim() },
            },
            select: { habitId: true, teamId: true, inviteCode: true },
        })
        if (existing) {
            revalidatePath('/habits'); revalidatePath('/teams')
            return { ok: true, deduped: true as const, teamId: existing.teamId, habitId: existing.habitId, inviteCode: existing.inviteCode ?? null }
        }

        const res = await prisma.$transaction(async (tx) => {
            const team = await tx.team.create({
                data: { name: parsed.data.teamName.trim(), regDate: now },
                select: { teamId: true },
            })
            await tx.teamMember.upsert({
                where: { teamId_userId: { teamId: team.teamId, userId } },
                create: { teamId: team.teamId, userId, role: 'LEADER', regDate: now },
                update: {},
            })
            const habit = await tx.habit.create({
                data: {
                    teamId: team.teamId,
                    userId,
                    title: parsed.data.title.trim(),
                    goalDetail: parsed.data.goalDetail ?? null,
                    goalCount: gcount,
                    rabbitName: parsed.data.rabbitName.trim(),
                    rabbitStatus: 'alive',
                    inviteCode: invite,
                    combo: BigInt(0),
                    isAttendance: true,
                    regDate: now,
                },
                select: { habitId: true, inviteCode: true },
            })

            // 채팅방 생성
            await tx.chatChannel.create({
                data: {
                    habitId: habit.habitId,
                    regDate: now,
                },
            });

            return { teamId: team.teamId, habitId: habit.habitId, inviteCode: habit.inviteCode }
        })


        revalidatePath('/teams'); revalidatePath('/habits')
        return { ok: true, deduped: false as const, ...res }
    } catch (e: any) {
        return { ok: false, error: e?.message ?? 'DB 오류가 발생했습니다.' }
    }
}


// 초대코드로 팀 참여
type JoinTeamByInviteInput = { inviteCode: string }
type ActionResult = { ok: true } | { ok: false; error?: string }

export async function joinTeamByInvite(input: JoinTeamByInviteInput): Promise<ActionResult> {
    try {
        const userId = await getCurrentUserId()
        if (!userId) return { ok: false, error: "로그인이 필요합니다."}

        const habit = await prisma.habit.findFirst({
            where: { inviteCode: input.inviteCode },
            select: { teamId: true, habitId: true },
        })
        if (!habit?.teamId) return { ok: false, error:"유효하지 않은 초대코드" }

        await prisma.teamMember.upsert({
            where: { teamId_userId: { teamId: habit.teamId, userId } },
            create: { teamId: habit.teamId, userId, role: "MEMBER", regDate: new Date() },
            update: {},
        })

        return { ok: true }
    } catch (e) {
        console.error(e)
        return { ok: false, error: "팀 참여 중 오류 발생"}
    }
}