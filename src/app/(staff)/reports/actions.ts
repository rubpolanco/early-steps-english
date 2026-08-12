"use server";

import { revalidatePath } from "next/cache";
import { v4 as uuid } from "uuid";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export async function saveDailyReport(formData: FormData) {
  const session = await getSession();
  if (!session) return;
  const studentId = String(formData.get("studentId"));
  const date = todayIso();

  const meals = JSON.stringify([
    { meal: "Breakfast", amount: String(formData.get("breakfast") || "Not offered") },
    { meal: "Lunch", amount: String(formData.get("lunch") || "Not offered") },
    { meal: "Snack", amount: String(formData.get("snack") || "Not offered") },
  ]);
  const naps = JSON.stringify(
    formData.get("napStart")
      ? [{ start: String(formData.get("napStart")), end: String(formData.get("napEnd") || "") }]
      : []
  );
  const potty = JSON.stringify(
    String(formData.get("pottyNotes") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((note) => ({ note }))
  );

  db.prepare(
    `INSERT INTO daily_reports (id, student_id, date, mood, meals, naps, potty, activities, learning_notes, created_by_staff_id, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,datetime('now'))
     ON CONFLICT(student_id, date) DO UPDATE SET
       mood=excluded.mood, meals=excluded.meals, naps=excluded.naps, potty=excluded.potty,
       activities=excluded.activities, learning_notes=excluded.learning_notes, updated_at=datetime('now')`
  ).run(
    uuid(),
    studentId,
    date,
    String(formData.get("mood") || ""),
    meals,
    naps,
    potty,
    String(formData.get("activities") || ""),
    String(formData.get("learningNotes") || ""),
    session.sub
  );

  revalidatePath("/reports");
  revalidatePath(`/students/${studentId}`);
  revalidatePath("/parent/reports");
}
