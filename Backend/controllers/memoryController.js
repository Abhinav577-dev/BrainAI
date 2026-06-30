import Memory from "../models/Memory.js";
import { createEmbedding } from "../services/embeddingService.js";
import { generateResponse } from "../services/llmService.js";
import { summarizeText } from "../services/summarizeService.js";


// 🧠 INTENT DETECTION
const detectIntent = (text) => {
  const q = text.toLowerCase().trim();

  if (["hi", "hello", "hey", "hii", "greetings"].includes(q)) {
    return "greeting";
  }

  if (
    q.includes("my") ||
    q.includes("saved") ||
    q.includes("remember") ||
    q.includes("memory")
  ) {
    return "memory";
  }

  return "knowledge";
};

// 🧠 COSINE SIMILARITY
const cosineSimilarity = (a, b) => {
  if (!a || !b || a.length === 0 || b.length === 0) return 0;

  const dot = a.reduce((sum, val, i) => sum + val * (b[i] || 0), 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

  if (magA === 0 || magB === 0) return 0;

  return dot / (magA * magB);
};

// 🧠 RECENCY SCORE
const getRecencyScore = (createdAt) => {
  if (!createdAt) return 0.3;

  const now = new Date();
  const diffDays =
    (now - new Date(createdAt)) / (1000 * 60 * 60 * 24);

  if (diffDays < 1) return 1;
  if (diffDays < 7) return 0.8;
  if (diffDays < 30) return 0.5;
  return 0.3;
};

// 🧠 CONFIDENCE
const getConfidence = (score) => {
  if (score > 0.85) return "High";
  if (score > 0.7) return "Medium";
  return "Low";
};

// 🔍 SEARCH MEMORY
// 🔍 SEARCH MEMORY
export const searchMemory = async (req, res) => {

  try {

    const { query, mode: userMode } = req.body;

    // =========================================
    // ❌ EMPTY QUERY
    // =========================================
    if (!query || query.trim() === "") {

      return res.status(400).json({
        error: "Query is empty"
      });
    }

    // =========================================
    // 🧠 DETECT MODE
    // =========================================
    const detectedIntent =
      detectIntent(query);

    const mode =
      userMode || detectedIntent;

    // =========================================
    // 👋 GREETING MODE
    // =========================================
    if (detectedIntent === "greeting") {

      const replies = [
        "Hello! 👋 How can I help you?",
        "Hey! 😊 What would you like to know?",
        "Hi there! 👋"
      ];

      return res.json({

        answer:
          replies[
            Math.floor(
              Math.random() * replies.length
            )
          ],

        sources: [],

        explain: {
          mode: "greeting",
          confidence: "High"
        }
      });
    }

    // =========================================
    // 🔥 CLEAN ANCHOR
    // =========================================
    const makeAnchor = (
      text,
      maxLen = 180
    ) => {

      const t = text

  // preserve paragraphs
  .replace(/[ \t]+/g, " ")

  // normalize excessive line breaks
  .replace(/\n{3,}/g, "\n\n")

  .trim();

return t.length > maxLen
  ? t.slice(0, maxLen) + "..."
  : t;
    };

    // =========================================
    // 🌍 KNOWLEDGE MODE
    // =========================================
    // NO PDF RETRIEVAL
    // NO MEMORY SEARCH
    // LET LLM USE GENERAL KNOWLEDGE
    // =========================================
    if (mode === "knowledge") {

      console.log(
        "🌍 KNOWLEDGE MODE ENABLED"
      );

      const answer =
        await generateResponse(
          "",
          query,
          "knowledge"
        );

      return res.json({

        answer,

        sources: [],

        explain: {
          mode: "knowledge",
          confidence: "High"
        }
      });
    }

    // =========================================
    // 🧠 MEMORY MODE
    // =========================================

    // 🔥 CREATE QUERY EMBEDDING
    // 🔥 QUERY EXPANSION
let enhancedQuery = query;

if (
  query.toLowerCase().includes("plant")
) {

  enhancedQuery += `
plant disease
fruit disease
anthracnose
alternaria
bacterial blight
cercospora
`;
}

const queryEmbedding =
  await createEmbedding(
    enhancedQuery
  );

    // 🔥 FETCH MEMORIES
    const memories =
      await Memory.find({
        userId: req.userId
      });

    // 🔥 QUERY WORDS
    const queryWords =
      query
        .toLowerCase()
        .split(/\s+/)
        .filter(
          word => word.length > 2
        );

    // =========================================
    // 🔥 HYBRID SCORING
    // =========================================
    const scored = memories.map(mem => {

      const similarity =
        cosineSimilarity(
          queryEmbedding,
          mem.embedding || []
        );

      const importance =
        (mem.importance || 1) / 5;

      const recency =
        getRecencyScore(
          mem.createdAt
        );

      const memoryText =
        (mem.text || "")
          .toLowerCase();

      // 🔥 KEYWORD MATCHING
      let matchedWords = 0;

      for (const word of queryWords) {

        if (
          memoryText.includes(word)
        ) {
          matchedWords++;
        }
      }

      const keywordScore =
        matchedWords /
        Math.max(
          queryWords.length,
          1
        );

      // 🔥 EXACT MATCH
      const exactMatch =
        memoryText.includes(
          query.toLowerCase()
        )
          ? 1
          : 0;

      // 🔥 PDF BOOST
      const pdfBoost =
  mem.source
    ?.toLowerCase()
    .endsWith(".pdf")
      ? 0.08
      : 0;

      // 🔥 FINAL SCORE
      const finalScore =

  similarity * 0.25 +
  keywordScore * 0.55 +
  exactMatch * 0.10 +
  importance * 0.05 +
  recency * 0.05 +
  pdfBoost;

      return {

        text: mem.text,

        score: similarity,

        keywordScore,

        exactMatch,

        finalScore,

        source: mem.source,

        fileId: mem.fileId,

        chunkIndex: mem.chunkIndex,

        page: mem.page,

        createdAt: mem.createdAt
      };
    });

    // =========================================
    // 🔥 SORT RESULTS
    // =========================================
    const exactResults =
      scored.filter(
        r => r.exactMatch === 1
      );

    let sorted = [];

    if (exactResults.length > 0) {

      sorted =
        exactResults.sort(
          (a, b) =>
            b.finalScore -
            a.finalScore
        );

    } else {

      sorted =
        scored
          .filter(
            x =>
              !Number.isNaN(
                x.score
              )
          )
          .sort(
            (a, b) =>
              b.finalScore -
              a.finalScore
          );
    }

    // =========================================
    // 🔥 TOP K
    // =========================================
    const TOP_K = 10;

    let candidates =
      sorted.slice(0, TOP_K);

    // 🔥 MEMORY THRESHOLD
    const MEMORY_THRESHOLD = 0.15;

    candidates =
      candidates.filter(
        x =>
          x.finalScore >
          MEMORY_THRESHOLD
      );

    // =========================================
    // 🔥 REMOVE DUPLICATES
    // =========================================
    const uniqueResults = [];

    const seen = new Set();

    for (const r of candidates) {

      const key =
        r.text
          .toLowerCase()
          .replace(/\s+/g, " ")
          .slice(0, 120);

      if (!seen.has(key)) {

        uniqueResults.push(r);

        seen.add(key);
      }
    }

    // =========================================
    // 🔥 FINAL RESULTS
    // =========================================
    const FINAL_K = 8;

    const filteredResults = uniqueResults.filter(r => {

  const t =
    r.text.toLowerCase();

  // ❌ noisy ML evaluation content
  if (
    t.includes("f1-score") ||
    t.includes("classification accuracy") ||
    t.includes("confusion matrix") ||
    t.includes("dataset composition") ||
    t.includes("precision values")
  ) {
    return false;
  }

  return true;
});

    const topResults =
  filteredResults.slice(0, FINAL_K);

    // =========================================
    // ❌ NO MEMORY FOUND
    // =========================================
    if (topResults.length === 0) {

      return res.json({

        answer:
          "⚠️ No relevant memory found.",

        sources: [],

        explain: {
          mode: "memory",
          confidence: "Low"
        }
      });
    }

    // =========================================
    // 🔥 BUILD CONTEXT
    // =========================================
    let context = topResults
.map((r, i) => {

  const cleanedText =
    r.text
      ?.replace(/\s+/g, " ")
      .trim();

  return `

=================================
MEMORY CHUNK ${i + 1}
=================================

Source:
${r.source || "Unknown"}

Content:
${cleanedText}

`;

})

    // =========================================
    // 🤖 GENERATE RESPONSE
    // =========================================
    const answer =
      await generateResponse(
        context,
        query,
        "memory"
      );

    // =========================================
    // 🔥 SOURCES
    // =========================================
    const sourcesWithHighlight =
      topResults.map(r => ({

        text:
  r.text.slice(0, 1200),

        highlighted:
          highlightMatch(
            r.text,
            query
          ),

        anchor:
          makeAnchor(r.text),

        score: r.score,

        keywordScore:
          r.keywordScore,

        exactMatch:
          r.exactMatch,

        finalScore:
          r.finalScore,

        source: r.source,

        fileId: r.fileId,

        chunkIndex:
          r.chunkIndex,

        page: r.page
      }));

    // =========================================
    // ✅ FINAL RESPONSE
    // =========================================
    res.json({

      answer,

      sources:
        sourcesWithHighlight,

      explain: {

        mode: "memory",

        confidence:
          getConfidence(
            topResults[0]
              ?.finalScore || 0
          ),

        retrieval: {

          totalMemories:
            memories.length,

          matchedResults:
            topResults.length,

          exactMatches:
            exactResults.length
        }
      }
    });

  } catch (err) {

    console.error(
      "🔥 ERROR:",
      err
    );

    res.status(500).json({
      error: err.message
    });
  }
};

// ➕ ADD MEMORY
export const addMemory = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "Text is empty" });
    }

    const summary = await summarizeText(text);
    const cleanSummary = summary.split(" ").slice(0, 40).join(" ");

    const embedding = await createEmbedding(cleanSummary);

    const memory = new Memory({
      userId: req.userId,
      text: cleanSummary,
      embedding,
      importance: cleanSummary.length > 50 ? 3 : 2
    });

    await memory.save();

    res.json({
      message: "Memory stored successfully 🧠",
      data: memory
    });

  } catch (error) {
    console.error("🔥 ERROR IN addMemory:", error);
    res.status(500).json({
      error: error.message
    });
  }
};

// 🔍 improved highlighter
const highlightMatch = (chunk, query) => {
  const q = query
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter(w => w.length > 3);

  let highlighted = chunk;

  q.forEach(word => {
    const re = new RegExp(`(${word})`, "ig");
    highlighted = highlighted.replace(re, "<mark>$1</mark>");
  });

  return highlighted;
};