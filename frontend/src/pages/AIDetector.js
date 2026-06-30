import { useState } from "react";

export default function AIDetector() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCheck = async () => {
    if (!text) return;

    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:5000/api/ai/detect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text })
      });

      const data = await res.json();
      setResult(data);

    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  return (
    <div className="ai-wrapper">

      <div className="ai-card">
        <h2>🤖 AI Content Detector</h2>

        <textarea
          placeholder="Paste your text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <button onClick={handleCheck}>
          {loading ? "Analyzing..." : "Check AI"}
        </button>

        {result && (
          <div className="ai-result">

            <h3>AI Likelihood: {result.ai_probability}%</h3>

            {/* 🔥 Progress Bar */}
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${result.ai_probability}%`,
                  background:
                    result.ai_probability > 70 ? "#ef4444" :
                    result.ai_probability > 40 ? "#facc15" :
                    "#22c55e"
                }}
              ></div>
            </div>

            <p>{result.reason}</p>

            {result.breakdown && (
              <div className="breakdown">
                LLM: {result.breakdown.llm}% | Pattern: {result.breakdown.heuristic}%
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
}