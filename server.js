import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3000;
const GROK_API_KEY = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
const GROK_MODEL = process.env.GROK_MODEL || process.env.XAI_MODEL || "grok-3-mini";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

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

app.post("/api/chat", async (req, res) => {
  try {
    const userMessage = String(req.body?.message || "").trim();
    if (!userMessage) {
      return res.status(400).json({ error: "Message is required." });
    }

    if (!isGemoraQuestion(userMessage)) {
      return res.status(400).json({
        error: "Gemora Kop only answers Gemora-related questions."
      });
    }

    if (!GROK_API_KEY) {
      return res.status(500).json({
        error: "Missing GROK_API_KEY. Add it to your .env file."
      });
    }

    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROK_API_KEY}`
      },
      body: JSON.stringify({
        model: GROK_MODEL,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "You are Gemora Kop. You only answer questions about Gemora/Talmud and related classic mefarshim. If the user asks anything else, refuse briefly and ask for a Gemora question."
          },
          {
            role: "user",
            content: userMessage
          }
        ]
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return res
        .status(502)
        .json({ error: "Grok request failed.", details: errorBody });
    }

    const data = await response.json();
    const reply =
      data?.choices?.[0]?.message?.content?.trim() ||
      "I can only answer Gemora-related questions.";

    return res.json({ reply });
  } catch (error) {
    return res.status(500).json({
      error: "Unexpected server error.",
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

app.listen(PORT, () => {
  console.log(`Gemora Kop server running at http://localhost:${PORT}`);
});
