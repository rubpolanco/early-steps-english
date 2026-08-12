"use server";

import { revalidatePath } from "next/cache";
import { v4 as uuid } from "uuid";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { isGuardianOfStudent, getPickupPeople } from "@/lib/queries";

export async function parentAddPickupPerson(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "parent") return;
  const studentId = String(formData.get("studentId"));
  if (!isGuardianOfStudent(session.sub, studentId)) return;

  const name = String(formData.get("name") || "").trim();
  const relationship = String(formData.get("relationship") || "").trim();
  const phone = String(formData.get("phone") || "");
  const pin = String(formData.get("pin") || "").trim() || String(Math.floor(1000 + Math.random() * 9000));
  if (!name || !relationship) return;

  db.prepare(
    `INSERT INTO pickup_people (id, student_id, name, relationship, phone, pin_code, added_by_guardian_id) VALUES (?,?,?,?,?,?,?)`
  ).run(uuid(), studentId, name, relationship, phone, pin, session.sub);

  revalidatePath("/parent/pickup-people");
}

export async function parentRemovePickupPerson(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "parent") return;
  const studentId = String(formData.get("studentId"));
  const pickupId = String(formData.get("pickupId"));
  if (!isGuardianOfStudent(session.sub, studentId)) return;

  const belongs = getPickupPeople(studentId).some((p) => p.id === pickupId);
  if (!belongs) return;

  db.prepare(`UPDATE pickup_people SET active = 0 WHERE id = ?`).run(pickupId);
  revalidatePath("/parent/pickup-people");
}
