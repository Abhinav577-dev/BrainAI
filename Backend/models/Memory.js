import mongoose from "mongoose";

const memorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },

  text: {
    type: String,
    required: true,
      // 🔥 enables keyword search
  },

  embedding: {
    type: [Number],
    default: []
  },

  importance: {
    type: Number,
    default: 1 // range: 1–5
  },

  // 🔥 NEW: category for better retrieval
  category: {
  type: String,
  enum: [
    "project",
    "education",
    "skill",
    "certification",
    "general",
    "document"
  ],
  default: "document",
  index: true
},

  // 🔥 NEW: chunk index (for large files)
  chunkIndex: {
    type: Number,
    default: 0
  },

  // 🔥 source tracking
  source: {
    type: String
  },

  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "File",
    index: true
  },

  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },


  page: {
  type: Number,
  default: 1
}


});

// 🔥 COMPOUND INDEXES (VERY IMPORTANT)
memorySchema.index({ userId: 1, createdAt: -1 });
memorySchema.index({ userId: 1, category: 1 });
memorySchema.index({ userId: 1, fileId: 1 });

// 🔥 TEXT SEARCH INDEX (fallback search)
memorySchema.index({ text: "text" });

export default mongoose.model("Memory", memorySchema);