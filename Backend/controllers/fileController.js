import File from "../models/File.js";

export const getFiles = async (req, res) => {
  try {
    const files = await File.find({ userId: req.userId })
      .sort({ uploadedAt: -1 });

    res.json(files);
  } catch (err) {
    console.error("🔥 File fetch error:", err.message);
    res.status(500).json({ error: "Failed to fetch files" });
  }
};