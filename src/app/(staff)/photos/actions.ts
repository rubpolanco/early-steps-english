"use server";

import { revalidatePath } from "next/cache";
import { v4 as uuid } from "uuid";
import path from "path";
import fs from "fs/promises";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { UPLOADS_DIR } from "@/lib/storage";

export async function uploadMedia(formData: FormData) {
  const session = await getSession();
  if (!session) return;

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return;

  const caption = String(formData.get("caption") || "");
  const classroomId = String(formData.get("classroomId") || "") || null;
  const studentIds = formData.getAll("studentIds").map(String);

  const subdir = String(new Date().getFullYear());
  const uploadDir = path.join(/* turbopackIgnore: true */ UPLOADS_DIR, subdir);
  await fs.mkdir(uploadDir, { recursive: true });

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const fileName = `${uuid()}.${ext || "jpg"}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(/* turbopackIgnore: true */ uploadDir, fileName), buffer);

  const fileUrl = `/media/${subdir}/${fileName}`;
  const type = file.type.startsWith("video") ? "video" : "photo";

  const mediaId = uuid();
  db.prepare(
    `INSERT INTO media (id, school_id, classroom_id, type, file_url, caption, uploaded_by_staff_id) VALUES (?,?,?,?,?,?,?)`
  ).run(mediaId, session.schoolId, classroomId, type, fileUrl, caption, session.sub);

  for (const sid of studentIds) {
    db.prepare(`INSERT OR IGNORE INTO media_students (media_id, student_id) VALUES (?,?)`).run(mediaId, sid);
  }

  revalidatePath("/photos");
  revalidatePath("/parent/photos");
}
