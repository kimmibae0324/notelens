"use client";

import { useRef, useState } from "react";

type Mode = "study" | "live";

type ResultSections = {
  audioType: string;
  transcript: string;
  translation: string;
  summary: string;
  examPoints: string;
  terms: string;
};

function MultiPartResultSection({
  subject,
  parts,
  message,
  copyResult,
}: {
  subject: string;
  parts: { title: string; content: string }[];
  message: string;
  copyResult: () => void;
}) {
  return (
    <section className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-xl">
      <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold text-gray-500">
            Multi Part Result
          </p>
          <h2 className="mt-1 text-3xl font-black">
            {subject} 강의 파트별 번역 결과
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            긴 강의를 파트별로 나누어 분석했습니다. 필요한 파트만 펼쳐서 확인하세요.
          </p>
        </div>

        <button
          onClick={copyResult}
          className="rounded-full bg-black px-5 py-3 text-xs font-bold text-white transition hover:scale-[1.02]"
        >
          전체 노트 복사하기
        </button>
      </div>

      <div className="grid gap-4">
        {parts.map((part, index) => (
          <details
            key={part.title}
            className="group rounded-3xl bg-gray-50 p-5"
            open={index === 0}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-gray-400">
                  Lecture Part {index + 1}
                </p>
                <h3 className="mt-1 text-xl font-black">{part.title}</h3>
              </div>

              <span className="rounded-full bg-white px-4 py-2 text-xs font-bold text-gray-600 shadow-sm">
                펼쳐보기
              </span>
            </summary>

            <div className="mt-5 max-h-[520px] overflow-y-auto rounded-2xl bg-white p-5">
              <p className="whitespace-pre-line text-sm leading-7 text-gray-700">
                {part.content}
              </p>
            </div>
          </details>
        ))}
      </div>

      <details className="mt-6 rounded-3xl bg-gray-50 p-5">
        <summary className="cursor-pointer font-bold">
          전체 AI 원문 보기
        </summary>
        <p className="mt-4 whitespace-pre-line text-sm leading-7 text-gray-700">
          {message}
        </p>
      </details>
    </section>
  );
}

type LiveCaption = {
  id: number;
  text: string;
};

function extractSection(text: string, title: string) {
  const pattern = new RegExp(`\\[${title}\\]([\\s\\S]*?)(?=\\n\\[|$)`, "i");
  const match = text.match(pattern);
  return match ? match[1].trim() : "";
}

function parseResult(text: string): ResultSections {
  return {
    audioType: extractSection(text, "음성 유형 판단"),
    transcript: extractSection(text, "원문 전사"),
    translation: extractSection(text, "한국어 번역"),
    summary: extractSection(text, "핵심 개념 요약"),
    examPoints: extractSection(text, "시험 포인트"),
    terms: extractSection(text, "전공 용어 정리"),
  };
}

function parseParts(text: string) {
  return text
    .split(/(?=Part \d+)/g)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part, index) => {
      const translation = extractSection(part, "한국어 번역");

      return {
        title: `Part ${index + 1}`,
        content: translation || part,
      };
    });
}

