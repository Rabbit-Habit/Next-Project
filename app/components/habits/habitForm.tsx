"use client";

import React from "react";
import { useState, useTransition } from "react";
import {
    createPersonalHabit,
    createTeamHabit,
    joinTeamByInvite,
} from "@/app/habits/add/actions";
import { useRouter } from "next/navigation";
import SuccessModal from "@/app/components/modal/successModal";
import FailModal from "@/app/components/modal/failModal";
import { Button } from "@/components/ui/button";

// 폼 모드: 개인 생성 / 팀 생성 / 초대코드 참여
type Mode = "personal" | "team_create" | "team_join";

const commonInputBase =
    "w-full px-3 py-2 rounded-2xl border border-[#F0D4B2]/80 text-sm sm:text-sm outline-none";
const editableInput =
    "bg-white/90 border-[#F0D4B2] focus:ring-2 focus:ring-[#F1C9A5] focus:border-transparent";
const readonlyInput =
    "bg-[#F3E5D0] border-transparent text-[#9B7A63] cursor-not-allowed";

export default function HabitForm() {
    const [mode, setMode] = useState<Mode>("personal");
    const [pending, startTransition] = useTransition();
    // 락 걸기(더블 클릭시 2번 추가되는거 방지)
    const [locked, setLocked] = useState(false);

    // 공통(개인 & 팀 생성)
    const [title, setTitle] = useState("");
    const [rabbitName, setRabbitName] = useState("");
    const [goalDetail, setGoalDetail] = useState("");
    const [goalCount, setGoalCount] = useState<string>("");

    // 팀 생성 전용
    const [teamName, setTeamName] = useState("");
    const [autoInvite, setAutoInvite] = useState(true);
    const [generatedInvite, setGeneratedInvite] = useState<string | null>(null);

    // 팀 참여 전용
    const [inviteCode, setInviteCode] = useState("");

    // 모달
    const router = useRouter();
    const [openSuccess, setOpenSuccess] = useState(false);
    const [openFail, setOpenFail] = useState(false);
    const [openInviteModal, setOpenInviteModal] = useState(false);

    const copyInviteInModal = async () => {
        if (!generatedInvite) return;
        try {
            await navigator.clipboard.writeText(generatedInvite);
        } catch {
            setOpenFail(true);
        }
    };

    // 메시지
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (locked || pending) return;
        setLocked(true);

        setGeneratedInvite(null);
        setMessage(null);
        setError(null);

        startTransition(async () => {
            try {
                if (mode === "personal") {
                    const res = await createPersonalHabit({
                        title,
                        rabbitName,
                        goalDetail: goalDetail || null,
                        goalCount: goalCount ? Number(goalCount) : undefined,
                    });
                    if (res.ok) {
                        setOpenSuccess(true);
                    } else {
                        setOpenFail(true);
                    }
                } else if (mode === "team_create") {
                    const res = await createTeamHabit({
                        teamName,
                        title,
                        rabbitName,
                        goalDetail: goalDetail || null,
                        goalCount: goalCount ? Number(goalCount) : undefined,
                        generateInvite: autoInvite,
                    });
                    if (res.ok) {
                        if ("inviteCode" in res && res.inviteCode) {
                            setGeneratedInvite(res.inviteCode);
                            setOpenInviteModal(true);
                        } else {
                            setOpenSuccess(true);
                        }
                    } else {
                        setOpenFail(true);
                    }
                } else if (mode === "team_join") {
                    const res = await joinTeamByInvite({ inviteCode });
                    if (res.ok) {
                        setOpenSuccess(true);
                    } else {
                        setOpenFail(true);
                    }
                }
            } catch (err: any) {
                setError(err?.message || "알 수 없는 오류가 발생했어요.");
            } finally {
                setLocked(false);
            }
        });
    };

    const disableSubmit =
        pending ||
        locked ||
        (mode === "personal" && (!title.trim() || !rabbitName.trim())) ||
        (mode === "team_create" &&
            (!teamName.trim() || !title.trim() || !rabbitName.trim())) ||
        (mode === "team_join" && !inviteCode.trim());

    const copyInvite = async () => {
        if (!generatedInvite) return;
        try {
            await navigator.clipboard.writeText(generatedInvite);
            setMessage("초대코드가 클립보드에 복사되었습니다.");
        } catch {
            setError("클립보드 복사에 실패했어요. 수동으로 복사해주세요.");
        }
    };

    return (
        <div
            className="
                w-full min-h-screen
                bg-gradient-to-b from-[#FFF5E6] via-[#FAE8CA] to-[#F5D7B0]
                flex justify-center items-start
                px-4 py-8
            "
        >
            <div className="w-full max-w-md">
                {/*팀 코드 생성 모달*/}
                <SuccessModal
                    open={openInviteModal}
                    onClose={() => {
                        setOpenInviteModal(false);
                        router.push("/habits");
                    }}
                    title="팀 생성 완료!"
                    description={
                        <div className="space-y-3 text-sm">
                            <p>아래 초대코드를 팀원과 공유해 함께 토끼를 키워보세요 🐰🤎</p>
                            <div className="flex items-center gap-2 bg-[#FDF4E3] border border-[#E5C9A6] rounded-xl px-3 py-2">
                                <span className="font-mono text-xs text-[#5C3B28]">
                                    {generatedInvite}
                                </span>
                                <Button
                                    type="button"
                                    onClick={copyInviteInModal}
                                    className="ml-auto bg-[#F1C9A5] hover:bg-[#E4B88F] text-[#4A2F23] rounded-lg px-3 py-1 text-xs"
                                >
                                    코드 복사
                                </Button>
                            </div>
                        </div>
                    }
                />

                {/*일반 성공 모달*/}
                <SuccessModal
                    open={openSuccess}
                    onClose={() => {
                        setOpenSuccess(false);
                        router.push("/habits"); // ✅ 저장 후 목록으로 이동
                    }}
                    title="저장 완료!"
                    description="새로운 토끼가 농장에 입장했어요 🐇✨"
                />

                {/*실패 모달*/}
                <FailModal
                    open={openFail}
                    onClose={() => setOpenFail(false)}
                    title="실패"
                    description="저장 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요."
                />

                {/* 카드 래퍼  */}
                <form
                    onSubmit={onSubmit}
                    className="
                        mt-2 w-full
                        rounded-3xl border border-[#F0D4B2]
                        bg-gradient-to-b from-[#FFF9F1] to-[#F7E4CC]
                        shadow-md px-6 py-7 space-y-6
                    "
                >
                    {/* 상단 타이틀 + 설명 */}
                    <div className="space-y-1 text-center">
                        <h2 className="text-lg font-bold text-[#4A2F23]">
                            🐰 Rabbit Habit
                        </h2>
                        <p className="text-xs text-[#7A5A46]">
                            개인 / 팀 / 초대코드 중 하나를 골라
                            <br />
                            나만의 토끼를 입양해 보세요!
                        </p>
                    </div>

                    {/* 탭 영역  */}
                    <div
                        className="
                            grid grid-cols-3
                            rounded-2xl overflow-hidden
                            border border-[#F0D4B2]
                            bg-[#FBE4CF]
                            text-[11px] sm:text-xs
                        "
                    >
                        {/* 개인 습관 */}
                        <button
                            type="button"
                            onClick={() => setMode("personal")}
                            className={`
                                py-3 px-2 text-center relative isolate transition-all duration-300
                                ${
                                mode === "personal"
                                    ? "bg-[#FFF9F1] text-[#4A2F23]] shadow-inner cursor-default"
                                    : "text-[#8C6A54] hover:bg-[#F7DFC7] hover:text-[#4A2F23]"
                            }
                            `}
                        >
                            🐰 개인 습관
                        </button>

                        {/* 팀 습관 생성 */}
                        <button
                            type="button"
                            onClick={() => setMode("team_create")}
                            className={`
                                py-3 px-2 text-center relative isolate transition-all duration-300
                                border-x border-[#E7C8A9]
                                ${
                                mode === "team_create"
                                    ? "bg-[#FFF9F1] text-[#4A2F23] shadow-inner cursor-default"
                                    : "text-[#8C6A54] hover:bg-[#F7DFC7] hover:text-[#4A2F23]"
                            }
                            `}
                        >
                            👯 팀 습관
                        </button>

                        {/* 초대코드 참여 */}
                        <button
                            type="button"
                            onClick={() => setMode("team_join")}
                            className={`
                                py-3 px-2 text-center relative isolate transition-all duration-300
                                ${
                                mode === "team_join"
                                    ? "bg-[#FFF9F1] text-[#4A2F23] shadow-inner cursor-default"
                                    : "text-[#8C6A54] hover:bg-[#F7DFC7] hover:text-[#4A2F23]"
                            }
                            `}
                        >
                            🔑 초대코드
                        </button>
                    </div>

                    {/* 공통 입력: 개인/팀 생성 */}
                    {mode !== "team_join" && (
                        <div className="space-y-4 rounded-2xl bg-[#FFF7EC] px-4 py-4 border border-[#F0D4B2]/60">
                            <div className="space-y-1">
                                <label className="block text-xs font-semibold text-[#5C3B28]">
                                    제목
                                </label>
                                <input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className={`${commonInputBase} ${editableInput}`}
                                    placeholder="예) 물 2L 마시기 💧"
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs font-semibold text-[#5C3B28]">
                                    토끼 이름
                                </label>
                                <input
                                    value={rabbitName}
                                    onChange={(e) => setRabbitName(e.target.value)}
                                    className={`${commonInputBase} ${editableInput}`}
                                    placeholder="예) 토벅이 🐇"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs font-semibold text-[#5C3B28]">
                                    목표 상세 (선택)
                                </label>
                                <p className="text-[10px] text-[#9B7A63] mt-0.5">
                                    언제, 어떻게 등 목표에 대해 자세히 기록해보세요.
                                </p>
                                <textarea
                                    value={goalDetail}
                                    onChange={(e) => setGoalDetail(e.target.value)}
                                    className={`
                                    ${commonInputBase} ${editableInput}
                                        min-h-[70px]    // 기본 약 3줄
                                        max-h-[200px]   // 너무 커지지 않도록 제한(optional)
                                        resize-none     // 사용자가 크기 조절 못하게 (optional)
                                        overflow-auto   // 내용 많아지면 스크롤
                                        leading-5
                                    `}
                                />
                            </div>
                        </div>
                    )}

                    {/* 팀 생성 전용 입력 */}
                    {mode === "team_create" && (
                        <div className="space-y-3 rounded-2xl bg-[#FBEAD4] px-4 py-4 border border-[#E7C8A9]">
                            <div className="space-y-1">
                                <label className="block text-xs font-semibold text-[#5C3B28]">
                                    목표 인원
                                </label>
                                <p className="text-[10px] text-[#9B7A63] mt-0.5">
                                    목표를 달성할 최소 인원을 입력해주세요.
                                </p>
                                <input
                                    type="number"
                                    min={1}
                                    value={goalCount}
                                    onChange={(e) => setGoalCount(e.target.value)}
                                    className={`${commonInputBase} ${editableInput}`}
                                    placeholder="예) 3"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs font-semibold text-[#5C3B28]">
                                    팀 이름
                                </label>
                                <input
                                    value={teamName}
                                    onChange={(e) => setTeamName(e.target.value)}
                                    className={`${commonInputBase} ${editableInput}`}
                                    placeholder="예) 아침독서 5인팀 📚"
                                />
                            </div>

                            <label className="inline-flex items-center gap-2 text-xs mt-1 text-[#6D4B36]">
                                <input
                                    type="checkbox"
                                    checked={autoInvite}
                                    onChange={(e) => setAutoInvite(e.target.checked)}
                                    className="rounded border-[#E0B58C] text-[#D07B4A] focus:ring-[#F1C9A5]"
                                />
                                <span>생성 시 초대코드 같이 만들기</span>
                            </label>

                            {generatedInvite && (
                                <div className="mt-2 text-xs text-[#6D4B36] space-y-1">
                                    <p>생성된 초대코드</p>
                                    <div className="flex items-center gap-2 bg-[#FFF7EC] rounded-xl px-3 py-2 border border-[#F0D4B2]">
                                        <span className="font-mono text-xs">
                                            {generatedInvite}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={copyInvite}
                                            className="ml-auto text-[11px] px-2 py-1 rounded-lg bg-[#F1C9A5] hover:bg-[#E4B88F] text-[#4A2F23]"
                                        >
                                            코드 복사
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 초대코드 참여 전용 입력 */}
                    {mode === "team_join" && (
                        <div className="space-y-2 rounded-2xl bg-[#FBEAD4] px-4 py-4 border border-[#E7C8A9]">
                            <label className="block text-xs font-semibold text-[#5C3B28]">
                                초대코드
                            </label>
                            <input
                                value={inviteCode}
                                onChange={(e) => setInviteCode(e.target.value)}
                                className={`${commonInputBase} ${editableInput} tracking-widest font-mono`}
                                placeholder="예) RH-ABCD-1234"
                            />
                            <p className="text-[10px] text-[#9B7A63]">
                                친구에게 받은 초대코드를 입력하면 같은 토끼 농장에서 함께 습관을 키울 수 있어요 🤝
                            </p>
                        </div>
                    )}

                    {/* 제출 버튼 */}
                    <Button
                        type="submit"
                        disabled={disableSubmit}
                        className={`
                            w-full py-3 rounded-2xl text-sm font-semibold shadow-sm border border-[#E0B693]/60
                            ${
                            disableSubmit
                                ? "bg-[#F3DEC6] text-[#B39A82] cursor-not-allowed"
                                : "bg-[#F1C9A5] hover:bg-[#E4B88F] text-[#4A2F23]"
                        }
                        `}
                    >
                        {pending
                            ? "토끼 준비 중… 🥕"
                            : mode === "team_join"
                                ? "팀 참여하기"
                                : "토끼 입양하기"}
                    </Button>

                    {message && (
                        <p className="text-xs text-green-700 text-center">{message}</p>
                    )}
                    {error && (
                        <p className="text-xs text-red-600 text-center">{error}</p>
                    )}
                </form>
            </div>
        </div>
    );
}
