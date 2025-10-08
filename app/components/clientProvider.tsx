"use client";

import { ReactNode } from "react";
import {SessionProvider} from "next-auth/react";

interface ClientProviderProps {
    children: ReactNode;
    session: any;
}

export default function ClientProvider({ children, session }: ClientProviderProps) {
    return (
        <SessionProvider session={session}>
            {children}
        </SessionProvider>
    )
}