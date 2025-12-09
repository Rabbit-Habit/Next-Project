"use client";

import { useEffect } from "react";
import { messaging } from "@/lib/firebase";
import { getToken, onMessage } from "firebase/messaging";

export default function FcmProvider({ children }: { children: React.ReactNode }) {

    useEffect(() => {
        async function initFCM() {
            // 1) 알림 권한 요청
            const permission = await Notification.requestPermission();
            if (permission !== "granted") return;

            const msg = await messaging;
            if (!msg) return; // 브라우저가 메시징 지원 안할 경우

            // 2) FCM Token 발급
            const token = await getToken(msg, {
                vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!,
            });

            console.log("FCM Token:", token);

            // 3) 토큰을 서버로 저장 (DB 연결)
            await fetch("/api/save-fcm-token", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token }),
            });

            // 4) 포그라운드 알림 수신 처리
            onMessage(msg, (payload) => {
                console.log("[FCM] foreground message:", payload);

                const { title, body } = payload.notification ?? {};
                if (title && body) {
                    new Notification(title, { body });
                }
            });
        }

        initFCM();
    }, []);

    return <>{children}</>;
}
