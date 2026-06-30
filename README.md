# 🧠 BrainAI – Local AI Research Assistant

BrainAI is a fully local AI-powered Retrieval-Augmented Generation (RAG) assistant that enables users to upload documents and ask natural language questions without relying on external AI APIs.

Built with Node.js, MongoDB, Ollama, and Phi-3 Mini, BrainAI performs semantic document retrieval, context-aware response generation, and intelligent memory management while running completely offline.

---

![React](https://img.shields.io/badge/React-19-blue)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-green)
![Ollama](https://img.shields.io/badge/Ollama-Local_AI-black)
![RAG](https://img.shields.io/badge/RAG-Retrieval_Augmented_Generation-purple)
![License](https://img.shields.io/badge/License-MIT-blue)

## ✨ Features

- 📄 Upload PDF, DOCX, and TXT documents
- 🤖 Local AI-powered question answering using Ollama
- 🧠 Retrieval-Augmented Generation (RAG)
- 🔍 Hybrid retrieval using:
  - Semantic embeddings
  - Keyword matching
  - Context-aware ranking
- 📚 Memory Mode for document-grounded responses
- 🌐 Knowledge Mode using local LLM knowledge
- ⚡ Fast local inference
- 📝 Structured AI responses
- 💾 MongoDB-based document storage
- 🔒 Fully offline (No OpenAI API required)

---

# 🏗 Architecture

```
                +----------------+
                |   React Frontend |
                +--------+-------+
                         |
                         |
                +--------v-------+
                | Node.js Backend |
                +--------+-------+
                         |
         +---------------+---------------+
         |                               |
         |                               |
 +-------v-------+              +--------v-------+
 | Memory Mode   |              | Knowledge Mode |
 +-------+-------+              +--------+-------+
         |                               |
         |                               |
 +-------v-------+              +--------v-------+
 | Hybrid Search |              |  Phi-3 Mini    |
 +-------+-------+              +--------+-------+
         |
         |
 +-------v-------------------------------+
 | MongoDB + Semantic Embeddings         |
 +---------------------------------------+
```

---

# 🧠 How It Works

1. Upload a document
2. Extract document text
3. Clean and preprocess content
4. Split text into semantic chunks
5. Generate embeddings
6. Store chunks in MongoDB
7. Retrieve relevant chunks for a query
8. Build context dynamically
9. Generate an AI response using Phi-3 Mini

---

# 🚀 Tech Stack

### Frontend

- React
- Bootstrap
- CSS

### Backend

- Node.js
- Express.js

### AI

- Ollama
- Phi-3 Mini
- nomic-embed-text

### Database

- MongoDB
- Mongoose

### File Processing

- pdf-parse
- mammoth

---

# 📂 Project Structure

```
BrainAI
│
├── Frontend
│   ├── src
│   ├── components
│   ├── pages
│   └── App.jsx
│
├── Backend
│   ├── controllers
│   ├── models
│   ├── routes
│   ├── services
│   ├── utils
│   └── server.js
│
└── README.md
```

---

# ⚙️ Installation

## Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/BrainAI.git
```

```
cd BrainAI
```

---

## Install Backend

```bash
cd Backend
npm install
```

---

## Install Frontend

```bash
cd ../Frontend
npm install
```

---

# 🦙 Install Ollama

Download and install Ollama from:

https://ollama.com

Pull the required models:

```bash
ollama pull phi3:mini
ollama pull nomic-embed-text
```

---

# ▶️ Run Backend

```bash
cd Backend
npm start
```

---

# ▶️ Run Frontend

```bash
cd Frontend
npm run dev
```

---

# 📸 Screenshots

Add screenshots here

```
/screenshots/chat.png
/screenshots/upload.png
/screenshots/memory.png
```

---

# 🎯 Future Improvements

- Web Search Integration
- Streaming Responses
- Open WebUI Integration
- Citation Support
- Agentic Workflows
- Voice Interaction
- Image Understanding
- Vector Database Support

---

# 👨‍💻 Author

**Abhinav K**

GitHub:
https://github.com/Abhinav577-dev

LinkedIn:
(Add LinkedIn URL)

---

# ⭐ Support

If you found this project useful, consider giving it a ⭐ on GitHub.
