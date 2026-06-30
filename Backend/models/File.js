import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimetype: String, // optional
  size: Number,     // optional
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

// 🔥 performance optimization
fileSchema.index({ userId: 1 });

export default mongoose.model("File", fileSchema);