export default function Home() {
  const [mode, setMode] = useState<Mode>("study");
  const [file, setFile] = useState<File | null>(null);
  const [files, setFiles] = useState<File[]>([]);
const [partResults, setPartResults] = useState<string[]>([]);
const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [fileName, setFileName] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");

  const [isLiveRunning, setIsLiveRunning] = useState(false);
  const [isLiveProcessing, setIsLiveProcessing] = useState(false);
  const [liveCaptions, setLiveCaptions] = useState<LiveCaption[]>([]);
  const [liveMessage, setLiveMessage] = useState("");
  const [liveSummary, setLiveSummary] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const liveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const liveStreamRef = useRef<MediaStream | null>(null);

  const sections = parseResult(message);
  const parts = parseParts(message);

const analyzeStudyFile = async (audioFile: File, currentSubject: string) => {
  const formData = new FormData();
  formData.append("file", audioFile);
  formData.append("subject", currentSubject);

  const response = await fetch("/api/translate", {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || "AI 연결에 실패했습니다.");
  }

  return data.result as string;
};

const analyzeLiveChunk = async (audioFile: File, currentSubject: string) => {
  const formData = new FormData();
  formData.append("file", audioFile);
  formData.append("subject", currentSubject);

  const response = await fetch("/api/live-caption", {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || "라이브 자막 생성에 실패했습니다.");
  }

  return data.result as string;
};
  const startRecording = async () => {
    try {
      setMessage("");
      setShowResult(false);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        const recordedFile = new File([audioBlob], "recorded-lecture.webm", {
          type: "audio/webm",
        });

        setFile(recordedFile);
        setFileName("recorded-lecture.webm");
        setAudioUrl(URL.createObjectURL(audioBlob));

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      setMessage("마이크 권한을 허용해야 녹음할 수 있습니다.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

const handleStudyStart = async () => {
  setShowResult(false);
  setPartResults([]);

  if (files.length === 0 && !file) {
    setMessage("먼저 강의 음성 파일을 업로드하거나 녹음해주세요.");
    return;
  }

  if (!subject) {
    setMessage("강의 과목을 선택해주세요.");
    return;
  }

  try {
    setIsBatchProcessing(true);

    const targetFiles = files.length > 0 ? files : file ? [file] : [];

    // ✅ 단일 파일
    if (targetFiles.length === 1) {
      setMessage("AI가 음성 파일을 듣고 번역 노트를 만들고 있습니다...");

      const result = await analyzeStudyFile(
        targetFiles[0],
        subject
      );

      setMessage(result);
      setShowResult(true);
      return;
    }

    // ✅ 멀티 파일
    const results: string[] = [];

    for (let i = 0; i < targetFiles.length; i++) {
      setMessage(
        `Part ${i + 1}/${targetFiles.length} 분석 중입니다...\n잠시만 기다려주세요.`
      );

      const result = await analyzeStudyFile(
        targetFiles[i],
        subject
      );

      results.push(result);
      setPartResults(results.slice());
    }

    const combinedText = results
      .map((result, index) => `Part ${index + 1}\n${result}`)
      .join("\n\n");

    setMessage(combinedText);
    setShowResult(false);
  } catch (error: any) {
    setMessage(error.message || "요청 중 오류가 발생했습니다.");
  } finally {
    setIsBatchProcessing(false);
  }
};

  const startLiveMode = async () => {
    if (!subject) {
      setLiveMessage("먼저 과목을 선택해주세요.");
      return;
    }

    try {
      setLiveMessage("라이브가 시작되었습니다. 자동으로 강의 자막이 생성됩니다.");
      setLiveCaptions([]);
      setIsLiveRunning(true);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      liveStreamRef.current = stream;

      recordLiveChunk(stream);
    } catch {
      setLiveMessage("마이크 권한을 허용해야 Live Mode를 사용할 수 있습니다.");
      setIsLiveRunning(false);
    }
  };

  const recordLiveChunk = (stream: MediaStream) => {
    if (!stream) return;

    const mediaRecorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      if (!isLiveRunning && liveTimerRef.current === null) return;

      const blob = new Blob(chunks, { type: "audio/webm" });
      const liveFile = new File([blob], `live-chunk-${Date.now()}.webm`, {
        type: "audio/webm",
      });

      try {
        setIsLiveProcessing(true);
        setLiveMessage("방금 들은 음성을 AI가 자막으로 변환 중입니다...");

        const result = await analyzeLiveChunk(liveFile, subject);
        const translation = result;

        setLiveCaptions((prev) => [
          ...prev,
          {
            id: Date.now(),
            text: translation,
          },
        ]);

        setLiveMessage("다음 음성을 듣는 중입니다...");
      } catch (error: any) {
        setLiveMessage(error.message || "라이브 자막 생성 중 오류가 발생했습니다.");
      } finally {
        setIsLiveProcessing(false);

        if (liveStreamRef.current) {
          liveTimerRef.current = setTimeout(() => {
            if (liveStreamRef.current) recordLiveChunk(liveStreamRef.current);
          }, 500);
        }
      }
    };

    mediaRecorder.start();

    liveTimerRef.current = setTimeout(() => {
      if (mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
      }
    }, 30000);
  };

const stopLiveMode = async () => {
  setIsLiveRunning(false);

  if (liveTimerRef.current) {
    clearTimeout(liveTimerRef.current);
    liveTimerRef.current = null;
  }

  liveStreamRef.current?.getTracks().forEach((track) => track.stop());
  liveStreamRef.current = null;

  setLiveMessage("라이브 종료됨. 강의 노트를 생성 중입니다...");

  try {
    const fullText = liveCaptions.map((item) => item.text).join("\n");

    const response = await fetch("/api/live-summary", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: fullText,
        subject,
      }),
    });

    const data = await response.json();

    if (data.success) {
      setLiveSummary(data.result);
      setLiveMessage("강의 노트 생성 완료!");
    } else {
      setLiveMessage("요약 생성 실패");
    }
  } catch {
    setLiveMessage("요약 생성 중 오류 발생");
  }
};

  const copyResult = async () => {
    await navigator.clipboard.writeText(message);
    alert("번역 노트가 복사되었습니다!");
  };

  const copyLiveCaptions = async () => {
    const text = liveCaptions.map((caption) => caption.text).join("\n\n");
    await navigator.clipboard.writeText(text);
    alert("라이브 자막이 복사되었습니다!");
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#eef2ff,white_45%,#f8fafc)] px-6 py-10 text-gray-900">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black text-lg font-bold text-white shadow-lg">
              N
            </div>
            <span className="text-lg font-bold">NoteLens</span>
          </div>

          <span className="rounded-full border border-gray-200 bg-white/70 px-4 py-2 text-xs font-semibold text-gray-500 shadow-sm backdrop-blur">
            AI Lecture Translator
          </span>
        </nav>

        <section className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="mb-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-600 shadow-sm">
              Study Mode & Live Mode
            </p>

            <h1 className="mb-5 text-5xl font-black leading-tight tracking-tight md:text-6xl">
              전공 강의,
              <br />
              듣는 순간부터 정리까지.
            </h1>

            <p className="mb-8 max-w-xl text-lg leading-8 text-gray-600">
              강의 음성을 업로드해 복습하거나, 수업 중 마이크로 녹음해
              준실시간 자막과 학습 노트를 만들어보세요.
            </p>

            <div className="grid max-w-xl grid-cols-3 gap-3 text-center">
              <InfoBox number="01" label="Audio" />
              <InfoBox number="02" label="Caption" />
              <InfoBox number="03" label="Notes" />
            </div>
          </div>

          <div className="rounded-[2rem] border border-white bg-white/80 p-6 shadow-2xl backdrop-blur">
            <div className="mb-5">
              <h2 className="text-2xl font-bold">모드 선택</h2>
              <p className="mt-2 text-sm text-gray-500">
                복습용 파일 분석 또는 수업 중 자막 모드를 선택하세요.
              </p>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-3 rounded-3xl bg-gray-100 p-2">
              <button
                onClick={() => {
                  setMode("study");
                  setMessage("");
                  setShowResult(false);
                }}
                className={`rounded-2xl px-4 py-3 text-sm font-bold transition ${
                  mode === "study"
                    ? "bg-black text-white shadow"
                    : "bg-transparent text-gray-500"
                }`}
              >
                Study Mode
              </button>

              <button
                onClick={() => {
                  setMode("live");
                  setMessage("");
                  setShowResult(false);
                }}
                className={`rounded-2xl px-4 py-3 text-sm font-bold transition ${
                  mode === "live"
                    ? "bg-black text-white shadow"
                    : "bg-transparent text-gray-500"
                }`}
              >
                Live Mode
              </button>
            </div>

            {mode === "study" ? (
              <StudyPanel
              fileName={fileName}
              audioUrl={audioUrl}
              isRecording={isRecording}
              subject={subject}
              message={message}
              showResult={showResult}
              setFile={setFile}
              setFiles={setFiles}
              isBatchProcessing={isBatchProcessing}
              setPartResults={setPartResults}
              setFileName={setFileName}
              setAudioUrl={setAudioUrl}
              setMessage={setMessage}
              setShowResult={setShowResult}
              setSubject={setSubject}
              startRecording={startRecording}
              stopRecording={stopRecording}
              handleStudyStart={handleStudyStart}
            />
            ) : (
            <LivePanel
              subject={subject}
              setSubject={setSubject}
              isLiveRunning={isLiveRunning}
              isLiveProcessing={isLiveProcessing}
              liveMessage={liveMessage}
              liveCaptions={liveCaptions}
              liveSummary={liveSummary}
              startLiveMode={startLiveMode}
              stopLiveMode={stopLiveMode}
              copyLiveCaptions={copyLiveCaptions}
            />
            )}
          </div>
        </section>

{showResult &&
  (parts.length > 1 ? (
    <MultiPartResultSection
      subject={subject}
      parts={parts}
      message={message}
      copyResult={copyResult}
    />
  ) : (
    <ResultSection
      subject={subject}
      sections={sections}
      message={message}
      copyResult={copyResult}
    />
  ))}
      </section>
    </main>
  );
}

