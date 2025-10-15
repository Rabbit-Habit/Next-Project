"use client";

import { useState, useTransition } from "react";
import {
    createPersonalHabit,
    createTeamHabit,
    joinTeamByInvite,
} from "@/app/habits/add/actions";
import {useRouter} from "next/navigation";
import SuccessModal from "@/app/components/modal/successModal";
import FailModal from "@/app/components/modal/failModal";
import {Button} from "@/components/ui/button";

// 폼 모드: 개인 생성 / 팀 생성 / 초대코드 참여
type Mode = "personal" | "team_create" | "team_join";

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
            // 원하면 토스트/간단 문구 상태로 알려주기
        } catch {
            setOpenFail(true);
        }
    };

    // 메시지
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (locked || pending) return
        setLocked(true)

        setGeneratedInvite(null);

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
                        if ('inviteCode' in res && res.inviteCode) {
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
                setLocked(false)
            }
        });
    };

    const disableSubmit =
        pending || locked ||
        (mode === "personal" && (!title.trim() || !rabbitName.trim())) ||
        (mode === "team_create" && (!teamName.trim() || !title.trim() || !rabbitName.trim())) ||
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
        <>
            {/*팀 코드 생성 모달*/}
            <SuccessModal
                open={openInviteModal}
                onClose={() => {
                    setOpenInviteModal(false);
                    router.push("/habits");
                }}
                title="팀 생성 완료!"
                description={
                    <div className="space-y-3">
                        아래 초대코드를 팀원과 공유하세요.
                        <div className="flex items-center gap-2 bg-gray-50 border rounded-xl px-3 py-2">
                            <span className="font-mono">{generatedInvite}</span>
                            <Button
                                type="button"
                                onClick={copyInviteInModal}
                                className="ml-auto"
                            >
                                복사
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
                description="습관이 성공적으로 추가되었습니다."
            />

            {/*실패 모달*/}
            <FailModal
                open={openFail}
                onClose={() => setOpenFail(false)}
                title="실패"
                description="저장 중 문제가 발생했습니다."
            />

            <form onSubmit={onSubmit} className="space-y-6">
                {/* 탭 */}
                <div className="grid grid-cols-3 gap-2">
                    {["personal", "team_create", "team_join"].map((m) => (
                        <button
                            key={m}
                            type="button"
                            onClick={() => setMode(m as Mode)}
                            className={`py-2 rounded-xl border transition ${
                                mode === m ? "bg-black text-white" : "bg-white hover:bg-gray-50"
                            }`}
                        >
                            {m === "personal" ? "개인 습관" : m === "team_create" ? "팀 습관 생성" : "초대코드 참여"}
                        </button>
                    ))}
                </div>

                {/* 공통 입력: 개인/팀 생성 */}
                {mode !== "team_join" && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium">제목</label>
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full border rounded-xl px-3 py-2"
                                placeholder="예) 물 2L 마시기"
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium">토끼 이름</label>
                            <input
                                value={rabbitName}
                                onChange={(e) => setRabbitName(e.target.value)}
                                className="w-full border rounded-xl px-3 py-2"
                                placeholder="예) 토벅이"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium">목표 상세 (선택)</label>
                            <input
                                value={goalDetail}
                                onChange={(e) => setGoalDetail(e.target.value)}
                                className="w-full border rounded-xl px-3 py-2"
                                placeholder="예) 오전 500ml / 오후 500ml / 저녁 1L"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium">목표 횟수 (선택)</label>
                            <input
                                type="number"
                                min={1}
                                value={goalCount}
                                onChange={(e) => setGoalCount(e.target.value)}
                                className="w-full border rounded-xl px-3 py-2"
                                placeholder="예) 3"
                            />
                        </div>
                    </div>
                )}

                {/* 팀 생성 전용 입력 */}
                {mode === "team_create" && (
                    <div className="space-y-2">
                        <label className="block text-sm font-medium">팀 이름</label>
                        <input
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            className="w-full border rounded-xl px-3 py-2"
                            placeholder="예) 아침독서-5인팀"
                        />

                        <label className="inline-flex items-center gap-2 text-sm mt-2">
                            <input
                                type="checkbox"
                                checked={autoInvite}
                                onChange={(e) => setAutoInvite(e.target.checked)}
                            />
                            생성 시 초대코드 만들기
                        </label>
                    </div>
                )}

                {/* 초대코드 참여 전용 입력 */}
                {mode === "team_join" && (
                    <div className="space-y-2">
                        <label className="block text-sm font-medium">초대코드</label>
                        <input
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value)}
                            className="w-full border rounded-xl px-3 py-2"
                            placeholder="예) RH-ABCD-1234"
                        />
                        <p className="text-xs text-gray-500">초대받은 경우 코드를 입력하면 팀에 합류합니다.</p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={disableSubmit}
                    className="w-full py-3 rounded-xl font-semibold border bg-black text-white disabled:opacity-50"
                >
                    {pending ? "처리 중…" : mode === "team_join" ? "팀 참여하기" : "저장하기"}
                </button>

                {message && <p className="text-green-600">{message}</p>}
                {error && <p className="text-red-600">{error}</p>}
            </form>
        </>
    );
}