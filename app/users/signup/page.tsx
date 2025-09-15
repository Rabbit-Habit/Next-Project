'use client'

import SignupComponent from "@/app/components/users/signupComponent";
import Header from "@/app/components/common/header";

function SignupPage() {
    return (
        <div>
            <Header title="회원가입" backUrl={"/auth/login"} />
            <SignupComponent/>
        </div>
    )
}

export default SignupPage