import path from "path";
import fs from "fs";

// Everything persistent (the SQLite database + uploaded photos/videos) lives
// under one root directory, so a single mounted volume is enough in
// production (e.g. one Railway/Render volume mounted at STORAGE_DIR).
// Locally this defaults to ./data with no configuration needed.
export const STORAGE_ROOT = process.env.STORAGE_DIR || path.join(process.cwd(), "data");
export const DB_PATH = path.join(STORAGE_ROOT, "app.db");
export const UPLOADS_DIR = path.join(STORAGE_ROOT, "uploads");

fs.mkdirSync(STORAGE_ROOT, { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });
