"use server";

import { revalidatePath } from "next/cache";
import { v4 as uuid } from "uuid";
import { db } from "@/lib/db";
import { getSession, hashPassword } from "@/lib/auth";

export async function createStaff(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "admin") return;

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const existing = db.prepare("SELECT id FROM staff WHERE email = ?").get(email);
  if (existing) return;

  const passwordHash = await hashPassword(String(formData.get("password") || "Teach2026!"));

  db.prepare(
    `INSERT INTO staff (id, school_id, name, email, password_hash, role, classroom_id, phone) VALUES (?,?,?,?,?,?,?,?)`
  ).run(
    uuid(),
    session.schoolId,
    String(formData.get("name") || ""),
    email,
    passwordHash,
    String(formData.get("role") || "teacher"),
    String(formData.get("classroomId") || "") || null,
    String(formData.get("phone") || "")
  );

  revalidatePath("/staff");
}

export async function toggleStaffActive(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "admin") return;
  const id = String(formData.get("staffId"));
  db.prepare(`UPDATE staff SET active = 1 - active WHERE id = ?`).run(id);
  revalidatePath("/staff");
}
