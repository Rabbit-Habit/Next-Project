"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface FailModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    description: string | React.ReactNode;
}

function FailModal({ open, onClose, title, description }: FailModalProps) {
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md rounded-2xl shadow-lg bg-white border border-pink-200 animate-fade-in">
                <DialogHeader className="flex flex-col items-center gap-6">
                    {/* 귀여운 느낌 아이콘 */}
                    <div className="text-4xl">❌</div>

                    <DialogTitle className="text-[#4A2F23] text-xl font-bold text-center">
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-[#9B7A63] text-md text-center whitespace-pre-line">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="flex justify-center mt-4">
                    <Button
                        onClick={onClose}
                        className="bg-[#F1C9A5]  text-[#4A2F23] border border-[#E0B693] hover:bg-[#E4B88F] transition text-md py-5 font-semibold rounded-xl"
                    >
                        확인
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default FailModal