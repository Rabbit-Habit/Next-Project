"use client"

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import React, {useActionState, useEffect, useState} from "react"
import {NicknameEditAction} from "@/app/users/mypage/nickname/actions";
import {ChangeProfileImage} from "@/app/users/mypage/actions";
import FailModal from "@/app/components/modal/failModal";

interface ProfileChangeProps {
    open: boolean;
    onClose: () => void;
}

const initState: EditResult = {
    uid: -1,
    error: "",
}

const profileChangeClientAction = async (
    state: EditResult,
    formData: FormData
): Promise<EditResult> => {
    return ChangeProfileImage(formData)
}

function ProfileChangeModal({ open, onClose }: ProfileChangeProps) {
    const [state, action, isPending] = useActionState(profileChangeClientAction, initState)

    // 실패 모달 상태 관리
    const [isFailModalOpen, setIsFailModalOpen] = useState(false)

    useEffect(() => {
        if (state.uid >= 0) {
            onClose()
        } else if (state.error) {
            setIsFailModalOpen(true)
        }
    }, [state, onClose])

    return (
        <>
            {/* 닉네임 변경 실패 모달 */}
            <FailModal
                open={isFailModalOpen}
                onClose={() => {
                    setIsFailModalOpen(false)
                }}
                title="프로필 이미지 변경 실패"
                description={
                    <>
                        프로필 변경중 문제가 발생했습니다.<br />
                        다시 시도해주세요.
                    </>
                }
            />
            <Sheet open={open} onOpenChange={onClose}>
                <SheetContent side="bottom" className="rounded-t-2xl bg-white border overflow-y-auto animate-fade-in">
                    <SheetHeader className="flex flex-col items-center gap-4 pt-6">
                        <div className="text-3xl text-pink-500">📷</div>
                        <SheetTitle className="text-pink-500 text-xl font-bold text-center">
                            프로필 이미지 변경
                        </SheetTitle>
                        <SheetDescription className="text-gray-700 text-md text-center">
                            사진 업로드 또는 다른 옵션을 선택하세요.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="flex flex-col gap-4 py-4 px-4">
                        {/* 기본 프로필로 변경 */}
                        <form action={action}>
                            <Button
                                type="submit"
                                variant="outline"
                                className="border-pink-400 text-pink-400 text-md py-5 font-semibold rounded-xl w-full"
                            >
                                기본 이미지로 변경
                            </Button>
                        </form>

                        {/* 프로필 이미지 업로드 */}
                        <form action={action}>
                            <input
                                type="file"
                                name="newProfileImage"
                                accept="image/*"
                                id="newProfileImage"
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files?.length) {
                                        e.target.form?.requestSubmit();
                                    }
                                }}
                            />
                            <label htmlFor="newProfileImage">
                                <Button
                                    asChild
                                    className="bg-pink-400 text-white text-md py-5 font-semibold rounded-xl w-full"
                                >
                                    <span>사진 업로드</span>
                                </Button>
                            </label>
                        </form>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    )
}

export default ProfileChangeModal