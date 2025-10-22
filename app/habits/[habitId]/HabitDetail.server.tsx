import InviteCodeCardServer from "@/app/components/habits/inviteCodeCard.server";
import Header from "@/app/components/common/header";
import Link from "next/link";
import {submitCheckAction} from "@/app/habits/[habitId]/actions";
import { Suspense } from "react";
import MonthlyHeatmapComponent from "@/app/components/stat/MonthlyHeatmapComponent";
import HabitCheckButton from "@/app/components/habits/habitCheckButton";

export default function HabitDetail({
    habit,
    memberCount,
}: {
    habit: {
        id: string;
        title: string;
        rabbitName: string;
        rabbitStatus: "alive" | "hungry" | "escaped";
        goalDetail: string | null;
        goalCount: string | null;
        combo: string;
        isAttendance: boolean;
        inviteCode: string | null;
        regDate: string | null;
        modDate: string | null;
        teamName: string | null;
    };
    memberCount: number;
}) {
    const isTeamHabit = memberCount > 1 || !!habit.inviteCode;

    const statusClass =
        habit.rabbitStatus === "alive"
            ? "bg-green-50 text-green-700 border-green-200"
            : habit.rabbitStatus === "hungry"
                ? "bg-yellow-50 text-yellow-800 border-yellow-200"
                : "bg-red-50 text-red-700 border-red-200";

    const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : "—");

    async function checkAction(formData: FormData) {
        "use server";
        const hid = String(formData.get("habitId") ?? "");
        if (!hid) return;
        await submitCheckAction(hid);
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
            <Header title={habit.title} />

            <header className="flex flex-col gap-3 border-b pb-4">
                {/* 첫 줄: 제목 + Team */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">{habit.title}</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Habit ID: <span className="font-mono">{habit.id}</span> · Team:{" "}
                            {habit.teamName ?? "—"}
                        </p>
                    </div>

                    {/* 🐰 토끼 상태 배지 */}
                    <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${statusClass}`}
                    >
            {habit.rabbitStatus}
          </span>
                </div>

                {/* ✅ 오늘 체크 버튼 — 토끼 상태 바로 아래로 이동 */}
                <div className="flex justify-end">
                    <HabitCheckButton
                        habitId={habit.id}
                        action={checkAction}
                    />
                </div>
            </header>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 왼쪽: 정보 */}
                <div className="space-y-4">
                    <div className="p-4 border rounded-2xl">
                        <h2 className="font-semibold mb-2">기본 정보</h2>
                        <ul className="text-sm space-y-1">
                            <li><span className="text-gray-500">토끼 이름:</span> {habit.rabbitName}</li>
                            <li><span className="text-gray-500">목표 상세:</span> {habit.goalDetail ?? "—"}</li>
                            <li><span className="text-gray-500">목표 횟수:</span> {habit.goalCount ?? "—"}</li>
                            <li><span className="text-gray-500">콤보:</span> {habit.combo}</li>
                            <li><span className="text-gray-500">출석 체크 사용:</span> {habit.isAttendance ? "예" : "아니오"}</li>
                            <li><span className="text-gray-500">등록일:</span> {fmt(habit.regDate)}</li>
                            <li><span className="text-gray-500">수정일:</span> {fmt(habit.modDate)}</li>
                        </ul>
                    </div>
                </div>

                {/* 오른쪽: 구분 + 버튼 + 초대 코드 */}
                <div className="space-y-4">
                    <div className="p-4 border rounded-2xl">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h2 className="font-semibold mb-1">구분</h2>
                                <p className="text-sm">
                                    {isTeamHabit ? (
                                        <>팀 습관 <span className="text-gray-500">(팀 인원 {memberCount}명)</span></>
                                    ) : (
                                        <>개인 습관</>
                                    )}
                                </p>
                            </div>

                            {/* ✅ 여기로 버튼 이동 + 모달 확인 */}
                            <HabitCheckButton
                                habitId={habit.id}
                                action={checkAction}
                            />
                        </div>
                    </div>

                    {isTeamHabit && (
                        <InviteCodeCardServer habitId={habit.id} initialInviteCode={habit.inviteCode} />
                    )}
                </div>
            </section>

            {/* 하단: 편집/기타 액션 */}
            <div className="mt-2 flex items-center gap-2">
                <Link
                    href={`/habits/${habit.id.toString()}/edit`}
                    className="px-3 py-2 rounded-xl border hover:bg-gray-50"
                >
                    수정하기
                </Link>

                <HabitCheckButton
                    habitId={habit.id}
                    action={checkAction}
                />
            </div>

            {/*통계*/}
            <section className="mt-8">
                <h2 className="font-semibold mb-2">월 통계</h2>
                <Suspense fallback={<div>통계 로딩 중...</div>}>
                    <MonthlyHeatmapComponent habitId={habit.id} />
                </Suspense>
            </section>
        </div>
    );
}