"use server";

import { revalidatePath } from "next/cache";
import { v4 as uuid } from "uuid";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getThreadsForGuardian } from "@/lib/queries";

export async function sendParentReply(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "parent") return;
  const threadId = String(formData.get("threadId"));
  const body = String(formData.get("body") || "").trim();
  if (!body) return;

  // Make sure this guardian actually has access to the thread.
  const allowed = getThreadsForGuardian(session.sub).some((t) => t.id === threadId);
  if (!allowed) return;

  db.prepare(
    `INSERT INTO messages (id, thread_id, sender_type, sender_id, sender_name, body) VALUES (?,?,?,?,?,?)`
  ).run(uuid(), threadId, "guardian", session.sub, session.name, body);
  db.prepare(`UPDATE message_threads SET last_message_at = datetime('now') WHERE id = ?`).run(threadId);

  revalidatePath(`/parent/messages/${threadId}`);
  revalidatePath("/parent/messages");
}