function StudyPanel(props: any) {
  const {
    fileName,
    audioUrl,
    isRecording,
    subject,
    message,
    showResult,
    setFile,
    setFiles,
    isBatchProcessing,
    setPartResults,
    setFileName,
    setAudioUrl,
    setMessage,
    setShowResult,
    setSubject,
    startRecording,
    stopRecording,
    handleStudyStart,
  } = props;

  return (
    <>
      <label className="mb-4 flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center transition hover:bg-gray-100">
<input
  type="file"
  accept="audio/*"
  multiple
  className="hidden"
  onChange={(event) => {
  const selectedFiles = Array.from(event.target.files || []).sort((a, b) =>
  a.name.localeCompare(b.name, undefined, { numeric: true })
);

    if (selectedFiles.length > 0) {
      setFiles(selectedFiles);
      setFile(selectedFiles[0]);
      setFileName(
        selectedFiles.length === 1
          ? selectedFiles[0].name
          : `${selectedFiles.length}개 파일 선택됨`
      );
      setAudioUrl(URL.createObjectURL(selectedFiles[0]));
      setMessage("");
      setPartResults([]);
      setShowResult(false);
    }
  }}
/>

        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white">
          ↑
        </span>

        <p className="font-semibold">
          {fileName ? fileName : "음성 파일을 선택해주세요"}
        </p>
        <p className="mt-2 text-xs text-gray-500">
          mp3, wav, m4a, webm 파일 지원 (10분 이하 권장)
        </p>
      </label>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <button
          onClick={startRecording}
          disabled={isRecording}
          className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold transition hover:bg-gray-100 disabled:opacity-50"
        >
          녹음 시작
        </button>

        <button
          onClick={stopRecording}
          disabled={!isRecording}
          className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold transition hover:bg-gray-100 disabled:opacity-50"
        >
          녹음 종료
        </button>
      </div>

      {isRecording && (
        <p className="mb-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-600">
          녹음 중입니다...
        </p>
      )}

      {audioUrl && <audio controls src={audioUrl} className="mb-4 w-full" />}

      <SubjectSelect subject={subject} setSubject={setSubject} />

      <button
        onClick={handleStudyStart}
        className="w-full rounded-2xl bg-black px-6 py-4 font-bold text-white shadow-lg transition hover:scale-[1.01] active:scale-[0.99]"
      >
        {isBatchProcessing ? "분석 중..." : "강의 파트 분석 시작하기"}
      </button>

      {message && !showResult && (
        <p className="mt-4 whitespace-pre-line rounded-2xl bg-gray-100 p-4 text-sm font-medium text-gray-700">
          {message}
        </p>
      )}
    </>
  );
}

