const GEMORA_KEYWORDS = [
  "gemora",
  "gemoro",
  "gemor",
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
  if (GEMORA_KEYWORDS.some((keyword) => input.includes(keyword))) {
    return true;
  }

  // Allow common typos/transliterations like "gemoro"/"gmara".
  return /g[ea]m[oa]r?a?/.test(input);
}

export async function generateGemoraReply(userMessage) {
  const message = String(userMessage || "").trim();
  if (!message) {
    return { status: 400, body: { error: "Message is required." } };
  }

  const likelyGemora = isGemoraQuestion(message);

  const hasGrokKey = Boolean(process.env.GROK_API_KEY || process.env.XAI_API_KEY);
  const hasGroqKey = Boolean(process.env.GROQ_API_KEY);
  const preferredProvider = String(process.env.LLM_PROVIDER || "")
    .trim()
    .toLowerCase();

  if (!hasGrokKey && !hasGroqKey) {
    return {
      status: 500,
      body: {
        error:
          "Missing API key. Add GROK_API_KEY (or GROQ_API_KEY) to your environment."
      }
    };
  }

  let provider;
  if (preferredProvider === "groq") {
    provider = hasGroqKey ? "groq" : "grok";
  } else if (preferredProvider === "grok" || preferredProvider === "xai") {
    provider = hasGrokKey ? "grok" : "groq";
  } else {
    // Default to Llama on Groq when available.
    provider = hasGroqKey ? "groq" : "grok";
  }

  const apiKey =
    provider === "grok"
      ? process.env.GROK_API_KEY || process.env.XAI_API_KEY
      : process.env.GROQ_API_KEY;
  const endpoint =
    provider === "grok"
      ? "https://api.x.ai/v1/chat/completions"
      : "https://api.groq.com/openai/v1/chat/completions";
  const deprecatedGroqModelMap = {
    "llama-3.1-70b-versatile": "llama-3.3-70b-versatile",
    "llama-3.1-70b-specdec": "llama-3.3-70b-versatile",
    "llama3-70b-8192": "llama-3.3-70b-versatile",
    "llama3-8b-8192": "llama-3.1-8b-instant"
  };

  const requestedGroqModel =
    String(process.env.GROQ_MODEL || "llama-3.3-70b-versatile").trim() ||
    "llama-3.3-70b-versatile";
  const normalizedGroqModel =
    deprecatedGroqModelMap[requestedGroqModel] || requestedGroqModel;

  const model =
    provider === "grok"
      ? process.env.GROK_MODEL || process.env.XAI_MODEL || "grok-3-mini"
      : normalizedGroqModel;

  const messagePayload = [
    {
      role: "system",
      content:
        "You are Gemora Kop. You only answer questions about Gemora/Talmud and related classic mefarshim. If the user asks anything else, refuse briefly and ask for a Gemora question."
    },
    {
      role: "system",
      content: likelyGemora
        ? "The user message is likely Gemora-related. Answer directly and clearly."
        : "The user message may be off-topic. If it is not Gemora-related, refuse briefly."
    },
    {
      role: "user",
      content: message
    }
  ];

  try {
    const attemptModels =
      provider === "groq"
        ? Array.from(
            new Set([model, "llama-3.3-70b-versatile", "llama-3.1-8b-instant"])
          )
        : [model];

    let data;
    let lastFailureDetails = "";

    for (const attemptModel of attemptModels) {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: attemptModel,
          temperature: 0.2,
          messages: messagePayload
        })
      });

      if (response.ok) {
        data = await response.json();
        break;
      }

      const details = await response.text();
      lastFailureDetails = details;

      const isRetriableGroqModelError =
        provider === "groq" &&
        /model_decommissioned|model_not_found|does not exist/i.test(details);

      if (!isRetriableGroqModelError) {
        return {
          status: 502,
          body: { error: "Model request failed.", details }
        };
      }
    }

    if (!data) {
      return {
        status: 502,
        body: { error: "Model request failed.", details: lastFailureDetails }
      };
    }

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
