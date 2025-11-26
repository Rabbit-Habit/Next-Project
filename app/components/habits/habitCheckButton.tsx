"use client";

import { useRef, useState, useTransition } from "react";
import ConfirmModal from "@/app/components/modal/confirmModal";
import FailModal from "@/app/components/modal/failModal";

type Props = {
    habitId: string;
    action: (formData: FormData) => Promise<{
        ok: boolean;
        reason?: string;
    }>;
};

export default function HabitCheckButton({ habitId, action }: Props) {
    const [openConfirm, setOpenConfirm] = useState(false);
    const [openFail, setOpenFail] = useState(false);
    const [pending, startTransition] = useTransition();
    const formRef = useRef<HTMLFormElement>(null);

    const handleConfirm = () => {
        setOpenConfirm(false);

        const formData = new FormData(formRef.current!);

        startTransition(async () => {
            const res = await action(formData);

            if (!res.ok && res.reason === "ALREADY_DONE") {
                setOpenFail(true);
            }
        });
    };

    return (
        <div className="flex items-center gap-2">
            <form ref={formRef}>
                <input type="hidden" name="habitId" value={habitId} />
                <button
                    type="button"
                    disabled={pending}
                    onClick={() => setOpenConfirm(true)}
                    className="px-3 py-2 rounded-xl border bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                >
                    습관 체크
                </button>
            </form>

            {/* 확인 모달 */}
            <ConfirmModal
                open={openConfirm}
                onConfirm={handleConfirm}
                onCancel={() => setOpenConfirm(false)}
                title="습관 체크할까요?"
                description="진짜로?"
            />

            {/* 실패 모달 */}
            <FailModal
                open={openFail}
                onClose={() => setOpenFail(false)}
                title="이미 체크했어요"
                description="오늘은 이미 이 습관을 체크했어요 🐰"
            />
        </div>
    );
}
