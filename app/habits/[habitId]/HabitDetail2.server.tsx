import InviteCodeCardServer from "@/app/components/habits/inviteCodeCard.server";
import Header from "@/app/components/common/header";
import Link from "next/link";
import { submitCheckAction } from "@/app/habits/[habitId]/actions";
import { Suspense } from "react";
import MonthlySectionComponent from "@/app/components/stat/MonthlySectionComponent";
import AccumulatedStatComponent from "@/app/components/stat/AccumulatedStatComponent";
import {redirect} from "next/navigation";
import HabitCheckButton from "@/app/components/habits/habitCheckButton";

export default function HabitDetail2({
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

    const statusInfo =
        habit.rabbitStatus === "alive"
            ? {
                label: "행복한 토끼 🥕",
                class: "bg-emerald-50 text-emerald-700 border-emerald-200",
            }
            : habit.rabbitStatus === "hungry"
                ? {
                    label: "배고픈 상태 😢",
                    class: "bg-amber-50 text-amber-800 border-amber-200",
                }
                : {
                    label: "탈출 ☠️️",
                    class: "bg-rose-50 text-rose-700 border-rose-200",
                };

    // 날짜 형식 00.00.00
    const fmt = (iso: string | null) => {
        if (!iso) return "—";
        const d = new Date(iso);
        const year = String(d.getFullYear()).slice(2); // 2025 → 25
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}.${month}.${day}`;
    };

    async function checkAction(formData: FormData) {
        "use server";

        const hid = String(formData.get("habitId") ?? "");
        if (!hid) return;

        const result = await submitCheckAction(formData);

        // 🔸 여기서 result를 보고 분기하면 됨
        if (!result.ok && result.reason === "ALREADY_DONE") {
            // 이미 체크한 경우
            redirect(`/habits/${hid}?already=1`);
        }

        // 첫 체크 성공 or 기타 케이스
        redirect(`/habits/${hid}?checked=1`);
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#FFF5E6] via-[#FAE8CA] to-[#F5D7B0]">
            <Header title={habit.title} />

            <div className="max-w-md mx-auto px-4 py-6 space-y-6">
                <section className="mt-2 rounded-3xl bg-[#FFF9F1] border border-[#F0D4B2] px-5 py-5 shadow-sm space-y-4">
                    {/* 토끼 정보 */}
                    <div className="flex flex-col items-center">
                        {/*
                          실제로 이미지를 쓸 때 예시:
                          <div className="w-24 h-24 rounded-full bg-[#FBEAD4] flex items-center justify-center overflow-hidden border-[#E7C8A9] mb-2">
                            <img
                              src={habit.rabbitImageUrl}
                              alt={habit.rabbitName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        */}
                        <div className="w-20 h-20 rounded-full bg-[#FBEAD4] flex items-center justify-center border border-[#E7C8A9] mb-2 text-3xl">
                            🐰
                        </div>
                        <p className="text-xs text-[#9B7A63]">
                            <span className="font-semibold">{habit.rabbitName}</span>
                        </p>
                    </div>

                    {/* 습관 타이틀 + 팀/상태 */}
                    <div className="flex flex-col items-center space-y-2">
                        <h1 className="text-xl font-bold text-[#4A2F23] text-center">
                            {habit.title}
                        </h1>

                        <div className="flex flex-wrap items-center justify-center gap-2 text-[11px]">
                            {isTeamHabit && (
                                <span className="px-2.5 py-1 rounded-full font-semibold bg-[#FBEAD4] text-[#B05C31] border border-[#E7C8A9]">
                  팀 습관 · {memberCount}명
                </span>
                            )}
                            <span
                                className={`px-2.5 py-1 rounded-full font-medium border text-xs ${statusInfo.class}`}
                            >
                {statusInfo.label}
              </span>
                        </div>
                    </div>

                    {/* 콤보 표시 */}
                    <div className="mt-2 flex flex-col items-center gap-1">
                        <span className="text-xs text-[#9B7A63]">연속 달성 콤보</span>
                        <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-[#D07B4A]">
                {habit.combo}
              </span>
                            <span className="text-sm text-[#6D4B36]">일째</span>
                        </div>
                        <p className="text-[11px] text-[#9B7A63] mt-1">
                            내일 또 지키면 <span className="font-semibold">{Number(habit.combo) + 1}</span>일이 돼요!
                        </p>

                        <div className="mt-3 space-y-1 text-xs text-[#6D4B36]">
                            <p>
                                <span className="text-[#9B7A63] mr-1">토끼 입양일</span>
                                {fmt(habit.regDate)}
                            </p>
                        </div>

                    </div>

                    {/* 목표 상세 */}
                    {habit.goalDetail && (
                        <p className="whitespace-pre-line mt-2 text-sm text-[#6B4B37] bg-[#FFF2E0] rounded-2xl px-3 py-2">
                            ✏️ <span className="font-semibold">목표 상세</span>
                            {"\n"}
                            {habit.goalDetail}
                        </p>

                    )}
                </section>

                {/* 3. 초대 코드 (팀일 때만) */}
                {isTeamHabit && (
                    <section className="space-y-3 rounded-3xl bg-white/80 border border-[#F0D4B2] shadow-sm">
                        <InviteCodeCardServer
                            habitId={habit.id}
                            initialInviteCode={habit.inviteCode}
                        />
                    </section>
                )}

                {/* 4. 하단 액션 버튼들 */}
                <section className="mt-2 flex flex-col sm:flex-row flex-wrap items-stretch gap-3">
                    <Link
                        href={`/habits/${habit.id.toString()}/edit`}
                        className="flex-1 px-4 py-2.5 rounded-2xl border border-[#E0B693] bg-white/70 text-sm text-[#5C3B28] hover:bg-[#FFF2E0] transition text-center"
                    >
                        ✏️ 습관 수정하기
                    </Link>

                    <div className="flex-1 w-full px-4 py-2.5 rounded-2xl text-sm font-semibold bg-[#F1C9A5] text-[#4A2F23] border border-[#E0B693] hover:bg-[#E4B88F] transition text-center">
                        <HabitCheckButton
                            habitId={habit.id}
                            action={submitCheckAction}
                        />
                    </div>
                </section>

                <div className="border-t border-[#EBD4BC] pt-4" />

                {/* 5. 통계 섹션들 (모바일 단일 컬럼) */}
                <section className="mt-4 space-y-6">
                    <div className="rounded-3xl bg-white/80 border border-[#F0D4B2] px-4 py-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="font-semibold text-[#4A2F23]">📆 월간 통계</h2>
                            <span className="text-[11px] text-[#9B7A63]">
                이번 달 Rabbit Habit 기록
              </span>
                        </div>
                        <Suspense fallback={<div>통계 로딩 중...</div>}>
                            <MonthlySectionComponent habitId={habit.id} />
                        </Suspense>
                    </div>

                    <div className="rounded-3xl bg-white/80 border border-[#F0D4B2] px-4 py-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="font-semibold text-[#4A2F23]">📈 연간 통계</h2>
                            <span className="text-[11px] text-[#9B7A63]">
                올해 동안의 누적 기록
              </span>
                        </div>
                        <Suspense fallback={<div>통계 로딩 중...</div>}>
                            <AccumulatedStatComponent habitId={habit.id} />
                        </Suspense>
                    </div>
                </section>
            </div>
        </div>
    );
}
