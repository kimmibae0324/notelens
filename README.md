# 🎧 NoteLens

> **영어 전공 강의를 듣는 순간부터 복습까지 이어주는 AI 강의 학습 도우미**

NoteLens는 영어로 진행되는 전공 강의를 보다 쉽게 이해하고 복습할 수 있도록 만든 웹 기반 AI 학습 도구입니다.

강의 음성을 업로드하거나 브라우저에서 직접 녹음하면 AI가 음성을 분석하여 **원문 전사, 한국어 번역, 핵심 개념, 시험 포인트, 전공 용어**를 하나의 학습 노트로 정리합니다.

또한 **Live Mode**를 통해 수업 중 음성을 일정 구간마다 분석해 준실시간 한국어 자막을 생성하고, 강의가 끝난 뒤 누적된 내용을 바탕으로 강의 노트를 만들 수 있습니다.

---

## 💡 Why NoteLens?

영어 전공 강의를 복습할 때는 단순히 강의를 다시 듣는 것만으로 끝나지 않습니다.

음성을 다시 듣고,
영어 내용을 이해하고,
필요한 부분을 번역하고,
핵심 개념과 시험 내용을 다시 정리해야 합니다.

NoteLens는 이 과정을

**Audio → Transcript → Translation → Key Concepts → Study Notes**

하나의 흐름으로 연결하는 것을 목표로 개발했습니다.

---

## ✨ Features

### 📚 Study Mode

기존 강의 녹음 파일을 업로드하거나 브라우저에서 직접 녹음하여 학습 노트를 생성합니다.

* 강의 음성 파일 업로드
* 여러 개의 음성 파일 연속 분석
* 브라우저 마이크를 이용한 직접 녹음
* 영어 원문 전사
* 자연스러운 한국어 번역
* 핵심 개념 요약
* 시험 포인트 정리
* 전공 용어 정리
* 전체 결과 클립보드 복사

지원하는 주요 오디오 형식:

`mp3` · `wav` · `m4a` · `webm`

> 긴 음성 파일의 경우 여러 파트로 나누어 업로드할 수 있으며, 각 파일을 순서대로 분석합니다.

---

### 🎙️ Live Mode

수업 중 마이크 입력을 일정 구간으로 나누어 AI가 반복적으로 분석합니다.

* 브라우저 마이크 입력
* 약 30초 단위 오디오 처리
* 영어 강의 → 한국어 자막 변환
* 생성된 Live Caption 누적
* 자막 전체 복사
* Live 종료 후 누적 자막 기반 강의 노트 생성

강의가 종료되면 누적된 자막을 이용하여 다음 내용을 정리합니다.

* 오늘 강의 요약
* 핵심 개념
* 시험 포인트
* 전공 용어

---

## 🧠 Lecture Context

사용자는 분석 전 강의 과목을 선택할 수 있습니다.

현재 UI에서 선택 가능한 과목:

* 수학
* 통계학
* 머신러닝
* 추천시스템
* 일반 영어

일부 전공에는 별도의 용어 가이드를 적용하여 번역 과정에서 전공 맥락을 최대한 유지하도록 구성했습니다.

예를 들어 머신러닝에서는 다음과 같은 용어를 일관되게 처리합니다.

```text
overfitting        → 과적합
underfitting       → 과소적합
gradient descent   → 경사하강법
loss function      → 손실 함수
classification     → 분류
regression         → 회귀
```

추천시스템에서는 다음과 같은 전공 용어를 처리합니다.

```text
collaborative filtering   → 협업 필터링
content based filtering   → 콘텐츠 기반 필터링
matrix factorization      → 행렬 분해
similarity                → 유사도
```

---

## 📝 Study Mode Output

강의 분석 결과는 다음과 같은 구조로 분리하여 표시합니다.

### 1. 음성 유형 판단

입력된 음성이 강의, 노래, 대화 또는 기타 유형인지 판단합니다.

### 2. 원문 전사

음성에서 들리는 영어 내용을 텍스트로 전사합니다.

### 3. 한국어 번역

단순 요약이 아니라 교수자의 설명 순서와 논리 흐름을 유지하며 한국어로 번역합니다.

### 4. 핵심 개념 요약

강의에서 중요한 개념을 별도로 정리합니다.

### 5. 시험 포인트

시험에 출제될 가능성이 있는 내용과 헷갈리기 쉬운 부분을 추출합니다.

### 6. 전공 용어 정리

강의에서 등장한 영어 전공 용어와 대응하는 한국어 표현을 정리합니다.

---

## 🏗 Architecture

```text
                          ┌──────────────────┐
                          │       User       │
                          └────────┬─────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
              📚 Study Mode                 🎙️ Live Mode
                    │                             │
         Audio Upload / Recording          Microphone Input
                    │                             │
                    ▼                             ▼
             /api/translate              /api/live-caption
                    │                             │
                    └──────────────┬──────────────┘
                                   │
                                   ▼
                            Google Gemini API
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
              Study Notes                  Live Captions
                                                  │
                                                  ▼
                                         /api/live-summary
                                                  │
                                                  ▼
                                           Lecture Notes
```

---

## 🔌 API Routes

| Route               | Purpose                      |
| ------------------- | ---------------------------- |
| `/api/translate`    | 강의 음성 전사, 번역 및 학습 노트 생성      |
| `/api/live-caption` | Live Mode 음성 구간을 한국어 자막으로 변환 |
| `/api/live-summary` | 누적된 Live Caption을 강의 노트로 정리  |

---

## 🛠 Tech Stack

### Frontend

* **Next.js**
* **React**
* **TypeScript**
* **Tailwind CSS**

### Backend

* **Next.js Route Handlers**
* Web Media APIs
* MediaRecorder API

### AI

* **Google Gemini API**
* Gemini 2.5 Flash-Lite
* Gemini 2.0 Flash-Lite

---

## 📁 Project Structure

```text
notelens/
├── app/
│   ├── api/
│   │   ├── live-caption/
│   │   │   └── route.ts
│   │   ├── live-summary/
│   │   │   └── route.ts
│   │   └── translate/
│   │       └── route.ts
│   │
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
│
├── public/
├── .gitignore
├── package.json
├── next.config.ts
├── tsconfig.json
└── README.md
```

---

## 🚀 Getting Started

### 1. Clone Repository

```bash
git clone https://github.com/kimmibae0324/notelens.git
cd notelens
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

프로젝트 루트에 `.env.local` 파일을 생성합니다.

```env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

> API Key와 같은 민감한 정보는 GitHub에 업로드하지 않습니다.

### 4. Run Development Server

```bash
npm run dev
```

브라우저에서 다음 주소로 접속합니다.

```text
http://localhost:3000
```

---

## 🔄 How It Works

### Study Mode

```text
Audio File
    ↓
Base64 Encoding
    ↓
Gemini API
    ↓
Transcript
    ↓
Korean Translation
    ↓
Key Concepts
    ↓
Exam Points
    ↓
Terminology
    ↓
Study Note UI
```

### Live Mode

```text
Microphone
    ↓
Audio Chunk Recording
    ↓
Gemini API
    ↓
Korean Caption
    ↓
Caption Accumulation
    ↓
End Live Mode
    ↓
Gemini Summary
    ↓
Lecture Note
```

---

## 👩‍💻 Project

**NoteLens**

Personal Project
