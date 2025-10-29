"use server"

import { redirect } from 'next/navigation';
import {getServerSession} from "next-auth";
import {authOptions} from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export default async function MainRootPage() {
    const session = await getServerSession(authOptions)
    const userId = Number(session?.user.uid)

    const teamIds = await prisma.teamMember.findMany({
        where: {userId},
        select: {teamId: true},
    }).then(rows => rows.map(r => r.teamId))

    const smallestHabit = await prisma.habit.findFirst({
        where: {
            OR: [
                {userId},                // 내가 만든 개인/팀 습관
                {teamId: {in: teamIds}}, // 내가 멤버로 속한 팀 습관
            ],
        },
        select: {
            habitId: true,
            title: true,
        },
        orderBy: [{regDate: "asc"}, {habitId: "asc"}],
    })

    if (smallestHabit) {
        redirect(`/main/${smallestHabit.habitId}`)
    } else {
        redirect('/habits/add')
    }
}