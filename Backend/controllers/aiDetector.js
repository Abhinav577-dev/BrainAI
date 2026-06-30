import { getHeuristicScore } from "../utils/heuristic.js";
import fetch from "node-fetch";

export const detectAIWithLLM = async (text) => {
  try {
    if (!text || text.length < 20) {
      return {
        ai_probability: 0,
        reason: "Text too short"
      };
    }

    const prompt = `
You are an AI content detection system.

Your job is to estimate likelihood that text is AI-generated.

Use this scale:

0-30 → likely human  
30-60 → uncertain  
60-80 → somewhat AI-like  
80-100 → highly AI-like  

IMPORTANT:
- Do NOT give extreme scores unless very obvious
- Most normal text should be 40–70 range
- Be conservative, not overconfident

Return ONLY valid JSON:
{
  "ai_probability": number (0-100),
  "reason": "short explanation"
}

Text:
${text}
`;

    const response = await fetch("http://127.0.0.1:11434/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gemma:2b",
        stream: false,
        options: {
          temperature: 0.2,
          num_predict: 120
        },
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error("Ollama API failed");
    }

    const data = await response.json();

    let output =
      data?.message?.content ||
      data?.response ||
      "{}";

    // 🔥 SAFE JSON PARSE
    let result;

try {
  const jsonMatch = output.match(/\{[\s\S]*\}/);
  result = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
} catch {
  result = null;
}

if (!result) {
  result = {
    ai_probability: 50,
    reason: "Uncertain output"
  };
}

    // 🛑 SANITY CHECK
    if (
      typeof result.ai_probability !== "number" ||
      result.ai_probability < 0 ||
      result.ai_probability > 100
    ) {
      result.ai_probability = 50;
    }

    return result;

  } catch (err) {
    console.error("🔥 LLM Detection Error:", err.message);

    return {
      ai_probability: 50,
      reason: "Detection failed"
    };
  }
};

export const detectAIContent = async (req, res) => {
  try {
    const { text } = req.body;

    const llmResult = await detectAIWithLLM(text);
const heuristicScore = getHeuristicScore(text);

const llm = typeof llmResult?.ai_probability === "number"
  ? llmResult.ai_probability
  : 50;

const heuristic = typeof heuristicScore === "number"
  ? heuristicScore
  : 0;

let weightLLM = 0.6;
let weightHeuristic = 0.4;

if (text.length < 80) {
  weightLLM = 0.8;
  weightHeuristic = 0.2;
}

if (text.length > 300) {
  weightLLM = 0.5;
  weightHeuristic = 0.5;
}

const finalScore = Math.round(
  (llm * weightLLM) + (heuristic * weightHeuristic)
);

res.json({
  ai_probability: finalScore,
  breakdown: {
    llm: llmResult.ai_probability,
    heuristic: heuristicScore
  },
  reason: llmResult.reason
});

  } catch (err) {
    res.status(500).json({ error: "Detection failed" });
  }
};