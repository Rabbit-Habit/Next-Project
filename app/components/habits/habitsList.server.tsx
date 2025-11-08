import Link from "next/link";
import Header from "@/app/components/common/header";
import WeeklyStampComponent from "@/app/components/stat/WeeklyStampComponent";

type Item = {
    id: string;
    title: string;
    rabbitName: string;
    rabbitStatus: "alive" | "hungry" | "escaped";
    goalDetail: string | null;
    teamName: string | null;
    regDate: string | null;
};

function statusClass(s: Item["rabbitStatus"]) {
    switch (s) {
        case "alive":
            return "bg-emerald-50 text-emerald-700 border-emerald-200";
        case "hungry":
            return "bg-amber-50 text-amber-800 border-amber-200";
        default:
            return "bg-rose-50 text-rose-700 border-rose-200";
    }
}

function statusLabel(s: Item["rabbitStatus"]) {
    switch (s) {
        case "alive":
            return "행복한 토끼 🥕";
        case "hungry":
            return "배고픈 상태 😢";
        default:
            return "탈출 ☠️";
    }
}

export default function HabitsList({ items }: { items: Item[] }) {
    return (
        <div className="min-h-screen bg-gradient-to-b from-[#FFF5E6] via-[#FAE8CA] to-[#F5D7B0]">
            <Header title="습관 목록" />
            <div className="max-w-3xl mx-auto px-4 py-3 space-y-6">
                {items.length === 0 ? (
                    <div className="mt-4 rounded-3xl bg-[#FFF9F1] border border-[#F0D4B2] px-5 py-6 shadow-sm text-sm text-[#6D4B36]">
                        <p className="mb-2">아직 등록된 습관이 없어요 🐰</p>
                        <p>
                            아래 버튼을 눌러 첫 번째 토끼를 입양해보세요!
                        </p>
                    </div>
                ) : (
                    <ul className="mt-2 space-y-4">
                        {items.map((h) => (
                            <li key={h.id}>
                                <Link
                                    href={`/habits/${h.id}`}
                                    className="block rounded-3xl bg-[#FFF9F1] border border-[#F0D4B2] px-4 py-4 shadow-sm hover:shadow-md hover:bg-[#FFF3E4] transition"
                                >
                                    {/* 상단: 제목 + 상태 */}
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-1">
                                            <div className="font-semibold text-[#4A2F23]">
                                                {h.title}
                                            </div>
                                            <div className="text-xs text-[#9B7A63]">
                                                🐰 {h.rabbitName}
                                            </div>
                                        </div>

                                        <span
                                            className={`px-3 py-1 rounded-full text-[11px] font-medium border ${statusClass(
                                                h.rabbitStatus
                                            )}`}
                                        >
                      {statusLabel(h.rabbitStatus)}
                    </span>
                                    </div>

                                    {/* 이번 주 달성 스탬프 */}
                                    <div className="mt-3">
                                        <WeeklyStampComponent habitId={h.id} />
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}

                {/* 하단 CTA */}
                <div>
                    <Link
                        href="/habits/add"
                        className="w-full flex items-center justify-center px-4 py-3 rounded-2xl border border-[#E0B693] bg-[#F1C9A5] text-sm font-semibold text-[#4A2F23] hover:bg-[#E4B88F] transition shadow-sm"
                    >
                        🐰 새 토끼 입양하기
                    </Link>
                </div>
            </div>
        </div>
    );
}
