import fs from "fs";
import mammoth from "mammoth";
import { createRequire } from "module";

import Memory from "../models/Memory.js";
import File from "../models/File.js";

import { createEmbedding }
from "../services/embeddingService.js";

import {
  chunkTextSemantically
}
from "../utils/chunkText.js";

// =========================================
// ✅ STABLE PDF IMPORT
// =========================================
const require =
  createRequire(import.meta.url);

const pdf =
  require("pdf-parse");

// =========================================
// 🧠 CLEAN TEXT
// =========================================
const cleanText = (text) => {

  return text

    // normalize line breaks
    .replace(/\r/g, "\n")

    // fix broken hyphenated line wraps
    .replace(/-\n/g, "")

    // preserve paragraph spacing
    .replace(/\n{3,}/g, "\n\n")

    // normalize spaces
    .replace(/[ \t]+/g, " ")

    // trim lines
    .split("\n")
    .map(line => line.trim())
    .join("\n")

    .trim();
};

// =========================================
// 📤 UPLOAD FILE
// =========================================
export const uploadFile =
async (req, res) => {

  try {

    const file = req.file;

    // =========================================
    // ❌ NO FILE
    // =========================================
    if (!file) {

      return res.status(400).json({
        error: "No file uploaded"
      });
    }

    console.log("🔥 FILE:");
    console.log(file.originalname);

    // =========================================
    // 💾 SAVE FILE METADATA
    // =========================================
    const newFile = new File({

      userId: req.userId,

      filename:
        file.filename,

      originalName:
        file.originalname,

      uploadedAt:
        new Date()
    });

    await newFile.save();

    // =========================================
    // 🔥 ALL CHUNKS
    // =========================================
    let allChunks = [];

    // =========================================
    // 📄 PDF PROCESSING
    // =========================================
    if (
      file.mimetype ===
      "application/pdf"
    ) {

      console.log(
        "📄 PROCESSING PDF..."
      );

      const dataBuffer =
        fs.readFileSync(
          file.path
        );

      const data =
        await pdf(dataBuffer);


      // =========================================
      // 🔥 SPLIT PAGES
      // =========================================
      const pages =
        data.text.split("\f");

      // =========================================
      // 🔥 PROCESS EACH PAGE
      // =========================================
      pages.forEach(
        (pageText, pageIndex) => {

        const cleanPage =
          cleanText(pageText);

        

        // =========================================
        // 🔥 SEMANTIC CHUNKING
        // =========================================
        const chunks =
          chunkTextSemantically(
            cleanPage
          );

        

        // =========================================
        // 🔥 STORE PAGE CHUNKS
        // =========================================
        chunks.forEach(
          (chunk) => {

          allChunks.push({

            text: chunk,

            page:
              pageIndex + 1
          });

         
        });
      });
    }

    // =========================================
    // 📝 DOCX PROCESSING
    // =========================================
    else if (

      file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

    ) {

      

      const data =
        await mammoth.extractRawText({
          path: file.path
        });

      const text =
        cleanText(data.value);

      

      

      const chunks =
        chunkTextSemantically(
          text
        );

      
      allChunks =
        chunks.map(chunk => ({

          text: chunk,

          page: 1
        }));
    }

    // =========================================
    // 📄 TXT PROCESSING
    // =========================================
    else if (
      file.mimetype ===
      "text/plain"
    ) {

      console.log(
        "📄 PROCESSING TXT..."
      );

      const rawText =
        fs.readFileSync(
          file.path,
          "utf-8"
        );

      const text =
        cleanText(rawText);

      

      const chunks =
        chunkTextSemantically(
          text
        );

      

      allChunks =
        chunks.map(chunk => ({

          text: chunk,

          page: 1
        }));
    }

    // =========================================
    // ❌ EMPTY CONTENT
    // =========================================
    if (
      allChunks.length === 0
    ) {

      return res.status(400).json({

        error:
          "File has no readable content"
      });
    }

    // =========================================
    // 🔥 LIMIT CHUNKS
    // =========================================
    const MAX_CHUNKS = 100;

    const limitedChunks =
      allChunks.slice(
        0,
        MAX_CHUNKS
      );


    // =========================================
    // 💾 STORE MEMORIES
    // =========================================
    const saved = [];

    for (
      let i = 0;
      i < limitedChunks.length;
      i++
    ) {

      const chunkObj =
        limitedChunks[i];

      

      const embedding =
        await createEmbedding(
          chunkObj.text,
          "memory"
        );

      

      const memory =
        new Memory({

        userId:
          req.userId,

        text:
          chunkObj.text,

        embedding,

        importance: 2,

        source:
          file.originalname,

        fileId:
          newFile._id,

        chunkIndex: i,

        page:
          chunkObj.page,

        // ✅ FIXED CATEGORY
        category:
          "general"
      });

      await memory.save();

      

      saved.push(memory);
    }

    // =========================================
    // ✅ SUCCESS
    // =========================================
    res.json({

      message:
        "File processed successfully 📄🧠",

      file: newFile,

      chunks:
        saved.length
    });

  } catch (err) {

    console.error(
      "🔥 Upload Error:",
      err
    );

    res.status(500).json({
      error: err.message
    });
  }
};