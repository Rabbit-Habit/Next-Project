import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);

    const cursor = searchParams.get("cursor");  // habitId string
    const sort = searchParams.get("sort") ?? "recent";
    const limit = Number(searchParams.get("limit") ?? 5);

    // 정렬 로직
    let orderBy: any = {};

    switch (sort) {
        case "title":
            orderBy = { title: "asc" };
            break;
        case "rabbit":
            orderBy = { rabbitName: "asc" };
            break;
        case "recent":
        default:
            orderBy = { habitId: "desc" };
            break;
    }

    const items = await prisma.habit.findMany({
        take: limit,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { habitId: BigInt(cursor) } : undefined,
        orderBy,
        select: {
            habitId: true,
            title: true,
            rabbitName: true,
            rabbitStatus: true,
            goalDetail: true,
            inviteCode: true,
            regDate: true,
            team: { select: { name: true } },
        },
    });

    const mapped = items.map((i) => ({
        id: i.habitId.toString(),
        title: i.title ?? "제목 없는 습관",
        rabbitName: i.rabbitName,
        rabbitStatus: i.rabbitStatus,
        goalDetail: i.goalDetail,
        regDate: i.regDate?.toISOString() ?? null,
        teamName: i.team?.name ?? null,
        isTeamHabit: !!i.inviteCode,
    }));

    return NextResponse.json({
        items: mapped,
        nextCursor: mapped.length === limit ? mapped[mapped.length - 1].id : null,
    });
}
