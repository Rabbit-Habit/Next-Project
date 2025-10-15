// RabbitStatusModal.tsx (새 파일)
"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import React from "react";

interface RabbitStatusModalProps {
    open: boolean;
    onClose: () => void;
    rabbitName: string | null;
    rabbitStatus: string;
    combo: bigint | null;
}

function RabbitStatusModal({ open, onClose, rabbitName, rabbitStatus, combo }: RabbitStatusModalProps) {
    const formattedCombo = combo?.toString() || '0'

    return (
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
                    <Button
                        onClick={onClose}
                        className="bg-pink-400 text-white text-md py-5 font-semibold rounded-xl"
                    >
                        토끼 밥주기
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default RabbitStatusModal