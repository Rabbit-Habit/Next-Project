// Firebase Messaging Service Worker

// 1) Firebase 라이브러리 불러오기 (서비스워커에서는 importScripts 사용)
importScripts("https://www.gstatic.com/firebasejs/9.6.7/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.6.7/firebase-messaging-compat.js");

// 2) Firebase 앱 초기화
firebase.initializeApp({
    apiKey: "YOUR_API_KEY",
    projectId: "YOUR_PROJECT_ID",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID",
});

// 3) Messaging 객체 가져오기
const messaging = firebase.messaging();

// 4) 백그라운드에서 푸시 알림 수신 처리
messaging.onBackgroundMessage((payload) => {
    // 실제 알림 띄우기
    self.registration.showNotification(payload.notification.title, {
        body: payload.notification.body,
        icon: "/icons/icon-192x192.png",
    });
});