function LivePanel({
  subject,
  setSubject,
  isLiveRunning,
  isLiveProcessing,
  liveMessage,
  liveCaptions,
  liveSummary,
  startLiveMode,
  stopLiveMode,
  copyLiveCaptions,
}: {
  subject: string;
  setSubject: (value: string) => void;
  isLiveRunning: boolean;
  isLiveProcessing: boolean;
  liveMessage: string;
  liveCaptions: LiveCaption[];
  liveSummary: string;
  startLiveMode: () => void;
  stopLiveMode: () => void;
  copyLiveCaptions: () => void;
}) {
  return (
    <div>
      <SubjectSelect subject={subject} setSubject={setSubject} />

      <div className="mb-4 grid grid-cols-2 gap-3">
        <button
          onClick={startLiveMode}
          disabled={isLiveRunning}
          className="rounded-2xl bg-black px-4 py-3 text-sm font-bold text-white transition hover:scale-[1.01] disabled:opacity-50"
        >
          라이브 시작
        </button>

        <button
          onClick={stopLiveMode}
          disabled={!isLiveRunning}
          className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold transition hover:bg-gray-100 disabled:opacity-50"
        >
          라이브 종료
        </button>
      </div>

      {liveMessage && (
        <p className="mb-4 rounded-2xl bg-gray-100 p-4 text-sm font-medium text-gray-700">
          {liveMessage}
        </p>
      )}

      {isLiveRunning && (
        <p className="mb-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-600">
          🎤 라이브 자막 생성 중입니다...
        </p>
      )}

      {isLiveProcessing && (
        <p className="mb-4 rounded-2xl bg-blue-50 p-3 text-sm font-semibold text-blue-600">
          AI가 방금 들은 음성을 처리 중입니다...
        </p>
      )}

      <div className="rounded-3xl bg-gray-50 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-black">Live Captions</h3>

          {liveCaptions.length > 0 && (
            <button
              onClick={copyLiveCaptions}
              className="rounded-full bg-white px-4 py-2 text-xs font-bold text-gray-700 shadow-sm"
            >
              자막 복사
            </button>
          )}
        </div>

        <div className="flex max-h-96 flex-col gap-3 overflow-y-auto">
          {liveCaptions.length === 0 ? (
            <p className="text-sm leading-7 text-gray-500">
              아직 자막이 없습니다. 라이브 시작을 누르면 자동으로 자막이 생성됩니다.
            </p>
          ) : (
            liveCaptions.map((caption, index) => (
              <div
                key={caption.id}
                className="rounded-2xl bg-white p-4 shadow-sm"
              >
                <p className="mb-2 text-xs font-bold text-gray-400">
                  Caption {index + 1}
                </p>

                <p className="whitespace-pre-line text-sm leading-7 text-gray-700">
                  {caption.text}
                </p>
              </div>
            ))
          )}
        </div>

        {liveSummary && (
          <div className="mt-4 rounded-3xl bg-white p-5">
            <h3 className="mb-3 text-xl font-black">오늘 강의 노트</h3>

            <p className="whitespace-pre-line text-sm leading-7 text-gray-700">
              {liveSummary}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultSection({
  subject,
  sections,
  message,
  copyResult,
}: {
  subject: string;
  sections: ResultSections;
  message: string;
  copyResult: () => void;
}) {
  return (
    <section className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-xl">
      <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold text-gray-500">
            Translation Result
          </p>
          <h2 className="mt-1 text-3xl font-black">
            {subject} 강의 음성 번역 결과
          </h2>
        </div>

        <button
          onClick={copyResult}
          className="rounded-full bg-black px-5 py-3 text-xs font-bold text-white transition hover:scale-[1.02]"
        >
          노트 복사하기
        </button>
      </div>

      <div className="grid gap-4">
        <ResultCard title="음성 유형 판단" content={sections.audioType} />
        <div className="grid gap-4 lg:grid-cols-2">
          <ResultCard title="원문 전사" content={sections.transcript} />
          <ResultCard title="한국어 번역" content={sections.translation} />
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <ResultCard title="핵심 개념 요약" content={sections.summary} />
          <ResultCard title="시험 포인트" content={sections.examPoints} />
          <ResultCard title="전공 용어 정리" content={sections.terms} />
        </div>
      </div>

      <details className="mt-6 rounded-3xl bg-gray-50 p-5">
        <summary className="cursor-pointer font-bold">전체 AI 원문 보기</summary>
        <p className="mt-4 whitespace-pre-line text-sm leading-7 text-gray-700">
          {message}
        </p>
      </details>
    </section>
  );
}

function SubjectSelect({
  subject,
  setSubject,
}: {
  subject: string;
  setSubject: (value: string) => void;
}) {
  return (
    <select
      value={subject}
      onChange={(event) => setSubject(event.target.value)}
      className="mb-4 w-full rounded-2xl border border-gray-200 bg-white p-4 text-sm outline-none focus:border-black"
    >
      <option value="">과목을 선택해주세요</option>
      <option value="수학">수학</option>
      <option value="통계학">통계학</option>
      <option value="머신러닝">머신러닝</option>
      <option value="추천시스템">추천시스템</option>
      <option value="일반 영어">일반 영어</option>
    </select>
  );
}

function InfoBox({ number, label }: { number: string; label: string }) {
  return (
    <div className="rounded-2xl bg-white/80 p-4 shadow-sm">
      <p className="text-xl font-bold">{number}</p>
      <p className="mt-1 text-xs text-gray-500">{label}</p>
    </div>
  );
}

function ResultCard({ title, content }: { title: string; content: string }) {
  return (
    <div className="rounded-3xl bg-gray-50 p-5">
      <h3 className="mb-3 text-lg font-black">{title}</h3>
      <p className="whitespace-pre-line text-sm leading-7 text-gray-700">
        {content || "결과가 없습니다."}
      </p>
    </div>
  );
}