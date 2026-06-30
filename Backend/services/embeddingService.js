import { OllamaEmbeddings } from "@langchain/ollama";

const embeddings = new OllamaEmbeddings({
  model: "nomic-embed-text",
  baseUrl: "http://127.0.0.1:11434",
});

const EXPECTED_DIM = 768;
const ZERO_VECTOR = Object.freeze(new Array(EXPECTED_DIM).fill(0));

// 🔥 SIMPLE CACHE (BIG PERFORMANCE BOOST)
const embeddingCache = new Map();

// ⏱️ Timeout wrapper
const withTimeout = (promise, ms = 8000) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Embedding timeout")), ms)
    )
  ]);

// 📏 Normalize vector
const normalize = (v) => {
  const mag = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  if (!mag) return v;
  return v.map(x => x / mag);
};

// 🧹 Clean text (VERY IMPORTANT)
const cleanTextForEmbedding = (text) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")  // remove symbols
    .replace(/\s+/g, " ")
    .trim();
};

// 🧠 Create embedding
export const createEmbedding = async (text, type = "general") => {
  try {
    if (!text || typeof text !== "string") {
      return ZERO_VECTOR;
    }

    let cleanText = text.trim().slice(0, 1000);

    if (!cleanText) return ZERO_VECTOR;

    // 🔥 SPECIAL BOOST FOR USER MEMORY / RESUME
    if (type === "query") {
      cleanText = `user personal info: ${cleanText}`;
    }

    if (type === "memory") {
      cleanText = `user data: ${cleanText}`;
    }

    // 🧹 Clean noise
    cleanText = cleanTextForEmbedding(cleanText);

    // 🔥 CACHE CHECK
    if (embeddingCache.has(cleanText)) {
      return embeddingCache.get(cleanText);
    }

    const vector = await withTimeout(
      embeddings.embedQuery(cleanText)
    );

    if (!Array.isArray(vector) || vector.length !== EXPECTED_DIM) {
      return ZERO_VECTOR;
    }

    const normalized = normalize(vector);

    // 🔥 STORE IN CACHE
    embeddingCache.set(cleanText, normalized);

    return normalized;

  } catch (error) {
    console.error("🔥 Embedding error:", error.message);
    return ZERO_VECTOR;
  }
};