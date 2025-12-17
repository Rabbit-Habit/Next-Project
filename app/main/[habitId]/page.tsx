"use server"

import MainComponent from "@/app/components/main/mainComponent";
import {notFound} from "next/navigation";
import {toBigint} from "@/app/habits/[habitId]/page";
import prisma from "@/backend/lib/prisma";

async function MainPage(
    props : { params: Promise<{ habitId: string }> }
) {
    const { habitId } = await props.params
    const habitIdBig = toBigint(habitId)

    if (!habitIdBig) {
        return notFound()
    }

    const habit = await prisma.habit.findUnique({
        where: {habitId: habitIdBig},
        select: {
            habitId: true,
            title: true,
            rabbitName: true,
            rabbitStatus: true,
            combo: true,
            isAttendance: true,
        },
    })

    if (!habit) {
        return notFound()
    }

    const chatChannel = await prisma.chatChannel.findUnique({
        where: { habitId: habitIdBig },
        select: { channelId: true },
    })

    return (
        <MainComponent habit={{...habit, channelId: chatChannel? chatChannel.channelId : null}}/>
    )
}

export default MainPage