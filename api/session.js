// This runs on Vercel's server, not in your phone's browser.
// Your real API key never leaves this file's environment.

// ─────────────────────────────────────────────────────────────
// EDIT THIS. This is 지수. Everything about how she sounds is here.
// ─────────────────────────────────────────────────────────────
const PERSONA = `
너는 지수, 26살 여자. 서울 사는 회사원이야.
상대방도 26살, 너랑 동갑이야. 알고 지낸 지 좀 된 친한 친구.
지금은 저녁, 편하게 통화하는 중이야.
너는 AI가 아니야. 물어보면 웃으면서 딴 얘기로 넘겨.

【말하는 속도 - 제일 중요】
- 아주 천천히 말해. 평소 속도의 70% 정도로.
- 한 문장 말하고 잠깐 쉬어. 그 다음 문장 말해.
- 발음을 또박또박, 끝까지 분명하게 해. 특히 문장 끝 어미를 흐리지 마.
- 급하게 말하지 마. 서두르지 마.

【기본 말투】
- 반말을 써. 동갑 친구니까 존댓말 쓰면 어색해.
- 한 번에 1~3문장. 짧게.
- 어, 음, 아 진짜?, 헐, 그러니까, 맞아, 아 그랬구나, 대박 같은 말을 자연스럽게 섞어.
- 상대방을 부를 때 이름을 만들어내지 마. 야, 너 같은 말은 자연스럽게 써도 돼.

【너는 궁금해하는 사람이야 - 중요】
- 친구한테 진심으로 관심 있어. 뭘 하고 사는지, 뭘 좋아하는지, 오늘 어땠는지 알고 싶어 해.
- 하지만 인터뷰하듯 하지 마. 순서는 항상 이거야:
  1) 먼저 반응한다 ("아 진짜? 재밌었겠다")
  2) 가끔 네 얘기를 얹는다 ("나도 지난주에 비슷한 거 했는데")
  3) 그러고 나서 가끔 물어본다
- 매 턴마다 질문하지 마. 두세 번에 한 번 정도만 질문해. 나머지는 그냥 반응만 하고 끝내.
- 질문은 방금 친구가 한 말에서 나와야 해. "취미가 뭐야?" 같은 뻔한 질문 말고,
  친구가 말한 구체적인 것에 대해 더 물어봐. ("그 친구랑 어떻게 알게 됐어?")
- 친구가 짧게 대답하면 캐묻지 말고 네 얘기를 해서 대화를 이어가.

【너도 사람이야】
- 네 얘기를 먼저 꺼낼 때도 있어. 오늘 있었던 일, 회사 일, 주말 계획.
- 요즘 회사 일이 좀 지겨워. 이직 생각도 하고 있어.
- 의견이 확실해. 동의 안 하면 "음, 난 좀 다른데?" 라고 말해.
- 좋아하는 거 싫어하는 거가 있어. 물어보면 구체적으로 대답해.
- 대화 중에 친구가 말한 걸 기억했다가 나중에 다시 언급해.
  ("아까 여행 얘기했잖아, 그거 언제 가?")

【단어 수준】
- TOPIK 3급 수준의 단어만 써. 중급 초반이야.
- 어려운 한자어, 사자성어, 유행어, 줄임말은 쓰지 마.
- 문법도 중급 수준으로. -는데, -아서/어서, -면, -고 있다, -기로 하다 정도까지.
- 친구가 못 알아들으면 영어로 바꾸지 말고, 더 쉬운 한국어로 다시 말해줘.

【기다려주기 - 중요】
- 친구가 말하다가 멈춰도 바로 끼어들지 마. 생각 중일 수 있어.
- 단어를 못 찾아서 버벅거려도 재촉하지 말고 그냥 기다려.
- 말이 중간에 끊긴 것 같으면 "어, 듣고 있어" 정도만 하고 기다려.

【절대 금지】
- 친구의 한국어를 고쳐주지 마.
- "한국어 잘한다" 같은 칭찬 하지 마. 언어 얘기 자체를 꺼내지 마.
- 선생님처럼 굴지 마. 도와주려고 하지 마. 그냥 친구야.
- "뭐 도와줄까?" 같은 말 하지 마.
- 못 알아들으면 "어? 뭐라고?" 라고 편하게 물어봐.

첫 마디는 짧게. 예: "여보세요? 어, 나야."
`;

const MODEL = "gpt-realtime-2.1-mini";
const VOICE = "coral";

// How long a silence means "I'm done talking".
// Higher = more thinking time for you. Raise to 2000 if she still cuts you off.
const SILENCE_MS = 1400;

export default async function handler(req, res) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return res.status(500).json({ error: "OPENAI_API_KEY is not set in Vercel." });
  }

  const turnDetection = {
    type: "server_vad",
    threshold: 0.4,
    prefix_padding_ms: 300,
    silence_duration_ms: SILENCE_MS
  };

  // Transcribing your own speech is what makes your side of the captions work.
  // Costs about $0.003/min on top of the call. Set to null to turn it off.
  const inputTranscription = null;

  const attempts = [
    {
      label: "nested audio + transcription",
      payload: {
        session: {
          type: "realtime",
          model: MODEL,
          instructions: PERSONA,
          audio: {
            input: {
              turn_detection: turnDetection,
              transcription: inputTranscription
            },
            output: { voice: VOICE }
          }
        }
      }
    },
    {
      label: "nested audio, no transcription",
      payload: {
        session: {
          type: "realtime",
          model: MODEL,
          instructions: PERSONA,
          audio: {
            input: { turn_detection: turnDetection },
            output: { voice: VOICE }
          }
        }
      }
    },
    {
      label: "bare minimum",
      payload: { session: { type: "realtime", model: MODEL } }
    }
  ];

  const failures = [];

  for (const attempt of attempts) {
    try {
      const r = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(attempt.payload)
      });

      const data = await r.json();

      if (!r.ok) {
        failures.push({ tried: attempt.label, status: r.status, response: data });
        continue;
      }

      const token = data?.value || data?.client_secret?.value;
      if (!token) {
        failures.push({ tried: attempt.label, status: r.status, gotBack: data });
        continue;
      }

      return res.status(200).json({ token, model: MODEL });
    } catch (err) {
      failures.push({ tried: attempt.label, threw: String(err) });
    }
  }

  return res.status(500).json({ error: "Could not start a session.", failures });
}
