import path from "node:path";
import multer from "multer";
import { SUPPORTED_EXTENSIONS } from "../services/fileTextExtractor.js";

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024, files: 1 },
  fileFilter: (_request, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, SUPPORTED_EXTENSIONS.has(extension));
  },
});
