export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return Response.json({
        success: false,
        error: "GEMINI_API_KEY가 없습니다.",
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

    const arrayBuffer = await file.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString("base64");

const prompt = `
너는 영어 전공 강의를 한국어로 바꿔주는 스마트 강의 자막 AI다.

과목: ${subject}

목표:
- 실시간 단어 자막이 아니라, 문장이 어느 정도 완성된 자연스러운 한국어 자막을 만든다.
- 끊긴 단어, 시간표시, 의미 없는 반복은 제거한다.
- 15초 안에 들린 내용을 1~3개의 완성된 한국어 문장으로 정리한다.
- 설명을 덧붙이지 말고, 자막 문장만 출력한다.
- 수학/통계 용어는 전공 맥락에 맞게 정확히 번역한다.

번역 기준:
- expectation → 기댓값
- random variable → 확률변수
- distribution → 분포
- binomial coefficient → 이항계수
- outcome → 경우의 수 또는 결과
- Bernoulli trial → 베르누이 시행

출력 예시:
이항계수를 사용하면 5번 중 2번 성공하는 경우의 수를 계산할 수 있습니다.
베르누이 시행을 여러 번 반복하면 이항분포를 따릅니다.

주의:
- 타임스탬프는 절대 출력하지 마라.
- 원문 영어는 출력하지 마라.
- "네, 알겠습니다" 같은 말은 출력하지 마라.
- 들리지 않는 내용은 지어내지 마라.
중요:
- [원문 전사]에는 영어 원문만 써. 한국어 번역이나 요약을 절대 넣지 마.
- [한국어 번역]에는 한국어 번역문만 써. 핵심 요약, 시험 포인트, 용어 정리를 절대 넣지 마. 영어 원문을 자연스러운 한국어 문단으로 통번역해.
- [핵심 개념 요약]에는 요약 bullet만 써. 번역문을 반복하지 마.
- [시험 포인트]에는 시험에 나올 만한 포인트만 써. 번역문을 반복하지 마.
- [전공 용어 정리]에는 용어쌍만 써.
- 각 섹션의 내용은 서로 중복하지 마.
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: file.type || "audio/webm",
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
        error: data.error?.message || "Gemini 오류",
      });
    }

    const result =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "자막 생성 실패";

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