import express from "express";
import { addMemory, searchMemory } from "../controllers/memoryController.js";
import { authMiddleware } from "../middleware/auth.js"; // ✅ FIXED

const router = express.Router();

router.post("/add", authMiddleware, addMemory);
router.post("/search", authMiddleware, searchMemory);

export default router;