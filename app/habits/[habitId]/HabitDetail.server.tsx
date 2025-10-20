import InviteCodeCardServer from "@/app/components/habits/inviteCodeCard.server";
import Header from "@/app/components/common/header";
import Link from "next/link";
import {submitCheckAction} from "@/app/habits/[habitId]/actions";

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

    return (
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
            <Header title={habit.title}/>
            <header className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">{habit.title}</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Habit ID: <span className="font-mono">{habit.id}</span> · Team: {habit.teamName ?? "—"}
                    </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusClass}`}>
                  {habit.rabbitStatus}
                </span>
            </header>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                <div className="space-y-4">
                    <div className="p-4 border rounded-2xl">
                        <h2 className="font-semibold mb-2">구분</h2>
                        <p className="text-sm">
                            {isTeamHabit ? (
                                <>팀 습관 <span className="text-gray-500">(팀 인원 {memberCount}명)</span></>
                            ) : (
                                <>개인 습관</>
                            )}
                        </p>
                    </div>

                    {isTeamHabit && (
                        <InviteCodeCardServer
                            habitId={habit.id}
                            initialInviteCode={habit.inviteCode}
                        />
                    )}
                </div>
            </section>
            <div className="mt-2">
                <Link
                    href={`/habits/${habit.id.toString()}/edit`}
                    className="px-3 py-2 rounded-xl border hover:bg-gray-50"
                >
                    수정하기
                </Link>
                <form action={async () => {
                    "use server";
                    await submitCheckAction(habit.id);
                }}>
                    <button className="px-3 py-2 rounded-xl border bg-amber-50 text-amber-700 hover:bg-amber-100">
                        {(memberCount > 1 || !!habit.inviteCode) ? "팀 기여 1회" : "오늘 체크"}
                    </button>
                </form>
            </div>
        </div>
    );
}