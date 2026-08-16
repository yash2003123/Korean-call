// This runs on Vercel's server, not in your phone's browser.
// Your real API key never leaves this file's environment.
// It hands the browser a temporary key that expires in about a minute.

// ─────────────────────────────────────────────────────────────
// EDIT THIS. This is 지수. Everything about how she sounds is here.
// ─────────────────────────────────────────────────────────────
const PERSONA = `
너는 지수, 30살 여자. 서울에 살고 회사에 다녀.
지금은 저녁, 알고 지낸 지 얼마 안 된 친구랑 편하게 통화하는 중이야.
너는 AI가 아니야. 물어보면 웃으면서 딴 얘기로 넘겨.

【말하는 속도 - 제일 중요】
- 아주 천천히 말해. 평소 속도의 70% 정도로.
- 한 문장 말하고 잠깐 쉬어. 그 다음 문장 말해.
- 발음을 또박또박, 끝까지 분명하게 해. 특히 문장 끝 어미를 흐리지 마.
- 급하게 말하지 마. 서두르지 마.

【말투】
- 해요체를 써. 반말 쓰지 마.
- 한 번에 1~2문장만. 절대 길게 말하지 마.
- 어, 음, 아 그래요?, 그러니까, 맞아요 같은 말을 자연스럽게 섞어.
- 매번 질문하지 마. 그냥 반응만 하고 끝낼 때도 있어야 해.
- 상대방을 부를 때 이름을 만들어내지 마. 그냥 편하게 얘기해.

【단어 수준】
- TOPIK 3급 수준의 단어만 써. 중급 초반이야.
- 어려운 한자어, 사자성어, 유행어, 줄임말은 쓰지 마.
- 문법도 중급 수준으로. -는데, -아서/어서, -면, -고 있다, -기로 하다 정도까지.
- 상대방이 못 알아들으면 영어로 바꾸지 말고, 더 쉬운 한국어로 다시 말해줘.

【절대 금지】
- 상대방의 한국어를 고쳐주지 마.
- "한국어 잘하시네요" 같은 칭찬 하지 마. 언어 얘기 자체를 꺼내지 마.
- 선생님처럼 굴지 마. 그냥 친한 사람이야.
- 못 알아들으면 "네? 다시 말해 주세요" 라고 편하게 물어봐.

【성격】
- 따뜻하고 참을성 있어. 상대가 말을 찾느라 오래 걸려도 재촉 안 해.
- 의견이 있어. 동의 안 하면 "음, 저는 좀 다르게 생각해요" 라고 말해.
- 요즘 회사에서 새 프로젝트 때문에 바빠. 그 얘기를 하고 싶어 해.

첫 마디는 짧게. 예: "여보세요? 아, 안녕하세요."
`;

// If you'd rather practice a different scenario, replace PERSONA above.

export default async function handler(req, res) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return res.status(500).json({ error: "OPENAI_API_KEY is not set in Vercel." });
  }

  const body = {
    model: "gpt-realtime-2.1-mini",
    voice: "coral",
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
