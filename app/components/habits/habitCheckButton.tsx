"use client";

import { useRef, useState, useTransition } from "react";
import ConfirmModal from "@/app/components/modal/confirmModal";
import FailModal from "@/app/components/modal/failModal";
import TeamProgressModal from "@/app/components/modal/TeamProressModal";

type Props = {
    habitId: string;
    action: (formData: FormData) => Promise<{
        ok: boolean;
        error?: string;
        completed?: boolean;
        count?: number;
        goal?: number;
    }>;
};

export default function HabitCheckButton({ habitId, action }: Props) {
    const [openConfirm, setOpenConfirm] = useState(false);
    const [openFail, setOpenFail] = useState(false);
    const [pending, startTransition] = useTransition();
    const formRef = useRef<HTMLFormElement>(null);

    const [teamProgress, setTeamProgress] = useState<{
        open: boolean;
        count: number;
        goal: number;
    } | null>(null);

    const handleConfirm = () => {
        setOpenConfirm(false);

        const formData = new FormData(formRef.current!);

        startTransition(async () => {
            const res = await action(formData);

            if (!res.ok && res.error === "ALREADY_DONE") {
                setOpenFail(true);
            }

            if (res.ok && res.completed === false) {
                setTeamProgress({
                    open: true,
                    count: res.count!,
                    goal: res.goal!,
                });
                return;
            }
        });
    };

    return (
        <div>
            <form ref={formRef}>
                <input type="hidden" name="habitId" value={habitId} />
                <button
                    type="button"
                    disabled={pending}
                    onClick={() => setOpenConfirm(true)}
                    // className="w-full px-4 py-2.5 rounded-2xl text-sm font-semibold bg-[#F1C9A5] text-[#4A2F23] border border-[#E0B693] hover:bg-[#E4B88F] transition"
                >
                    🥕 오늘 습관 체크
                </button>
            </form>

            {/* 확인 모달 */}
            <ConfirmModal
                open={openConfirm}
                onConfirm={handleConfirm}
                onOpenChange={() => setOpenConfirm(false)}
                title="습관 체크할까요?"
                description="진짜로?"
            />

            {/* 실패 모달 */}
            <FailModal
                open={openFail}
                onOpenChange={() => setOpenFail(false)}
                title="이미 체크했어요"
                description="오늘은 이미 이 습관을 체크했어요 🐰"
            />

            {teamProgress?.open && (
                <TeamProgressModal
                    open={teamProgress.open}
                    onClose={() => setTeamProgress(null)}
                    count={teamProgress.count}
                    goal={teamProgress.goal}
                />
            )}
        </div>
    );
}
