"use server"

import { redirect } from 'next/navigation';
import {getServerSession} from "next-auth";
import {authOptions} from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export default async function MainRootPage() {
    const session = await getServerSession(authOptions)
    const userId = Number(session?.user.uid)

    const smallestHabit = await prisma.habit.findFirst({
        where: { userId: userId },
        select: { habitId: true },
        orderBy: [{regDate: "asc"}, {habitId: "asc"}],
    })

    if (smallestHabit) {
        redirect(`/main/${smallestHabit.habitId}`)
    } else {
        redirect('/habits/add')
    }
}