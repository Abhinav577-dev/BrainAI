import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import memoryRoutes from "./routes/memoryRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";



dotenv.config();

const app = express();

// Middleware
app.use((req, res, next) => {
  console.log("Incoming request:", req.method, req.url);
  next();
});
app.use(cors());
app.use(express.json());
app.use("/api/memory", memoryRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/ai", aiRoutes);

app.use("/api/files", fileRoutes);

// Connect Database
connectDB();

// Test route
app.get("/", (req, res) => {
  res.send("BrainAI Backend Running 🧠");
});

// Start server
app.listen(5000, () => {
  console.log("Server running on port 5000 🚀");
});