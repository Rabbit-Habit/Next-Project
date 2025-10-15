"use server"

import {getServerSession} from "next-auth";
import {authOptions} from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import HabitDropdown from "@/app/components/common/habitDropdown";

async function MainLayout({ children }: { children: React.ReactNode }) {
    const session = await getServerSession(authOptions)
    const userId = Number(session?.user.uid)

    const habits = await prisma.habit.findMany({
        where: { userId: userId },
        select: {
            habitId: true,
            title: true,
        },
        orderBy: [{regDate: "asc"}, {habitId: "asc"}],
    })

    const habitsMap = habits.map(habit => (
        { habitId: habit.habitId.toString(), title: habit.title }))

    return (
        <div className="flex flex-col h-screen w-full">
            <HabitDropdown habits={habitsMap} />
            <div className="flex-1 overflow-hidden">
                {children}
            </div>
        </div>
    )
}

export default MainLayout