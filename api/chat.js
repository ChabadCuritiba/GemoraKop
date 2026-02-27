import { generateGemoraReply } from "../gemora-chat.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const result = await generateGemoraReply(req.body?.message);
  return res.status(result.status).json(result.body);
}
