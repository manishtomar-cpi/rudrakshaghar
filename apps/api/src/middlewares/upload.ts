import multer from "multer";
import { env } from "../config/env";

const storage = multer.memoryStorage();
const imageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxBytes = env.MAX_IMAGE_MB * 1024 * 1024;

export const uploadSingleImage = multer({
  storage,
  limits: { fileSize: maxBytes },
  fileFilter: (_req, file, cb) => {
    if (!imageTypes.has(file.mimetype)) return cb(new Error("Unsupported file type"));
    cb(null, true);
  },
}).single("image"); // field name "image"
