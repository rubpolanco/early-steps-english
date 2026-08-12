"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { v4 as uuid } from "uuid";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getGuardiansForStudent, getStudent } from "@/lib/queries";

export async function startDirectThread(formData: FormData) {
  const session = await getSession();
  if (!session) return;
  const studentId = String(formData.get("studentId"));
  const subject = String(formData.get("subject") || "New conversation");
  const body = String(formData.get("body") || "");
  const student = getStudent(studentId);
  if (!student) return;

  const threadId = uuid();
  db.prepare(
    `INSERT INTO message_threads (id, school_id, subject, type, student_id) VALUES (?,?,?,?,?)`
  ).run(threadId, session.schoolId, `${subject} — ${student.first_name}`, "direct", studentId);

  const guardians = getGuardiansForStudent(studentId);
  for (const g of guardians) {
    db.prepare(`INSERT OR IGNORE INTO thread_participants (thread_id, guardian_id) VALUES (?,?)`).run(threadId, g.id);
  }

  if (body.trim()) {
    db.prepare(
      `INSERT INTO messages (id, thread_id, sender_type, sender_id, sender_name, body) VALUES (?,?,?,?,?,?)`
    ).run(uuid(), threadId, "staff", session.sub, session.name, body.trim());
  }

  revalidatePath("/messages");
  redirect(`/messages/${threadId}`);
}

export async function createAnnouncement(formData: FormData) {
  const session = await getSession();
  if (!session) return;
  const classroomId = String(formData.get("classroomId") || "") || null;
  const subject = String(formData.get("subject") || "Announcement");
  const body = String(formData.get("body") || "");

  const threadId = uuid();
  db.prepare(
    `INSERT INTO message_threads (id, school_id, subject, type, classroom_id) VALUES (?,?,?,?,?)`
  ).run(threadId, session.schoolId, subject, "announcement", classroomId);

  if (body.trim()) {
    db.prepare(
      `INSERT INTO messages (id, thread_id, sender_type, sender_id, sender_name, body) VALUES (?,?,?,?,?,?)`
    ).run(uuid(), threadId, "staff", session.sub, session.name, body.trim());
  }

  revalidatePath("/messages");
  redirect(`/messages/${threadId}`);
}

export async function sendReply(formData: FormData) {
  const session = await getSession();
  if (!session) return;
  const threadId = String(formData.get("threadId"));
  const body = String(formData.get("body") || "").trim();
  if (!body) return;

  db.prepare(
    `INSERT INTO messages (id, thread_id, sender_type, sender_id, sender_name, body) VALUES (?,?,?,?,?,?)`
  ).run(uuid(), threadId, "staff", session.sub, session.name, body);
  db.prepare(`UPDATE message_threads SET last_message_at = datetime('now') WHERE id = ?`).run(threadId);

  revalidatePath(`/messages/${threadId}`);
  revalidatePath("/messages");
}
