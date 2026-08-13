# 🎧 NoteLens

> 영어 전공 강의를 듣는 순간부터 복습까지 도와주는 AI 기반 강의 학습 도우미

NoteLens는 영어로 진행되는 전공 강의를 보다 쉽게 이해하고 복습할 수 있도록 만든 웹 서비스입니다.

강의 음성 파일을 업로드하거나 직접 녹음하면 AI가 음성을 분석하여
한국어 번역, 핵심 개념, 시험 포인트, 전공 용어를 자동으로 정리합니다.

또한 Live Mode를 통해 수업 중 마이크 입력을 기반으로
준실시간 한국어 자막과 강의 노트를 생성할 수 있습니다.

---

## ✨ 주요 기능

### 📚 Study Mode

강의 녹음 파일을 업로드하거나 직접 음성을 녹음하여 AI 학습 노트를 생성합니다.

- 강의 음성 전사
- 한국어 번역
- 핵심 개념 요약
- 시험 포인트 정리
- 전공 용어 정리
- 여러 개의 강의 파일 연속 분석

지원 형식

- mp3
- wav
- m4a
- webm

---

### 🎙️ Live Mode

수업 중 마이크를 사용하여 강의 내용을 분석합니다.

- 마이크 기반 강의 녹음
- 준실시간 한국어 자막 생성
- Live Caption 누적
- 강의 종료 후 자동 학습 노트 생성

---

## 🧠 과목별 맞춤 번역

강의의 전공 맥락을 고려하여 용어를 번역할 수 있도록
과목별 프롬프트를 구성했습니다.

현재 지원 과목

- 통계학
- 머신러닝
- 추천시스템
- 일반 영어

예를 들어 머신러닝 강의에서는

- overfitting → 과적합
- gradient descent → 경사하강법
- loss function → 손실 함수

와 같이 전공 용어의 의미를 유지하여 번역합니다.

---

## 📝 AI 분석 결과

Study Mode에서는 강의 음성을 다음과 같은 구조로 정리합니다.

1. 음성 유형 판단
2. 원문 전사
3. 한국어 번역
4. 핵심 개념 요약
5. 시험 포인트
6. 전공 용어 정리

단순한 강의 요약이 아니라,
원래 강의의 설명 순서와 예시, 계산 과정 등을 최대한 유지하면서
번역 결과와 학습용 요약을 분리하도록 설계했습니다.

---

## 🛠 Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

### AI

- Google Gemini API

### Web API

- Next.js Route Handler

---

## 🏗 Architecture

```text
User
 │
 ├─ Study Mode
 │    └─ Audio Upload / Recording
 │
 └─ Live Mode
      └─ Microphone Recording
             │
             ▼
       Next.js Frontend
             │
             ▼
       Next.js API Routes
       ├─ /api/translate
       ├─ /api/live-caption
       └─ /api/live-summary
             │
             ▼
        Gemini API
             │
             ▼
 Translation / Caption / Study Notes
```

---

## 🚀 Getting Started

### 1. Repository Clone

```bash
git clone https://github.com/kimmibae0324/notelens.git
cd notelens
```

### 2. Dependencies

```bash
npm install
```

### 3. Environment Variables

프로젝트 루트에 `.env.local` 파일을 생성합니다.

```env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

API Key는 GitHub에 업로드하지 않습니다.

### 4. Run

```bash
npm run dev
```

브라우저에서 아래 주소로 접속합니다.

```text
http://localhost:3000
```

---

## 📁 Project Structure

```text
notelens
├── app
│   ├── api
│   │   ├── live-caption
│   │   ├── live-summary
│   │   └── translate
│   │
│   ├── page.tsx
│   ├── layout.tsx
│   └── globals.css
│
├── public
├── package.json
└── README.md
```

---

## 💡 Motivation

영어로 진행되는 전공 강의를 들을 때 단순히 내용을 번역하는 것만으로는
효율적인 복습이 어렵다는 점에서 프로젝트를 시작했습니다.

강의 내용을 다시 들으면서 번역하고,
중요한 개념과 시험 내용을 따로 정리해야 하는 과정을 줄이기 위해

**음성 → 번역 → 개념 정리 → 복습 노트**

과정을 하나의 서비스 안에서 처리하는 것을 목표로 했습니다.

---

## 🔮 Future Work

- 강의 노트 저장 기능
- 사용자별 과목 관리
- 이전 강의 검색
- PDF / 강의자료 연동
- 생성된 노트 다운로드
- Live Caption 품질 개선

---

## 👩‍💻 Developer

**Kim Mibae**

Personal Project
