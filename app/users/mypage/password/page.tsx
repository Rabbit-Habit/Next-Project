"use client"

import Header from "@/app/components/common/header";
import PasswordEditComponent from "@/app/components/users/passwordEditComponent";

function PasswordPage() {
    return (
        <>
            <div>
                <Header title="비밀번호 변경" backUrl={"/users/mypage"}/>
                <PasswordEditComponent/>
            </div>
        </>
    )
}

export default PasswordPage