"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { v4 as uuid } from "uuid";
import { getSession } from "@/lib/auth";
import { getGuardianById, getPickupPeople } from "@/lib/queries";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function resolvePersonName(studentId: string, who: string): { type: string; name: string } | null {
  const [type, id] = who.split(":");
  if (type === "guardian") {
    const g = getGuardianById(id);
    if (!g) return null;
    return { type, name: g.name };
  }
  if (type === "pickup_person") {
    const p = getPickupPeople(studentId).find((pp) => pp.id === id);
    if (!p) return null;
    return { type, name: `${p.name} (${p.relationship})` };
  }
  return null;
}

export async function checkIn(formData: FormData) {
  const session = await getSession();
  if (!session) return;
  const studentId = String(formData.get("studentId"));
  const who = String(formData.get("who"));
  const resolved = resolvePersonName(studentId, who);
  if (!resolved) return;

  const date = todayIso();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO attendance (id, student_id, date, check_in_time, check_in_by_type, check_in_by_name, checked_in_staff_id)
     VALUES (?,?,?,?,?,?,?)
     ON CONFLICT(student_id, date) DO UPDATE SET
       check_in_time = excluded.check_in_time,
       check_in_by_type = excluded.check_in_by_type,
       check_in_by_name = excluded.check_in_by_name,
       checked_in_staff_id = excluded.checked_in_staff_id`
  ).run(uuid(), studentId, date, now, resolved.type, resolved.name, session.sub);

  revalidatePath("/checkin");
  revalidatePath("/dashboard");
  revalidatePath("/parent");
}

export async function checkOut(formData: FormData) {
  const session = await getSession();
  if (!session) return;
  const studentId = String(formData.get("studentId"));
  const who = String(formData.get("who"));
  const resolved = resolvePersonName(studentId, who);
  if (!resolved) return;

  const date = todayIso();
  const now = new Date().toISOString();

  db.prepare(
    `UPDATE attendance SET check_out_time = ?, check_out_by_type = ?, check_out_by_name = ?, checked_out_staff_id = ?
     WHERE student_id = ? AND date = ?`
  ).run(now, resolved.type, resolved.name, session.sub, studentId, date);

  revalidatePath("/checkin");
  revalidatePath("/dashboard");
  revalidatePath("/parent");
}
