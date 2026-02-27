const GEMORA_KEYWORDS = [
  "gemora",
  "gemara",
  "talmud",
  "mishnah",
  "mishna",
  "sugya",
  "daf",
  "rashi",
  "tosafot",
  "tosfos",
  "halacha",
  "halakhah",
  "rabbi",
  "chazal",
  "beit din",
  "bava",
  "berakhot",
  "shabbat",
  "eruvin",
  "pesachim",
  "yoma",
  "sukkah",
  "beitzah",
  "rosh hashanah",
  "taanit",
  "megillah",
  "moed",
  "ketubot",
  "gittin",
  "kiddushin",
  "sanhedrin",
  "avodah zarah",
  "horayot",
  "zevachim",
  "menachot",
  "chullin",
  "bekhorot",
  "arachin",
  "temurah",
  "keritot",
  "meilah",
  "niddah"
];

function isGemoraQuestion(text) {
  const input = String(text || "").toLowerCase();
  return GEMORA_KEYWORDS.some((keyword) => input.includes(keyword));
}

export async function generateGemoraReply(userMessage) {
  const message = String(userMessage || "").trim();
  if (!message) {
    return { status: 400, body: { error: "Message is required." } };
  }

  if (!isGemoraQuestion(message)) {
    return {
      status: 400,
      body: { error: "Gemora Kop only answers Gemora-related questions." }
    };
  }

  const grokApiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
  const grokModel =
    process.env.GROK_MODEL || process.env.XAI_MODEL || "grok-3-mini";

  if (!grokApiKey) {
    return {
      status: 500,
      body: { error: "Missing GROK_API_KEY. Add it to your environment." }
    };
  }

  try {
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${grokApiKey}`
      },
      body: JSON.stringify({
        model: grokModel,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "You are Gemora Kop. You only answer questions about Gemora/Talmud and related classic mefarshim. If the user asks anything else, refuse briefly and ask for a Gemora question."
          },
          {
            role: "user",
            content: message
          }
        ]
      })
    });

    if (!response.ok) {
      const details = await response.text();
      return {
        status: 502,
        body: { error: "Grok request failed.", details }
      };
    }

    const data = await response.json();
    const reply =
      data?.choices?.[0]?.message?.content?.trim() ||
      "I can only answer Gemora-related questions.";

    return { status: 200, body: { reply } };
  } catch (error) {
    return {
      status: 500,
      body: {
        error: "Unexpected server error.",
        details: error instanceof Error ? error.message : String(error)
      }
    };
  }
}
