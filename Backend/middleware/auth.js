import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "brainai-secret";

export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "No token provided" });
    }

    // 🔥 Handle "Bearer token" format
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    const decoded = jwt.verify(token, SECRET);

    req.userId = decoded.userId;

    next();

  } catch (err) {
    console.error("Auth Error:", err.message);

    return res.status(401).json({
      error: "Invalid or expired token"
    });
  }
};