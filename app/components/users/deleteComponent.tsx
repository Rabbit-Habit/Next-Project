"use client"

import FailModal from "@/app/components/modal/failModal";
import React, {useState} from "react";
import {useRouter} from "next/navigation";

interface DeleteProps {
    password: string | null;
}

function DeleteComponent({ password }: DeleteProps) {
    const router = useRouter()

    // 탈퇴 페이지 준비중 모달 상태 관리
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(true)


    return(
        <>
            {/* 회원 탈퇴 페이지 준비중 모달 */}
            <FailModal
                open={isDeleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false)
                    router.back()
                }}
                title="회원 탈퇴 페이지 준비 중"
                description={
                    <>
                        회원 탈퇴 페이지를 준비 중입니다.<br />
                        빠른 시일 내에 가능하도록 하겠습니다.
                    </>
                }
            />
        </>
    )
}

export default DeleteComponent