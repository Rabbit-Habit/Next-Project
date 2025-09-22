"use client";

import { ReactNode, useEffect } from "react";
import {useLoginStore} from "@/app/store/useLoginStore";

interface ClientProviderProps {
    children: ReactNode;
    uid: number;
}

export default function ClientProvider({ children, uid }: ClientProviderProps) {
    const { save } = useLoginStore()

    useEffect(() => {
        save(uid)
    }, [])

    return (
        <>
            {children}
        </>
    )
}