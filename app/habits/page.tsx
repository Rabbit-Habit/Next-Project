import prisma from "@/backend/lib/prisma";
import HabitsList from "@/app/components/habits/habitsList.client";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";

interface HabitsPageProps {
    searchParams: Promise<{
        pagePersonal?: string;
        pageTeam?: string;
        sort?: "recent" | "title" | "rabbit";
    }>;
}

export default async function HabitsPage({searchParams}: HabitsPageProps) {
    const session = await getServerSession(authOptions);
    const userId = Number(session?.user.uid);

    if (!userId) return <div>로그인이 필요합니다.</div>;

    const resolvedSearchParams = await searchParams;

    // 페이지 번호 (기본값 1)
    const pageSize = 3;
    const personalPage  = Number(resolvedSearchParams.pagePersonal ?? "1");
    const teamPage = Number(resolvedSearchParams.pageTeam ?? "1");

    const personalSkip = (personalPage - 1) * pageSize;
    const teamSkip = (teamPage - 1) * pageSize;

    const sort = resolvedSearchParams.sort ?? "recent";

    // 정렬 옵션 → Prisma orderBy 매핑
    let orderBy: any = {};

    if (sort === "recent") {
        orderBy = { habitId: "desc" };
    } else if (sort === "title") {
        orderBy = { title: "asc" };
    } else if (sort === "rabbit") {
        orderBy = { rabbitName: "asc" };
    }

    // 1) 내가 속한 팀 ID 목록 가져오기
    const teamIds = await prisma.teamMember.findMany({
        where: { userId },
        select: { teamId: true },
    }).then(rows => rows.map(r => r.teamId));

    // 2) 개인 습관 total count
    const totalPersonal = await prisma.habit.count({
        where: { userId },
    });

    // 3) 팀 습관 total count
    const totalTeam = await prisma.habit.count({
        where: {
            teamId: { in: teamIds },
            inviteCode: { not: null },
        },
    });

    // 4) 개인 습관 items
    const personalItems = await prisma.habit.findMany({
        where: {
            userId,
            inviteCode: { in: null }
        },
        orderBy,
        select: {
            habitId: true,
            title: true,
            rabbitName: true,
            rabbitStatus: true,
            goalDetail: true,
            regDate: true,
        },
        skip: personalSkip,
        take: pageSize,
    });

    const personalMapped = personalItems.map((i) => ({
        id: i.habitId.toString(),
        title: i.title ?? "제목 없는 습관",
        rabbitName: i.rabbitName,
        rabbitStatus: i.rabbitStatus as "alive" | "hungry" | "escaped",
        goalDetail: i.goalDetail ?? null,
        teamName: null,
        regDate: i.regDate ? i.regDate.toISOString() : null,
        isTeamHabit: false,
    }));

    // 5) 팀 습관 items
    const teamItems = await prisma.habit.findMany({
        where: {
            teamId: { in: teamIds },
            inviteCode: { not: null },
        },
        orderBy,
        select: {
            habitId: true,
            title: true,
            rabbitName: true,
            rabbitStatus: true,
            goalDetail: true,
            regDate: true,
            team: { select: { name: true } },
        },
        skip: teamSkip,
        take: pageSize,
    });

    const teamMapped = teamItems.map((i) => ({
        id: i.habitId.toString(),
        title: i.title ?? "제목 없는 습관",
        rabbitName: i.rabbitName,
        rabbitStatus: i.rabbitStatus as "alive" | "hungry" | "escaped",
        goalDetail: i.goalDetail ?? null,
        teamName: i.team?.name ?? null,
        regDate: i.regDate ? i.regDate.toISOString() : null,
        isTeamHabit: true,
    }));

    // 6) 각 탭의 총 페이지 수 계산
    const personalTotalPages = Math.ceil(totalPersonal / pageSize);
    const teamTotalPages = Math.ceil(totalTeam / pageSize);

    return (
        <HabitsList
            personalItems={personalMapped}
            teamItems={teamMapped}
            personalPage={personalPage}
            teamPage={teamPage}
            personalTotalPages={personalTotalPages}
            teamTotalPages={teamTotalPages}
            sort={sort}
        />
    );
}
