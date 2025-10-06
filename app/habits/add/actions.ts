'use server'

import { z } from 'zod'
import prisma from "@/lib/prisma";
import {revalidatePath} from "next/cache";
import {cookies} from "next/headers";

// 로그인 id 가져오기
async function getCurrentUserId() {
    const cookieStore = await cookies()
    const uid = cookieStore.get("uid")?.value
    const userId = uid ? Number(uid) : undefined
    return userId
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
const teamJoinSchema = z.object({
    inviteCode: z.string().min(4, '초대코드를 확인해주세요.').max(255),
})

// 개인 습관
export async function createPersonalHabit(input: z.infer<typeof personalHabitSchema>) {
    const parsed = personalHabitSchema.safeParse(input)
    if (!parsed.success) {
        return {ok: false, error: parsed.error.issues[0]?.message}
    }
    const userId = await getCurrentUserId()
    if (!userId) return { ok: false, error: '로그인이 필요합니다.' }

    const gcount = parsed.data.goalCount != null ? BigInt(parsed.data.goalCount) : null

    try {
        const res = await prisma.$transaction(async (tx)=> {
            const team = await tx.team.create({
                data: { name: `personal:${userId.toString()}:${Date.now()}` },
            })
            await tx.teamMember.create({
                data: {
                    teamId: team.teamId,
                    userId,
                    role: 'LEADER'
                }
            })
            const habit = await tx.habit.create({
                data: {
                    teamId: team.teamId,     // UNIQUE(teamId) → 팀당 해빗 1개
                    userId,
                    title: parsed.data.title,
                    goalDetail: parsed.data.goalDetail ?? null,
                    goalCount: gcount,
                    rabbitName: parsed.data.rabbitName,
                    rabbitStatus: 'alive',   // 초기 상태
                    inviteCode: null,        // 개인 습관은 기본 초대코드 없음
                    combo: 0,
                    isAttendance: true,
                },
            })
            return { habitId: habit.habitId, teamId: team.teamId }
        })

        revalidatePath('/habits')
        revalidatePath('/teams')
        return { ok: true, ...res }
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

    const gcount = parsed.data.goalCount != null ? BigInt(parsed.data.goalCount) : null
    const invite = parsed.data.generateInvite ? generateInviteCode() : null

    try {
        const res = await prisma.$transaction(async (tx) => {
            const team = await tx.team.create({
                data: { name: parsed.data.teamName },
            })
            await tx.teamMember.create({
                data: { teamId: team.teamId, userId, role: 'LEADER' },
            })
            const habit = await tx.habit.create({
                data: {
                    teamId: team.teamId, // 1:1
                    userId,
                    title: parsed.data.title,
                    goalDetail: parsed.data.goalDetail ?? null,
                    goalCount: gcount,
                    rabbitName: parsed.data.rabbitName,
                    rabbitStatus: 'alive',
                    inviteCode: invite,
                    combo: 0,
                    isAttendance: true,
                },
            })
            return { teamId: team.teamId, habitId: habit.habitId, inviteCode: invite }
        })

        revalidatePath('/teams')
        revalidatePath('/habits')
        return { ok: true, ...res }
    } catch (e: any) {
        return { ok: false, error: e?.message ?? 'DB 오류가 발생했습니다.' }
    }
}

// 초대코드로 팀 참여
type JoinTeamByInviteInput = { inviteCode: string }
type ActionResult = { ok: true } | { ok: false; error?: string }

export async function joinTeamByInvite(input: JoinTeamByInviteInput): Promise<ActionResult> {
    try {
        const cookieStore = await cookies()
        const uid = cookieStore.get("uid")?.value
        const userId = uid ? BigInt(uid) : null
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