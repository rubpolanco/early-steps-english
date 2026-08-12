"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { v4 as uuid } from "uuid";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { hashPassword } from "@/lib/auth";
import { getGuardianByEmail } from "@/lib/queries";

export async function createStudent(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "admin") return;

  const id = uuid();
  db.prepare(
    `INSERT INTO students (id, school_id, classroom_id, first_name, last_name, dob, gender, status, enrollment_date, allergies, notes)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`
  ).run(
    id,
    session.schoolId,
    String(formData.get("classroomId") || "") || null,
    String(formData.get("firstName") || ""),
    String(formData.get("lastName") || ""),
    String(formData.get("dob") || "") || null,
    String(formData.get("gender") || "") || null,
    "enrolled",
    new Date().toISOString().slice(0, 10),
    String(formData.get("allergies") || "") || null,
    String(formData.get("notes") || "") || null
  );

  revalidatePath("/students");
  redirect(`/students/${id}`);
}

export async function updateStudent(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "admin") return;
  const id = String(formData.get("studentId"));

  db.prepare(
    `UPDATE students SET first_name=?, last_name=?, dob=?, gender=?, classroom_id=?, status=?, allergies=?, notes=?, immunization_status=?
     WHERE id = ?`
  ).run(
    String(formData.get("firstName") || ""),
    String(formData.get("lastName") || ""),
    String(formData.get("dob") || "") || null,
    String(formData.get("gender") || "") || null,
    String(formData.get("classroomId") || "") || null,
    String(formData.get("status") || "enrolled"),
    String(formData.get("allergies") || "") || null,
    String(formData.get("notes") || "") || null,
    String(formData.get("immunizationStatus") || "up_to_date"),
    id
  );

  revalidatePath(`/students/${id}`);
  revalidatePath("/students");
}

export async function addGuardian(formData: FormData) {
  const session = await getSession();
  if (!session) return;
  const studentId = String(formData.get("studentId"));
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const phone = String(formData.get("phone") || "");
  const relationship = String(formData.get("relationship") || "parent");

  if (!name || !email) return;

  let guardian = getGuardianByEmail(email);
  if (!guardian) {
    const id = uuid();
    const passwordHash = await hashPassword("Familia2026!");
    db.prepare(
      `INSERT INTO guardians (id, school_id, name, email, password_hash, phone) VALUES (?,?,?,?,?,?)`
    ).run(id, session.schoolId, name, email, passwordHash, phone);
    guardian = getGuardianByEmail(email)!;
  }

  db.prepare(
    `INSERT OR IGNORE INTO student_guardians (student_id, guardian_id, relationship, is_primary) VALUES (?,?,?,0)`
  ).run(studentId, guardian.id, relationship);

  revalidatePath(`/students/${studentId}`);
}

export async function removeGuardian(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "admin") return;
  const studentId = String(formData.get("studentId"));
  const guardianId = String(formData.get("guardianId"));
  db.prepare(`DELETE FROM student_guardians WHERE student_id = ? AND guardian_id = ?`).run(studentId, guardianId);
  revalidatePath(`/students/${studentId}`);
}

export async function addPickupPerson(formData: FormData) {
  const session = await getSession();
  if (!session) return;
  const studentId = String(formData.get("studentId"));
  const name = String(formData.get("name") || "").trim();
  const relationship = String(formData.get("relationship") || "").trim();
  const phone = String(formData.get("phone") || "");
  const pin = String(formData.get("pin") || Math.floor(1000 + Math.random() * 9000));
  if (!name || !relationship) return;

  db.prepare(
    `INSERT INTO pickup_people (id, student_id, name, relationship, phone, pin_code) VALUES (?,?,?,?,?,?)`
  ).run(uuid(), studentId, name, relationship, phone, pin);

  revalidatePath(`/students/${studentId}`);
}

export async function removePickupPerson(formData: FormData) {
  const session = await getSession();
  if (!session) return;
  const studentId = String(formData.get("studentId"));
  const pickupId = String(formData.get("pickupId"));
  db.prepare(`UPDATE pickup_people SET active = 0 WHERE id = ?`).run(pickupId);
  revalidatePath(`/students/${studentId}`);
}

export async function addDocument(formData: FormData) {
  const session = await getSession();
  if (!session) return;
  const studentId = String(formData.get("studentId"));
  const name = String(formData.get("name") || "").trim();
  const docType = String(formData.get("docType") || "other");
  const expiresAt = String(formData.get("expiresAt") || "") || null;
  if (!name) return;

  db.prepare(
    `INSERT INTO documents (id, student_id, name, doc_type, expires_at) VALUES (?,?,?,?,?)`
  ).run(uuid(), studentId, name, docType, expiresAt);

  revalidatePath(`/students/${studentId}`);
}
