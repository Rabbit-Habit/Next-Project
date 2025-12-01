"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface PaginationProps {
    page: number;
    totalPages: number;
    type: "personal" | "team"; // 어떤 탭인지 구분
}

export default function Pagination({ page, totalPages, type }: PaginationProps) {
    const searchParams = useSearchParams();

    // 현재 URL에 있는 기존 페이지 값 유지
    const currentPersonalPage = Number(searchParams.get("pagePersonal") ?? "1");
    const currentTeamPage = Number(searchParams.get("pageTeam") ?? "1");

    // 이번에 바꿀 페이지를 기준으로 URL 생성
    const buildUrl = (targetPage: number) => {
        // 1 ~ totalPages 범위로 보정
        const clamped = Math.max(1, Math.min(targetPage, totalPages));

        const personalPage = type === "personal" ? clamped : currentPersonalPage;
        const teamPage = type === "team" ? clamped : currentTeamPage;

        return `/habits?pagePersonal=${personalPage}&pageTeam=${teamPage}`;
    };

    const prevUrl = buildUrl(page - 1);
    const nextUrl = buildUrl(page + 1);

    return (
        <nav aria-label="Page navigation example" className="mt-6 flex justify-center">
            <div className="inline-flex rounded-base shadow-xs -space-x-px" role="group">

                {/* 이전 버튼 */}
                <Link
                    href={prevUrl}
                    className="inline-flex items-center justify-center text-[#4A2F23] bg-[#FFF9F1] border border-[#F0D4B2] rounded-l-md leading-5 w-9 h-9"
                    aria-label="Previous page"
                >
                    <svg className="w-4 h-4" aria-hidden="true"
                         xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                         fill="none" viewBox="0 0 24 24">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"
                              strokeWidth="2" d="m15 19-7-7 7-7" />
                    </svg>
                </Link>

                {/* 페이지 표시 */}
                <span
                    className="inline-flex shrink-0 text-sm items-center justify-center text-[#4A2F23] bg-[#FFF9F1] border border-[#F0D4B2] leading-5 px-3 h-9 select-none"
                >
                    {page} of {totalPages}
                </span>

                {/* 다음 버튼 */}
                <Link
                    href={nextUrl}
                    className="inline-flex items-center justify-center text-[#4A2F23] bg-[#FFF9F1] border border-[#F0D4B2] rounded-r-md box-border leading-5 w-9 h-9"
                    aria-label="Next page"
                >
                    <svg className="w-4 h-4" aria-hidden="true"
                         xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                         fill="none" viewBox="0 0 24 24">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"
                              strokeWidth="2" d="m9 5 7 7-7 7" />
                    </svg>
                </Link>

            </div>
        </nav>
    );
}
