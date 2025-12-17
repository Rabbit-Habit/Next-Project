<a name="top"></a>

<img width="1920" height="1080" alt="RabbitHabitGitMainPic" src="https://github.com/user-attachments/assets/3b5dd98c-3de1-467e-99a1-0e6ff316f0aa" />
<br><br>

# 🐰 토끼를 키우며 습관을 완성하는 서비스, Rabbit Habit

> **Rabbit Habit(레빗헤빗)** 은 사용자의 일상 습관을 귀여운 **픽셀 토끼 성장 시스템**과 결합한  
> **개인·팀 습관 관리 웹 서비스**입니다.  
> 습관을 수행하지 않으면 토끼가 배고파하다가, 계속 방치하면 도망가요.  
> **매일의 행동이 곧 토끼의 생존이 되는 경험**을 제공합니다.

<br>

- **구분**: 팀 프로젝트  
- **기간**: 2025년 9월 4일 ~ 2025 11월 26일
- **배포**: https://rabbit-habit-xi.vercel.app

<br>

<details>
  <summary>📑 Table of Contents</summary>

- [👤 팀원 (Team Members)](#team-members)  
- [📌 프로젝트 개요 (Project Overview)](#project-overview)  
- [🔍 주요 기능 (Key Features)](#key-features)  
- [🧰 기술 스택 (Tech Stack)](#tech-stack)
- [🖥️ 개발 환경 (Software & Tools)](#software-tools)
- [🖇 ERD (Entity-Relationship-Diagram)](#erd)
- [🏗️ 서비스 아키텍처 (Service Architecture)](#service-architecture)
- [🧩 Actions 명세서 (Actions Specification)](#actions-specification)
- [🖥️ 화면 설계서 (Wireframe)](#wireframe)

</details>

<br><br>

## <a id="team-members"></a> 👤 팀원 (Team Members)

<div align="center">
<table>
	<tr>
    <td><img width="125" height="203" alt="소연_버터컵" src="https://github.com/user-attachments/assets/55155885-76ec-48bd-a2b5-084ee7709365" /></td>
    <td><img width="125" height="205" alt="근화_버블" src="https://github.com/user-attachments/assets/85f18058-8c81-419d-867b-70ed9ff3d8f3" /></td>
    <td><img width="108" height="216" alt="은진_블로섬" src="https://github.com/user-attachments/assets/7ab3b2b8-ca36-46cf-a4a8-03462774a59a" /></td>
	</tr>
  <tr>
    <th><a href="https://github.com/KimSoYeonnn">김소연</a></th>
    <th><a href="https://github.com/geunhwa37">이근화</a></th>
    <th><a href="https://github.com/pobingbin99">이은진</a></th>
  </tr>
  <tr align="center">
    <td>BE, FE</td>
    <td>BE, FE</td>
    <td>BE, FE</td>
  </tr>
</table>
</div>
<br><br>

## <a id="project-overview"></a>📌 프로젝트 개요 (Project Overview)

본 프로젝트는 **습관 형성과 지속을 돕는 웹 기반 서비스**로,
개인 습관 관리뿐 아니라 **팀 단위 습관 공유, 게이미피케이션, 실시간 채팅, 알림 기능**을 통해
사용자가 습관을 꾸준히 실천할 수 있도록 지원하는 것을 목표로 합니다.

**Rabbit Habit**은  
- 습관 수행 여부를 **토끼의 생존 상태**로 시각화하고  
- **개인 습관 + 팀 습관**을 동시에 관리하며  
- **채팅·콤보·출석 기록**을 통해  
사용자가 **“내가 안 하면 토끼가 위험해진다”** 는 감정적 몰입을 느끼도록 설계된 서비스입니다.

이를 통해 혼자 하는 습관 관리의 한계를 보완하고, 함께 실천하고, 잊지 않도록 돕는 구조를 제공합니다.

<br><br>

## <a id="key-features"></a>🔍 주요 기능 (Key Features)

### ✅ 사용자 기능 (User Features)

- **습관 등록 및 관리**
    - 개인 습관 / 팀 습관 구분
    - 목표 횟수, 상세 목표 설정
- **토끼 상태 시각화**
    - PixiJS 기반 픽셀 애니메이션
    - 습관 수행 여부에 따른 토끼 상태 변화
- **출석 체크 & 히스토리**
    - 일별 습관 성공/실패 기록
    - 개인 / 팀 히스토리 분리 관리
- **콤보 시스템**
    - 연속 성공 시 콤보 증가
    - 실패 시 콤보 초기화
- **통계 및 분석**
    - 주간·월간 수행 패턴 시각화
    - 습관별 성공률 / 달성률 통계 제공
- **팀 기능**
    - 초대 코드 생성 및 공유
    - 팀원 수에 따른 팀 습관 활성화
- **채팅 기능**
    - 습관별 전용 채팅 채널 제공
    - 실시간 메시지 송수신 및 읽음 상태 표시
- **알림 시스템**
    - 설정한 시간에 맞춘 습관 리마인드 푸시 알림
    - 습관 미수행 시 자동 리마인드 알림

<br>

### ✅ 시스템 기능 (System Features)

- **KST 기준 날짜 처리**
- **자동 미수행 처리 (Cron)**
- **서버 액션 기반 데이터 처리**
- **SSR + Client Component 혼합 구조**
- **실시간 상태 동기화**
<br><br>

## <a id="tech-stack"></a>🧰 기술 스택 (Tech Stack)

### 🚀 Frontend
- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- PixiJS (픽셀 애니메이션)
- Radix UI
- PWA (Progressive Web App)

### 🔧 Backend
- Next.js Server Actions
- NextAuth.js
- Kakao OAuth API
- WebSocket
- Firebase Cloud Messaging (FCM)
- Cron Job (Vercel)

### 🗄 Database
- PostgreSQL
- Prisma ORM

### ☁️ Deployment
- Vercel
- Railway
- Supabase
    - PostgreSQL Database
    - Storage (이미지 저장)

<br><br>

## <a id="software-tools"></a>🖥️ 개발 환경 (Software & Tools)

- **Languages**: Java 17, TypeScript
- **IDE**: IntelliJ, VS Code
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Dev Tools**: IntelliJ IDEA
- **형상 관리**: Git, GitHub
- **협업 도구**: Notion
  
<br><br>

## <a id="erd"></a>🖇 ERD (Entity Relationship Diagram)

<img width="1159" height="665" alt="image" src="https://github.com/user-attachments/assets/31f072e6-4516-4e5a-ab9b-3d3810f2dcdb" />


<br><br>

## <a id="service-architecture"></a>🏗️ 서비스 아키텍처 (Service Architecture)

<img width="1102" height="633" alt="image" src="https://github.com/user-attachments/assets/0fda4cae-82d0-4f33-8817-d9c73ed3f826" />

<br><br>

## <a id="actions-specification"></a>🧩 Actions 명세서 (Actions Specification)
[actions_명세서.pdf](https://github.com/user-attachments/files/24217671/actions_.pdf)

<br><br>

## <a id="wireframe"></a>🖥️ 화면 설계서 (Wireframe)
<img width="1920" height="1080" alt="2" src="https://github.com/user-attachments/assets/3ad5bd5f-5b1a-4bcf-b04d-04e96e082ca4" />
<img width="1920" height="1080" alt="3" src="https://github.com/user-attachments/assets/a39419c3-8ce9-40c0-a230-b4914152dc72" />
<img width="1920" height="1080" alt="4" src="https://github.com/user-attachments/assets/d0b4260a-07ea-48e8-b361-33511c42b797" />
<img width="1920" height="1080" alt="5" src="https://github.com/user-attachments/assets/ad364a46-070f-425a-8b4f-bac647f87bc2" />
<img width="1920" height="1080" alt="6" src="https://github.com/user-attachments/assets/0118b90a-38ce-4f3e-8609-f48112cf58c5" />
<img width="1920" height="1080" alt="7" src="https://github.com/user-attachments/assets/e6c21b74-1fdd-45ec-90d6-224f63e5fb13" />
<img width="1920" height="1080" alt="8" src="https://github.com/user-attachments/assets/14dfa842-e63b-4de9-bf60-0cafe7331ab1" />




<h5 align="right"><a href="#top">⬆️ TOP</a></h5>
