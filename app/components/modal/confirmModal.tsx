"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;   // 변경
    onConfirm: () => void;
    title: string;
    description: string | React.ReactNode;
    isPending?: boolean;
}

function ConfirmModal({ open, onOpenChange, onConfirm, title, description, isPending }: ConfirmModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md rounded-2xl shadow-lg bg-white border border-gray-200 animate-fade-in">
                <DialogHeader className="flex flex-col items-center gap-6">
                    <div className="text-4xl">⚠️</div>

                    <DialogTitle className="text-[#4A2F23] text-xl font-bold text-center">
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-[#9B7A63] text-md text-center whitespace-pre-line">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="flex flex-row justify-center gap-4 mt-4">
                    <Button
                        onClick={() => onOpenChange(false)}
                        disabled={isPending}
                        className="border border-[#E0B693] bg-white/70 text-sm text-[#5C3B28] hover:bg-[#FFF2E0] transition text-md py-2 px-6 font-semibold rounded-xl flex-1"
                    >
                        아니오
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={isPending}
                        className="bg-[#F1C9A5]  text-[#4A2F23] border border-[#E0B693] hover:bg-[#E4B88F] transition text-md py-2 px-6 font-semibold rounded-xl flex-1"
                    >
                        {isPending ? (
                            <>
                                <div className="w-4 h-4 border-2 border-t-[#4A2F23] border-gray-300 rounded-full animate-spin"></div>
                                처리 중...
                            </>
                        ) : (
                            "네"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


export default ConfirmModal