export const generateResponse = async (
  context,
  query,
  mode
) => {

  try {

    // =========================================
    // 🔥 MODEL CONFIG
    // =========================================
    const modelName =
      "phi3:mini";

    // =========================================
    // 🔥 EMPTY MEMORY CHECK
    // =========================================
    if (

      mode === "memory" &&

      (!context ||
       String(context)
  .trim()
  .length === 0)

    ) {

      return "Not found in memory";
    }

    let prompt;
    let maxTokens;

    // =========================================
    // 🧠 MEMORY MODE
    // =========================================
    if (mode === "memory") {

      maxTokens = 400;

      
      prompt = `

========================
MEMORY CONTEXT
========================

${context}

========================
QUESTION
========================

${query}

========================
IMPORTANT INSTRUCTIONS
========================

Follow this structure EXACTLY.

- Use markdown headings
- Use bullet points
- Use spacing between sections
- Do NOT generate giant paragraphs
- Do NOT start with:
  "Sure, here's..."
- Keep sections concise and readable

========================
RESPONSE FORMAT
========================

# ${query}

## Introduction

## Core Concepts

## Working Principle

## Key Technologies

## Advantages

## Challenges

## Applications

## Future Scope

Begin now:

`;
    }

    // =========================================
    // 🌍 KNOWLEDGE MODE
    // =========================================
    else {

      maxTokens = 512;

      prompt = `
You are BrainAI,
an intelligent AI assistant.

Answer the user's question clearly,
naturally,
and in detail.

Guidelines:
- Use your own knowledge
- Explain concepts structurally
- Be informative and conversational
- Avoid unnecessary refusal
- Never say:
  "context does not provide information"

${context
  ? `Additional Context:\n${context}`
  : ""}

User Question:
${query}

Helpful Answer:
`;
    }

    

    // =========================================
    // ⏱️ REQUEST CONTROL
    // =========================================
    const controller =
      new AbortController();

    const timeout =
      setTimeout(

        () => controller.abort(),

        150000
      );

    // =========================================
    // 🤖 OLLAMA REQUEST
    // =========================================
    const response =
      await fetch(

      "http://127.0.0.1:11434/api/chat",

      {

        method: "POST",

        headers: {

          "Content-Type":
            "application/json"
        },

        signal:
          controller.signal,

        body: JSON.stringify({

          model:
            modelName,

          stream: false,

          options: {

            temperature:

              mode === "memory"
                ? 0.15
                : 0.25,

            num_predict:
              maxTokens,

            top_p: 0.9,

            repeat_penalty:
              1.1
          },

          messages: [

            {
              role: "user",

              content:
                prompt
            }
          ]
        })
      }
    );

    clearTimeout(timeout);

    // =========================================
    // ❌ RESPONSE ERROR
    // =========================================
    if (!response.ok) {

      throw new Error(

        `Ollama HTTP error: ${response.status}`
      );
    }

    // =========================================
    // 📦 PARSE RESPONSE
    // =========================================
    const data =
      await response.json();
    

    // =========================================
    // 🧠 EXTRACT ANSWER
    // =========================================
    let answer =

      data?.message?.content?.trim() ||

      data?.response?.trim() ||

      "";

    // =========================================
    // 🔥 EMPTY FALLBACK
    // =========================================
    if (!answer) {

      answer =
        "I could not generate a proper response.";
    }

    // =========================================
    // 🔥 TYPE SAFETY
    // =========================================
    if (
      typeof answer !== "string"
    ) {

      return
        "⚠️ Invalid response format";
    }

    // =========================================
    // 🧹 CLEANING
    // =========================================
    answer = answer

  .replace(/\n{3,}/g, "\n\n")

  .trim();

    // =========================================
    // 🔥 MEMORY FALLBACK
    // =========================================
    if (

      mode === "memory" &&

      (
        answer
          .toLowerCase()
          .includes(
            "not found"
          ) ||

        answer
          .toLowerCase()
          .includes(
            "does not provide"
          )
      ) &&

      context.length > 100

    ) {

      answer =
        "Relevant information was found in the uploaded document, but the AI could not fully synthesize the answer.";
    }

    // =========================================
    // 🧠 MEMORY MODE LIMIT
    // =========================================
    if (mode === "memory") {

      const words =
        answer.split(" ");

      if (words.length > 140) {

        answer =

          words
            .slice(0, 140)
            .join(" ")

          + "...";
      }
    }

    // =========================================
    // 🌍 KNOWLEDGE MODE LIMIT
    // =========================================
    if (mode === "knowledge") {

      const wordCount =
        answer
          .split(" ")
          .length;

      // 🔥 TOO SHORT
      if (wordCount < 8) {

        answer +=

          " Let me know if you want more details.";
      }

      // 🔥 TOO LONG
      if (wordCount > 220) {

        answer =

          answer
            .split(" ")
            .slice(0, 220)
            .join(" ")

          + "...";
      }
    }

    

    return answer;

  } catch (error) {

    console.error(
      "🔥 Ollama error:"
    );

    console.error(
      error.message
    );

    // =========================================
    // ⏱️ TIMEOUT ERROR
    // =========================================
    if (
      error.name === "AbortError"
    ) {

      return
        "⚠️ AI response timed out. Please try again.";
    }

    return
      "⚠️ AI response failed. Please try again.";
  }
};