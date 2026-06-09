const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");

exports.translate = onRequest({ invoker: "public", cors: true }, async (req, res) => {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { text, from, to } = req.body;
  if (!text || !text.trim()) {
    res.status(400).json({ error: "No text provided" });
    return;
  }

  const prompt = from === "auto"
    ? `Translate the following text to ${to}. Return only the translated text, nothing else.\n\n${text}`
    : `Translate the following text from ${from} to ${to}. Return only the translated text, nothing else.\n\n${text}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await response.json();
    const translated = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!translated) {
      logger.error("[translate] empty response:", JSON.stringify(data));
      res.status(500).json({ error: "翻譯失敗" });
      return;
    }

    res.set("Cache-Control", "no-store");
    res.status(200).json({ translated });
  } catch (err) {
    logger.error("[translate] error:", err);
    res.status(500).json({ error: "翻譯失敗，請稍後再試" });
  }
});
