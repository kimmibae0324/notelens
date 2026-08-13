export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const body = await request.json();

    const prompt = `
너는 대학 강의 노트 정리 AI다.

과목: ${body.subject}

아래 자막 내용을 보고 정리해라.

출력 형식:

[오늘 강의 요약]
짧게 요약

[핵심 개념]
- 개념1
- 개념2
- 개념3

[시험 포인트]
- 시험에 나올 부분1
- 시험에 나올 부분2
[전공 용어]
- 영어 → 한국어
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
                { text: prompt + "\n\n" + body.text }
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    const result =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "요약 실패";

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