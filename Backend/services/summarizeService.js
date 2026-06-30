export const summarizeText = async (text) => {
  try {
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return "";
    }

    const prompt = `
You are BrainAI.

Summarize the text while PRESERVING important details.

Rules:
- Keep key information (projects, skills, technologies, roles)
- 1–2 sentences allowed
- Maximum 40 words
- Do NOT remove important nouns or keywords
- No prefixes like "Summary:"

Text:
${text}

Answer:
`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch("http://127.0.0.1:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: "gemma:2b",
        stream: false,
        options: {
          temperature: 0.2,
          num_predict: 80
        },
        messages: [{ role: "user", content: prompt }]
      })
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Ollama HTTP error: ${response.status}`);
    }

    const data = await response.json();

    let summary =
      data?.message?.content ||
      data?.response ||
      text;

    if (typeof summary !== "string") {
      summary = String(summary || "");
    }

    // 🔥 CLEANING
    summary = summary
      .replace(/summary\s*:/i, "")
      .replace(/[-•]/g, "")
      .replace(/\d+\./g, "")
      .replace(/["“”]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    // 🔒 SOFT LIMIT (40 words, not aggressive)
    summary = summary.split(" ").slice(0, 40).join(" ");

    // 🛟 FALLBACK (IMPORTANT FIX)
    if (!summary || summary.length < 10) {
      const sentences = text.split(/[.!?]/).slice(0, 2).join(". ");
      return sentences.slice(0, 150);
    }

    return summary;

  } catch (err) {
    console.error("🔥 Summarization error:", err.message);

    const sentences = text?.split(/[.!?]/).slice(0, 2).join(". ");
    return sentences
      ? sentences.slice(0, 150)
      : (text || "").slice(0, 150);
  }
};