"use client"

import Link from "next/link";
import Header from "@/app/components/common/header";
import WeeklyStampComponent from "@/app/components/stat/WeeklyStampComponent";
import {useEffect, useRef, useState} from "react";

type Item = {
    id: string;
    title: string;
    rabbitName: string;
    rabbitStatus: "alive" | "hungry" | "escaped";
    goalDetail: string | null;
    teamName: string | null;
    regDate: string | null;
    isTeamHabit: boolean;
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

export default function HabitsList({ initialItems }: { initialItems: Item[] }) {

    const [items, setItems] = useState(initialItems);
    const [cursor, setCursor] = useState(
        initialItems.length > 0 ? initialItems[initialItems.length - 1].id : null
    );
    const [sort, setSort] = useState<SortType>("recent");
    const [showSort, setShowSort] = useState(false)
    const [activeTab, setActiveTab] = useState<"personal" | "team">("personal");
    const loaderRef = useRef(null);
    const [loading, setLoading] = useState(false)

    // 무한 스크롤 감지
    useEffect(() => {
        if (!loaderRef.current) return;

        const observer = new IntersectionObserver(
            async (entries) => {
                if (entries[0].isIntersecting && cursor && !loading) {
                    setLoading(true);

                    const res = await fetch(
                        `/api/habits/list?cursor=${cursor}&sort=${sort}&limit=5`
                    );
                    const data = await res.json();

                    setItems((prev) => [...prev, ...data.items]);
                    setCursor(data.nextCursor);
                    setLoading(false);
                }
            },
            { threshold: 1.0 }
        );

        observer.observe(loaderRef.current);

        return () => observer.disconnect();
    }, [cursor, sort, loading]);

    // 정렬 옵션 변경 시 초기화
    type SortType = "recent" | "title" | "rabbit";

    const handleSortChange = async (value: SortType) => {
        setSort(value);

        const res = await fetch(`/api/habits/list?sort=${value}&limit=5`);
        const data = await res.json();

        setItems(data.items);
        setCursor(data.nextCursor);
    };

    const filtered = items.filter((i) =>
        activeTab === "team" ? i.isTeamHabit : !i.isTeamHabit
    );

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#FFF5E6] via-[#FAE8CA] to-[#F5D7B0]">
            <Header title="습관 목록" />

            <div className=" mx-auto px-4 py-6 space-y-5">
                <div>
                    <Link
                        href="/habits/add"
                        className="w-full flex items-center justify-center px-4 py-3 rounded-2xl border border-[#E0B693] bg-[#F1C9A5] text-sm font-semibold text-[#4A2F23] hover:bg-[#E4B88F] transition shadow-sm"
                    >
                        🐰 새 토끼 입양하기
                    </Link>
                </div>

                <div className="flex items-center justify-between mt-4 px-1 gap-3">
                    {/*  정렬 드롭다운 버튼 */}
                    <div className="relative">
                        {/* 동그라미 버튼 */}
                        <button
                            onClick={() => setShowSort((prev) => !prev)}
                            className={
                                "h-10 rounded-full flex items-center text-xl border transition " +
                                (showSort
                                    ? "bg-[#FFF9F1] border-[#E0B693] shadow-sm"
                                    : "bg-[#FFF9F1] border-gray-300 text-gray-500")
                            }
                        >
                            <span className="text-[15px] mt-[2px] ml-[10px] mr-[5px] opacity-70">▼</span>
                            <span className="mr-[10px]">
                                {sort === "recent" && "🕒"}
                                {sort === "title" && "🔤"}
                                {sort === "rabbit" && "🐰"}
                            </span>

                        </button>

                        {/* 드롭다운 메뉴 */}
                        {showSort && (
                            <div className="absolute mt-2 w-38 bg-white rounded-xl shadow-lg border border-[#E0B693] z-50">
                                <button
                                    className="w-full text-left flex gap-2 p-3 hover:bg-[#FFF3E4] rounded-t-xl"
                                    onClick={() => {
                                        handleSortChange("recent");
                                        setShowSort(false);
                                    }}
                                >
                                    🕒 최근 생성 순
                                </button>
                                <button
                                    className="w-full text-left flex gap-2 p-3 hover:bg-[#FFF3E4]"
                                    onClick={() => {
                                        handleSortChange("title");
                                        setShowSort(false);
                                    }}
                                >
                                    🔤 습관 이름 순
                                </button>
                                <button
                                    className="w-full text-left flex gap-2 p-3 hover:bg-[#FFF3E4] rounded-b-xl"
                                    onClick={() => {
                                        handleSortChange("rabbit");
                                        setShowSort(false);
                                    }}
                                >
                                    🐰 토끼 이름 순
                                </button>
                            </div>
                        )}
                    </div>

                    {/* ✅ 탭 영역 */}
                    <div className="flex rounded-3xl bg-[#FBE4CF] p-1 gap-1 flex-1 ">
                        <button
                            type="button"
                            onClick={() => setActiveTab("personal")}
                            className={
                                "flex-1 py-2 rounded-2xl text-sm font-semibold transition " +
                                (activeTab === "personal"
                                    ? "bg-[#FFF9F1] text-[#4A2F23] shadow-sm"
                                    : "text-[#9B7A63]")
                            }
                        >
                            개인
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("team")}
                            className={
                                "flex-1 py-2 rounded-2xl text-sm font-semibold transition " +
                                (activeTab === "team"
                                    ? "bg-[#FFF9F1] text-[#4A2F23] shadow-sm"
                                    : "text-[#9B7A63]")
                            }
                        >
                            팀
                        </button>
                    </div>
                </div>

                {/* 리스트 / 비어있을 때 문구 */}
                {filtered.length === 0 ? (
                    <div className="mt-4 rounded-3xl bg-[#FFF9F1] border border-[#F0D4B2] px-5 py-6 shadow-sm text-sm text-[#6D4B36]">
                        {activeTab === "personal" ? (
                            <>
                                <p className="mb-2">아직 등록된 개인 습관이 없어요 🐰</p>
                                <p>아래 버튼을 눌러 첫 번째 토끼를 입양해보세요!</p>
                            </>
                        ) : (
                            <>
                                <p className="mb-2">아직 참여 중인 팀 습관이 없어요 🐰</p>
                                <p>팀을 만들거나 초대코드로 참여해보세요!</p>
                            </>
                        )}
                    </div>
                ) : (
                    <ul className="mt-2 space-y-4">
                        {filtered.map((h) => (
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
                                            {h.isTeamHabit && (
                                                <div className="text-xs text-[#9B7A63]">
                                                    👥 {h.teamName}
                                                </div>
                                            )}
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

                {/* 무한 스크롤 트리거 */}
                <div ref={loaderRef} className="h-10"></div>

                {loading && <p className="text-center">로딩중...</p>}

            </div>
        </div>
    );
}
