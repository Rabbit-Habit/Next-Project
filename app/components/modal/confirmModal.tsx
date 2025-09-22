"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmModalProps {
    open: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    title: string;
    description: string | React.ReactNode;
}

function ConfirmModal({ open, onConfirm, onCancel, title, description }: ConfirmModalProps) {
    return (
        <Dialog open={open} onOpenChange={onCancel}>
            <DialogContent className="sm:max-w-md rounded-2xl shadow-lg bg-white border border-gray-200 animate-fade-in">
                <DialogHeader className="flex flex-col items-center gap-4">
                    {/* 경고 또는 확인 아이콘 */}
                    <div className="text-4xl">⚠️</div>

                    <DialogTitle className="text-pink-500 text-xl font-bold text-center">
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-gray-700 text-md text-center whitespace-pre-line">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="flex flex-row justify-center gap-4 mt-4">
                    <Button
                        onClick={onCancel}
                        className="bg-gray-200 text-gray-700 text-md py-2 px-6 font-semibold rounded-xl flex-1"
                    >
                        아니오
                    </Button>
                    <Button
                        onClick={onConfirm}
                        className="bg-pink-400 text-white text-md py-2 px-6 font-semibold rounded-xl flex-1"
                    >
                        네
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default ConfirmModal