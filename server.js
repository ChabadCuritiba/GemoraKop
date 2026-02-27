import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { generateGemoraReply } from "./gemora-chat.js";

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/chat", async (req, res) => {
  const result = await generateGemoraReply(req.body?.message);
  return res.status(result.status).json(result.body);
});

app.listen(PORT, () => {
  console.log(`Gemora Kop server running at http://localhost:${PORT}`);
});
