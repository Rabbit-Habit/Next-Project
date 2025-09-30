import prisma from "@/lib/prisma";
import {revalidatePath} from "next/cache";
import InviteCodeCard from "@/app/components/habits/inveteCodeCard";

export default function InviteCodeCardServer({
                                                 habitId,
                                                 initialInviteCode,
                                             }: {
    habitId: string;
    initialInviteCode: string | null;
}) {
    async function onRegenerate(id: string) {
        "use server";
        const habitIdBig = BigInt(id);
        const code = `RH-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random()
            .toString(36)
            .slice(2, 6)
            .toUpperCase()}`;

        const updated = await prisma.habit.update({
            where: { habitId: habitIdBig },
            data: { inviteCode: code },
            select: { inviteCode: true },
        });

        revalidatePath(`/habits/${id}`);
        return updated.inviteCode;
    }

    return (
        <InviteCodeCard
            habitId={habitId}
            initialInviteCode={initialInviteCode}
            onRegenerate={onRegenerate}
        />
    );
}