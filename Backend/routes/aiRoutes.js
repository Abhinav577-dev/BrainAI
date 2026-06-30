import express from "express";
import { detectAIContent } from "../controllers/aiDetector.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.post("/detect", authMiddleware, detectAIContent);

export default router;