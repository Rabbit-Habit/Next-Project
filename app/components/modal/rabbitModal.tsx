"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import React, {useRef, useState, useTransition} from "react";
import {habitCheckAction} from "@/app/main/[habitId]/actions";
import ConfirmModal from "@/app/components/modal/confirmModal";

interface RabbitStatusModalProps {
    open: boolean;
    onClose: () => void;
    rabbitName: string | null;
    rabbitStatus: string;
    combo: bigint | null;
    habitId: string;
}

function RabbitStatusModal({ open, onClose, rabbitName, rabbitStatus, combo, habitId }: RabbitStatusModalProps) {
    const formattedCombo = combo?.toString() || '0'

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pending, startTransition] = useTransition();
    const formRef = useRef<HTMLFormElement>(null);

    const handleConfirm = () => {
        setConfirmOpen(false)
        startTransition(() => {
            formRef.current?.requestSubmit()
            onClose()
        })
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-md rounded-2xl shadow-lg bg-white border border-pink-200 animate-fade-in">
                    <DialogHeader className="flex flex-col items-center gap-4">
                        {/* 토끼 아이콘 사용 */}
                        <div className="text-4xl">🐰</div>

                        <DialogTitle className="text-pink-500 text-xl font-bold text-center">
                            토끼 상태 정보
                        </DialogTitle>
                        <DialogDescription className="text-gray-700 text-md text-center whitespace-pre-line">
                            <>
                                <strong>이름:</strong> {rabbitName || '토끼'}<br />
                                <strong>현재 콤보:</strong> {formattedCombo}일<br/>
                                <strong>상태:</strong> {rabbitStatus}
                            </>
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="flex justify-center mt-4">
                        <form ref={formRef} action={habitCheckAction} className="w-full flex justify-center">
                            <input type="hidden" name="habitId" value={habitId} />

                            <Button
                                type="button"
                                disabled={pending}
                                onClick={() => setConfirmOpen(true)}
                                className="w-full bg-pink-400 text-white text-md py-5 font-semibold rounded-xl"
                            >
                                토끼 밥주기
                            </Button>
                        </form>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 밥주기 확인 모달 */}
            <ConfirmModal
                open={confirmOpen}
                onConfirm={handleConfirm}
                onCancel={() => setConfirmOpen(false)}
                title="토끼에게 밥을 줄까요?"
                description="오늘 하루 체크로 기록됩니다."
            />
        </>
    )
}

export default RabbitStatusModal