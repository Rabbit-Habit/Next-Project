"use client"

import {useRef, useState, useTransition} from "react";
import ConfirmModal from "@/app/components/modal/confirmModal";

type Props = {
    habitId: string;
    action: (formData: FormData) => Promise<any>;
};

export default function HabitCheckButton({ habitId, action }: Props) {
    const [open, setOpen] = useState(false);
    const [pending, startTransition] = useTransition();
    const formRef = useRef<HTMLFormElement>(null);

    // 모달 확인 클릭 → form.submit()
    const handleConfirm = () => {
        setOpen(false);
        startTransition(() => {
            formRef.current?.requestSubmit();
        });
    };

    return (
        <div className="flex items-center gap-2">
            <form ref={formRef} action={action}>
                <input type="hidden" name="habitId" value={habitId} />
                <button
                    type="button"
                    disabled={pending}
                    onClick={() => setOpen(true)}
                    className="px-3 py-2 rounded-xl border bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                >
                    습관 체크
                </button>
            </form>

            {/* 확인 모달 */}
            <ConfirmModal
                open={open}
                onConfirm={handleConfirm}
                onCancel={() => setOpen(false)}
                title={"습관 체크할까요?"}
                description={"진짜로?"}
            />
        </div>
    );
}