"use server"

import {getServerSession} from "next-auth";
import {authOptions} from '@/lib/auth';
import prisma from "@/backend/lib/prisma";
import HabitDropdown from "@/app/components/common/habitDropdown";

async function MainLayout({children}: { children: React.ReactNode }) {
    const session = await getServerSession(authOptions)
    const userId = Number(session?.user.uid)

    const teamIds = await prisma.teamMember.findMany({
        where: {userId},
        select: {teamId: true},
    }).then(rows => rows.map(r => r.teamId))

    const habits = await prisma.habit.findMany({
        where: {
            OR: [
                {userId},                  // 내가 만든 개인/팀 습관
                {teamId: {in: teamIds}}, // 내가 멤버로 속한 팀 습관
            ],
        },
        select: {
            habitId: true,
            title: true,
        },
        orderBy: [{regDate: "asc"}, {habitId: "asc"}],
    })

    const habitsMap = habits.map(habit => (
        {habitId: habit.habitId.toString(), title: habit.title}))

    return (
        <div className="flex flex-col h-screen w-full">
            <HabitDropdown habits={habitsMap}/>
            <div className="flex-1 overflow-hidden">
                {children}
            </div>
        </div>
    )
}

export default MainLayout