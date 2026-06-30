import { useState, useEffect, useRef } from "react";
import "./App.css";
import AIDetector from "./pages/AIDetector";
import ReactMarkdown from "react-markdown";

/* ================= EXPLAIN PANEL ================= */
function ExplainPanel({ explain }) {
  const [open, setOpen] = useState(false);

  if (!explain) return null;

  return (
    <div className="mt-2">
      <button
        className="btn btn-sm btn-outline-info"
        onClick={() => setOpen(!open)}
      >
        💡 Why this answer?
      </button>

      {open && (
        <div className="explain-box">
          <p><strong>Mode:</strong> {explain.mode}</p>

          {explain.memories?.length > 0 && (
            <>
              <strong>Top Memories:</strong>
              <ul>
                {explain.memories.map((m, i) => (
                  <li key={i}>
                    {m.text} ({m.score?.toFixed(2)})
                  </li>
                ))}
              </ul>
            </>
          )}

          <p><strong>Confidence:</strong> {explain.confidence}</p>
        </div>
      )}
    </div>
  );
}

const getUserIdFromToken = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.userId;
  } catch {
    return null;
  }
};

/* ================= MAIN APP ================= */
function App() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("memory");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("chat");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");
  const [files, setFiles] = useState([]);

  const inputRef = useRef(null);
  const chatEndRef = useRef(null);

  const [chats, setChats] = useState(() => {
  const userId = getUserIdFromToken();
  const saved = localStorage.getItem(`brainai_chats_${userId}`);

  return saved
    ? JSON.parse(saved)
    : [{ id: 1, messages: [], title: "New Chat" }];
});

  const [currentChatId, setCurrentChatId] = useState(() => {
  const userId = getUserIdFromToken();
  const saved = localStorage.getItem(`brainai_current_${userId}`);

  return saved ? JSON.parse(saved) : 1;
});

  const currentChat = chats.find(c => c.id === currentChatId);

  /* ================= EFFECTS ================= */

  useEffect(() => {
  const userId = getUserIdFromToken();
  localStorage.setItem(`brainai_chats_${userId}`, JSON.stringify(chats));
}, [chats]);

