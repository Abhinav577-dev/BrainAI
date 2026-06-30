export const chunkTextSemantically = (
  text,
  chunkSize = 180,
  overlap = 40
) => {

  if (!text) return [];

  // normalize text
  text = text
    .replace(/\s+/g, " ")
    .trim();

  const words =
    text.split(" ");

  const chunks = [];

  for (
    let i = 0;
    i < words.length;
    i += chunkSize - overlap
  ) {

    const chunk =
      words
        .slice(i, i + chunkSize)
        .join(" ")
        .trim();

    if (
      chunk.split(" ").length > 30
    ) {

      chunks.push(chunk);
    }
  }

  return chunks;
};