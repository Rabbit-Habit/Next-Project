// Firebase Admin SDK 초기화 파일 - 서버(Next.js Route Handler, Cron)에서 FCM Push 전송

import admin from "firebase-admin";

// 이미 초기화된 앱이 있으면 재초기화 방지
if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (!projectId || !clientEmail || !privateKey) {
        throw new Error("Firebase Admin 환경변수가 누락되었습니다.");
    }

    admin.initializeApp({
        credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
        }),
    });
}

export default admin;
