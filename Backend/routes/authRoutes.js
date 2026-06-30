import express from "express";
import { signup, login } from "../controllers/authController.js";

const router = express.Router();

// 🔹 optional validation middleware
const validateAuth = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  next();
};

router.post("/signup", validateAuth, signup);
router.post("/login", validateAuth, login);

export default router;