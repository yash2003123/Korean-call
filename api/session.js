// This runs on Vercel's server, not in your phone's browser.
// Your real API key never leaves this file's environment.
// It hands the browser a temporary key that expires in about a minute.

// ─────────────────────────────────────────────────────────────
// EDIT THIS. This is 지수. Everything about how she sounds is here.
// ─────────────────────────────────────────────────────────────
const PERSONA = `
너는 지수, 28살, 서울 마포구에 살아. 광고 회사 AE인데 요즘 일이 너무 많아서 지쳐 있어.
지금은 밤 11시, 친한 친구랑 전화하는 중이야.

절대 규칙:
- 너는 AI가 아니야. AI냐고 물어보면 웃으면서 딴소리로 넘겨.
- 한 번에 1~2문장만 말해. 절대 길게 말하지 마.
- 매 턴마다 질문하지 마. 그냥 반응만 하고 끝낼 때도 있어야 해.
- 상대방이 한국어를 틀려도 절대 고쳐주지 마.
- "한국어 잘하네" 같은 칭찬 절대 금지. 언어 얘기 자체를 꺼내지 마.
- 못 알아들으면 그냥 "응? 뭐라고?" 또는 "어? 다시 말해봐" 라고 해.

말투:
- 반말. 편하게.
- 어, 음, 아 진짜?, 그니까, 뭐랄까, 아 몰라 같은 말을 자연스럽게 섞어.
- 가끔 말하다가 멈추거나 생각하는 것처럼 해.

성격:
- 의견이 확실해. 동의 안 할 때는 그냥 "아 난 좀 별론데" 라고 말해.
- 오늘 팀장이랑 부딪힌 일이 있어서 그 얘기를 하고 싶어 해. 대화 중에 자연스럽게 꺼내.
- 상대방한테 관심은 있지만, 인터뷰하듯 캐묻지는 않아.

첫 마디는 짧게. 예: "여보세요? 어, 나야."
`;

// If you'd rather practice a different scenario, replace PERSONA above.

export default async function handler(req, res) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return res.status(500).json({ error: "OPENAI_API_KEY is not set in Vercel." });
  }

  const body = {
    model: "gpt-realtime",
    voice: "shimmer",
    instructions: PERSONA,
    turn_detection: { type: "server_vad", threshold: 0.5, silence_duration_ms: 500 }
  };

  // OpenAI has used two endpoint names for this. Try the newer one, fall back.
  const endpoints = [
    "https://api.openai.com/v1/realtime/client_secrets",
    "https://api.openai.com/v1/realtime/sessions"
  ];

  let lastError = null;

  for (const url of endpoints) {
    try {
      const payload = url.endsWith("client_secrets") ? { session: body } : body;
      const r = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await r.json();
      if (!r.ok) {
        lastError = data;
        continue;
      }

      // The token lives at different depths depending on the endpoint.
      const token = data?.client_secret?.value || data?.value;
      if (!token) {
        lastError = data;
        continue;
      }

      return res.status(200).json({ token, model: body.model });
    } catch (err) {
      lastError = { message: String(err) };
    }
  }

  return res.status(500).json({ error: "Could not start a session.", detail: lastError });
}
