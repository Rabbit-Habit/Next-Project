// Firebase Admin SDK 초기화 파일 - 서버(Next.js Route Handler, Cron)에서 FCM Push 전송

import admin from "firebase-admin";

// 서비스 계정 JSON을 환경 변수에서 가져오기
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!);

// 이미 초기화된 앱이 있으면 재초기화 방지
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

export default admin;
