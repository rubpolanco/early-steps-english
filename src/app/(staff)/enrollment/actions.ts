"use server";

import { revalidatePath } from "next/cache";
import { v4 as uuid } from "uuid";
import { db } from "@/lib/db";
import { getSession, hashPassword } from "@/lib/auth";
import { getGuardianByEmail } from "@/lib/queries";

export async function addWaitlistEntry(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "admin") return;

  const studentId = uuid();
  db.prepare(
    `INSERT INTO students (id, school_id, first_name, last_name, dob, status, desired_start_date, notes)
     VALUES (?,?,?,?,?,'waitlist',?,?)`
  ).run(
    studentId,
    session.schoolId,
    String(formData.get("firstName") || ""),
    String(formData.get("lastName") || ""),
    String(formData.get("dob") || "") || null,
    String(formData.get("desiredStart") || "") || null,
    String(formData.get("notes") || "") || null
  );

  const guardianName = String(formData.get("guardianName") || "").trim();
  const guardianEmail = String(formData.get("guardianEmail") || "").trim().toLowerCase();
  if (guardianName && guardianEmail) {
    let guardian = getGuardianByEmail(guardianEmail);
    if (!guardian) {
      const gid = uuid();
      const hash = await hashPassword("Familia2026!");
      db.prepare(
        `INSERT INTO guardians (id, school_id, name, email, password_hash, phone) VALUES (?,?,?,?,?,?)`
      ).run(gid, session.schoolId, guardianName, guardianEmail, hash, String(formData.get("guardianPhone") || ""));
      guardian = getGuardianByEmail(guardianEmail)!;
    }
    db.prepare(
      `INSERT OR IGNORE INTO student_guardians (student_id, guardian_id, relationship, is_primary) VALUES (?,?,?,1)`
    ).run(studentId, guardian.id, "parent");
  }

  revalidatePath("/enrollment");
}

export async function enrollStudent(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "admin") return;
  const studentId = String(formData.get("studentId"));
  const classroomId = String(formData.get("classroomId") || "") || null;

  db.prepare(
    `UPDATE students SET status = 'enrolled', classroom_id = ?, enrollment_date = ? WHERE id = ?`
  ).run(classroomId, new Date().toISOString().slice(0, 10), studentId);

  revalidatePath("/enrollment");
  revalidatePath("/students");
}
