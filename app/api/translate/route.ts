export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return Response.json({
        success: false,
        error: "GEMINI_API_KEY를 찾지 못했습니다.",
      });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const subject = formData.get("subject") as string | null;

    if (!file) {
      return Response.json({
        success: false,
        error: "음성 파일이 없습니다.",
      });
    }

    if (!subject) {
      return Response.json({
        success: false,
        error: "과목 정보가 없습니다.",
      });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString("base64");
    
const subjectGuide: Record<string, string> = {
  통계학: `
- 확률분포, 확률변수, 추정, 검정 용어를 정확히 번역해.
- expectation은 기댓값으로 번역해.
- variance는 분산으로 번역해.
`,

  머신러닝: `
- overfitting=과적합, underfitting=과소적합
- gradient descent=경사하강법
- loss function=손실 함수
- classification=분류
- regression=회귀
`,

  추천시스템: `
- collaborative filtering=협업 필터링
- content based filtering=콘텐츠 기반 필터링
- matrix factorization=행렬 분해
- similarity=유사도
`,

  일반영어: `
- 자연스럽고 정확한 한국어로 번역해.
`,
};
const prompt = `
너는 영어 전공 강의를 한국어로 번역해주는 AI 학습 도우미야.

과목: ${subject}

가장 중요한 목표:
- 요약하지 말고, 음성에서 들리는 강의 내용을 최대한 빠짐없이 한국어로 자연스럽게 번역해.
- 교수님이 설명한 순서, 예시, 계산 과정, 논리 흐름을 유지해.
- 핵심 요약은 번역이 끝난 뒤에 따로 제공해.
- 모르는 내용은 지어내지 말고 "확실하지 않음"이라고 표시해.

과목별 처리 기준:
${subjectGuide[subject] || subjectGuide["일반 영어"]}

반드시 아래 섹션 제목을 한 글자도 바꾸지 말고 그대로 사용해.

[음성 유형 판단]
강의 / 노래 / 대화 / 기타 중 하나와 이유를 한 문장으로 설명해.

[원문 전사]
영어 음성을 가능한 정확하게 전사해.

[한국어 번역]
강의 내용을 요약하지 말고, 들리는 설명을 최대한 빠짐없이 자연스럽게 한국어로 통번역해.
짧은 bullet 요약으로 만들지 말고 문단형 번역으로 작성해.
수식, 예시, 경우의 수, 계산 과정은 생략하지 마.

[핵심 개념 요약]
- 핵심 1
- 핵심 2
- 핵심 3

[시험 포인트]
- 시험에 나올 만한 개념 1
- 시험에 나올 만한 개념 2
- 헷갈리기 쉬운 부분 1

[전공 용어 정리]
- 영어 용어 → 한국어 용어
- 영어 용어 → 한국어 용어

주의:
- [한국어 번역]이 가장 길어야 해.
- [핵심 개념 요약]에서만 요약해.
- 섹션 제목은 반드시 대괄호 [] 포함해서 그대로 써.
- 마크다운 제목 ##, **굵게**로 섹션 제목을 바꾸지 마.
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
                {
                  inline_data: {
                    mime_type: file.type || "audio/mpeg",
                    data: base64Audio,
                  },
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return Response.json({
        success: false,
        error: data.error?.message || "Gemini API 오류가 발생했습니다.",
      });
    }

    const result =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "응답 텍스트를 찾지 못했습니다.";

    return Response.json({
      success: true,
      result,
    });
  } catch (error: any) {
    return Response.json({
      success: false,
      error: error.message,
    });
  }
}