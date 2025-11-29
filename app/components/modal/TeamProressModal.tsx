"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface TeamProgressModalProps {
    open: boolean;
    onClose: () => void;
    count: number;
    goal: number;
}

export default function TeamProgressModal({ open, onClose, count, goal }:TeamProgressModalProps) {
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="rounded-2xl bg-white border border-[#E0B693]">
                <DialogHeader>
                    <div className="text-4xl text-center">🥕</div>
                    <DialogTitle className="text-center text-[#4A2F23]">
                        팀 체크 완료!
                    </DialogTitle>

                    <DialogDescription className="text-center text-[#9B7A63] whitespace-pre-line">
                        {`현재 ${count}/${goal}명이 체크했어요!\n목표까지 ${goal - count}명 남았어요 🐰💪`}
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="flex justify-center">
                    <Button
                        onClick={() => onClose()}
                        className="bg-[#F1C9A5] text-[#4A2F23] border border-[#E0B693] rounded-xl"
                    >
                        확인
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