useEffect(() => {
  const userId = getUserIdFromToken();
  localStorage.setItem(`brainai_current_${userId}`, JSON.stringify(currentChatId));
}, [currentChatId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (document.activeElement === inputRef.current) return;

      const index = chats.findIndex(c => c.id === currentChatId);

      if (e.key === "ArrowUp" && index > 0) {
        e.preventDefault();
        setCurrentChatId(chats[index - 1].id);
      }

      if (e.key === "ArrowDown" && index < chats.length - 1) {
        e.preventDefault();
        setCurrentChatId(chats[index + 1].id);
      }

      if (e.ctrlKey && e.key === "Enter") {
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [chats, currentChatId]);

  useEffect(() => {
  if (activeTab === "files") {
    fetchFiles();
  }
}, [activeTab]);

  /* ================= HELPERS ================= */

  const toggleMemory = (index) => {
    setChats(prev =>
      prev.map(chat =>
        chat.id === currentChatId
          ? {
              ...chat,
              messages: chat.messages.map((msg, i) =>
                i === index
                  ? { ...msg, showMemory: !msg.showMemory }
                  : msg
              )
            }
          : chat
      )
    );
  };

  const shouldSuggestSave = (text) => text && text.length > 120;

  const updateMessageFlag = (index, updates) => {
    setChats(prev =>
      prev.map(chat =>
        chat.id === currentChatId
          ? {
              ...chat,
              messages: chat.messages.map((msg, i) =>
                i === index ? { ...msg, ...updates } : msg
              )
            }
          : chat
      )
    );
  };

  /* ================= AUTH ================= */

  const handleSignup = async () => {
  try {
    const res = await fetch("http://localhost:5000/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, email, password }) // ✅ added name
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Signup failed");
      return;
    }

    alert("Account created successfully 🎉");
    setIsSignup(false);

  } catch (err) {
    console.error(err);
    alert("Server error");
  }
};

  const handleLogin = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Login failed");
        return;
      }

      localStorage.setItem("token", data.token);
      alert("Login successful ✅");

      window.location.reload();

    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  const fetchFiles = async () => {
  try {
    const token = localStorage.getItem("token");

    const res = await fetch("http://localhost:5000/api/files", {
      headers: {
        Authorization: token
      }
    });

    const data = await res.json();
    setFiles(data);

  } catch (err) {
    console.error(err);
  }
};

  /* ================= FILE ================= */

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("token");

      await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        headers: {
          Authorization: token
        },
        body: formData
      });

      alert("File uploaded and processed!");
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    }
  };

  /* ================= MEMORY ================= */

  const saveToMemory = async (text, index) => {
    try {
      const token = localStorage.getItem("token");

      await fetch("http://localhost:5000/api/memory/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token
        },
        body: JSON.stringify({ text })
      });

      updateMessageFlag(index, { saved: true });
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= ASK ================= */

  const handleAsk = async () => {
    if (!query || loading) return;

    const userQuery = query;

    setChats(prev =>
      prev.map(chat =>
        chat.id === currentChatId
          ? {
              ...chat,
              messages: [...chat.messages, { type: "user", text: userQuery }],
              title:
                chat.messages.length === 0
                  ? userQuery.slice(0, 30)
                  : chat.title
            }
          : chat
      )
    );

    setQuery("");
    setLoading(true);

    try {

  const token =
    localStorage.getItem("token");

  const res = await fetch(
    "http://localhost:5000/api/memory/search",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Authorization: token
      },

      body: JSON.stringify({
        query: userQuery,
        mode
      })
    }
  );

  // 🔥 DEBUG STATUS
  

  // 🔥 RAW TEXT RESPONSE
  const rawText =
    await res.text();

  

  // 🔥 SAFE JSON PARSE
  let data = {};

  try {

    data = JSON.parse(rawText);

  } catch (parseErr) {

    console.error(
      "🔥 JSON PARSE ERROR:",
      parseErr
    );

    throw new Error(
      "Invalid JSON response"
    );
  }

  console.log(
    "🔥 FINAL FRONTEND DATA:"
  );

  console.log(data);

  setChats(prev =>
    prev.map(chat =>
      chat.id === currentChatId
        ? {
            ...chat,

            messages: [
              ...chat.messages,

              {
                type: "bot",

                text:
                  data.answer ||
                  "No answer generated",

                sources:
                  data.sources || [],

                explain:
                  data.explain || null,

                showMemory: false,

                saved: false
              }
            ]
          }
        : chat
    )
  );

} catch (err) {

  console.error(
    "🔥 FRONTEND ERROR:"
  );

  console.error(err);

  setChats(prev =>
    prev.map(chat =>
      chat.id === currentChatId
        ? {
            ...chat,

            messages: [
              ...chat.messages,

              {
                type: "bot",

                text:
                  "⚠️ Error fetching response"
              }
            ]
          }
        : chat
    )
  );
}

    setLoading(false);
  };

  /* ================= LOGIN GUARD ================= */

  const token = localStorage.getItem("token");

  if (!token) {
  return (
    <div className="auth-container">
      <div className="auth-card">

        <h2>
          {isSignup ? "📝 Create Account" : "🔐 BrainAI Login"}
        </h2>

        {isSignup && (
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={isSignup ? handleSignup : handleLogin}>
          {isSignup ? "Sign Up" : "Login"}
        </button>

        <p onClick={() => setIsSignup(!isSignup)}>
          {isSignup
            ? "Already have an account? Login"
            : "Don't have an account? Sign up"}
        </p>

      </div>
    </div>
  );
}
  /* ================= UI ================= */

  return (
  <div className="layout">

    {/* SIDEBAR */}
    <aside className={`sidebar ${sidebarOpen ? "" : "collapsed"}`}>

      <div className="sidebar-header">
        <button
          className="menu-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          ☰
        </button>

        <div className="brand">
          <div className="logo-dot"></div>
          {sidebarOpen && <span>🧠</span>}
        </div>
      </div>

      {/* NAV BUTTONS */}
      <div className="tab-buttons">
        <button
          className={`tab-btn ${activeTab === "chat" ? "active" : ""}`}
          onClick={() => setActiveTab("chat")}
        >
          💬 {sidebarOpen && "Chat"}
        </button>

        <button
          className={`tab-btn ${activeTab === "files" ? "active" : ""}`}
          onClick={() => setActiveTab("files")}
        >
          📁 {sidebarOpen && "Files"}
        </button>

        <button
          className={`tab-btn ${activeTab === "ai" ? "active" : ""}`}
          onClick={() => setActiveTab("ai")}
        >
          🤖 {sidebarOpen && "AI Detector"}
        </button>
      </div>

      {/* ✅ ALWAYS SHOW CHAT LIST */}
      <button
        className="new-chat-btn"
        onClick={() => {
          const newChat = {
            id: Date.now(),
            messages: [],
            title: "New Chat"
          };
          setChats([...chats, newChat]);
          setCurrentChatId(newChat.id);
        }}
      >
        {sidebarOpen ? "+ New Chat" : "+"}
      </button>

      <div className="chat-section">
        {chats.map(chat => (
          <div
            key={chat.id}
            className={`chat-item ${
              chat.id === currentChatId ? "active" : ""
            }`}
            onClick={() => setCurrentChatId(chat.id)}
          >
            💬 {sidebarOpen && chat.title}
          </div>
        ))}
      </div>

      {/* LOGOUT */}
      <div className="sidebar-footer">
        <button
          className="logout-btn"
          onClick={() => {
            localStorage.removeItem("token");
            window.location.reload();
          }}
        >
          🔓 {sidebarOpen && "Logout"}
        </button>
      </div>

    </aside>

    {/* MAIN CONTENT */}
    <main className="main">

      {/* AI PAGE */}
      {activeTab === "ai" && <AIDetector />}

      {/* FILES PAGE */}
      {activeTab === "files" && (
        <div className="files-container">
          {files.length === 0 ? (
            <p>No files uploaded yet 📂</p>
          ) : (
            files.map(file => (
              <div key={file._id} className="file-card">
                <div className="file-icon">📄</div>
                <div className="file-info">
                  <p className="file-name">{file.originalName}</p>
                  <span className="file-date">
                    {new Date(file.uploadedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* CHAT PAGE */}
      {activeTab === "chat" && (
        <>
          {/* TOPBAR */}
          <div className="topbar">

            <div className="topbar-left">
              <span className="brand-dot"></span>
              <span className="brand-name">BrainAI</span>
            </div>

            <div className="topbar-center">
              <div className="mode-toggle">
                <button
                  className={`mode-btn ${
                    mode === "memory" ? "active" : ""
                  }`}
                  onClick={() => setMode("memory")}
                >
                  🧠 Memory
                </button>

                <button
                  className={`mode-btn ${
                    mode === "knowledge" ? "active" : ""
                  }`}
                  onClick={() => setMode("knowledge")}
                >
                  🌐 Knowledge
                </button>
              </div>
            </div>

            <div className="topbar-right"></div>
          </div>

          {/* CHAT */}
          <div className="chat">
            {currentChat?.messages.map((msg, i) => (
              <div key={i} className={`row ${msg.type}`}>
                <div className="msg">

                  {msg.type === "bot" && msg.explain?.mode && (
                    <span className={`badge ${
                      msg.explain.mode === "memory"
                        ? "bg-primary"
                        : "bg-success"
                    }`}>
                      {msg.explain.mode === "memory"
                        ? "🧠 Memory"
                        : "🌐 Knowledge"}
                    </span>
                  )}

                  <div className="whitespace-pre-wrap ai-answer">
  <ReactMarkdown>
    {msg.text}
  </ReactMarkdown>
</div>

                  {msg.type === "bot" &&
                    !msg.saved &&
                    shouldSuggestSave(msg.text) && (
                      <div className="save-suggestion">
                        <span>💡 Save this?</span>
                        <button onClick={() => saveToMemory(msg.text, i)}>
                          Save
                        </button>
                        <button onClick={() => updateMessageFlag(i, { saved: true })}>
                          Ignore
                        </button>
                      </div>
                  )}

                  {msg.type === "bot" && msg.sources?.length > 0 && (
                    <button
                      className="memory-btn"
                      onClick={() => toggleMemory(i)}
                    >
                      {msg.showMemory ? "Hide Memory" : "View Memory"}
                    </button>
                  )}

                  {msg.showMemory && msg.sources && (
                    <div className="memory-box">
                      {msg.sources.map((s, idx) => (
                        <div key={idx}>
                          {s.text} ({s.score?.toFixed(2)})
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.type === "bot" && (
                    <ExplainPanel explain={msg.explain} />
                  )}

                </div>
              </div>
            ))}

            {loading && (
              <div className="row bot">
                <div className="msg subtle">Thinking…</div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* INPUT */}
          <div className="input">
            <label className="btn btn-outline-secondary mb-0">
              📄
              <input type="file" hidden onChange={handleFileUpload} />
            </label>

            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAsk()}
              placeholder="Ask something…"
            />

            <button onClick={handleAsk}>Send</button>
          </div>
        </>
      )}

    </main>
  </div>
);
}

export default App;