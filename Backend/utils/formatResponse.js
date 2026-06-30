export const formatResponse = (
  answer
) => {

  if (!answer) return "";

  return answer

    .replace(/\*\*/g, "")

    .replace(/\n{3,}/g, "\n\n")

    .replace(/[ \t]+\n/g, "\n")

    .trim();
};