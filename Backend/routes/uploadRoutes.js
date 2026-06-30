import express from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// 🔐 Protected upload route
router.post("/", authMiddleware, upload.single("file"), uploadFile);

export default router;