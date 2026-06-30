export const getHeuristicScore = (text) => {
  if (!text || typeof text !== "string") return 0;

  const words = text.split(/\s+/).filter(Boolean);
  const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 0);

  const wordCount = words.length;
  const sentenceCount = sentences.length || 1;

  if (wordCount < 20) return 20; // 🔥 short text unreliable

  const avgSentenceLength = wordCount / sentenceCount;

  let score = 0;

  // 🧠 1. Sentence structure (moderate weight)
  if (avgSentenceLength > 22) score += 15;
  else if (avgSentenceLength > 16) score += 8;

  // 🧠 2. Low punctuation diversity
  const punctuationCount = (text.match(/[.,!?;]/g) || []).length;
  if (punctuationCount / wordCount < 0.05) score += 10;

  // 🧠 3. Repetition ratio (strong signal)
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  const uniqueness = uniqueWords.size / wordCount;

  if (uniqueness < 0.5) score += 20;
  else if (uniqueness < 0.65) score += 10;

  // 🧠 4. Formal connectors (weak signal)
  if (text.match(/\b(furthermore|moreover|in conclusion|thus|therefore)\b/i)) {
    score += 8;
  }

  // 🧠 5. Burstiness (VERY IMPORTANT)
  const lengths = sentences.map(s => s.split(/\s+/).length);
  const variance =
    lengths.reduce((acc, l) => acc + Math.abs(l - avgSentenceLength), 0) /
    lengths.length;

  if (variance < 4) score += 20;   // very uniform → AI-like
  else if (variance < 7) score += 10;

  // 🧠 6. Vocabulary richness
  if (uniqueness > 0.85) score -= 10; // humans often vary words

  // 🧠 7. Natural imperfections (human-like)
  if (text.match(/\b(lol|uh|hmm|kinda|sort of)\b/i)) {
    score -= 10;
  }

  // 🧠 8. Length normalization
  const lengthFactor = Math.min(wordCount / 200, 1); 
  score = score * lengthFactor;

  return Math.max(0, Math.min(Math.round(score), 100));
};