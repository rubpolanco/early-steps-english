import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { UPLOADS_DIR } from "@/lib/storage";

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;

  // Resolve safely within UPLOADS_DIR — reject any attempt to escape it
  // (e.g. via "..") before touching the filesystem.
  const requested = path.join(UPLOADS_DIR, ...segments);
  const resolved = path.resolve(requested);
  if (!resolved.startsWith(path.resolve(UPLOADS_DIR) + path.sep)) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const data = await fs.readFile(resolved);
    const ext = path.extname(resolved).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
