import express from "express";
import { getFiles } from "../controllers/fileController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware, getFiles);

export default router;