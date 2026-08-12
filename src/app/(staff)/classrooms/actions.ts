"use server";

import { revalidatePath } from "next/cache";
import { v4 as uuid } from "uuid";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

const COLORS = ["sky", "yellow", "green", "pink"];

export async function createClassroom(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "admin") return;

  db.prepare(
    `INSERT INTO classrooms (id, school_id, name, age_group, capacity, color) VALUES (?,?,?,?,?,?)`
  ).run(
    uuid(),
    session.schoolId,
    String(formData.get("name") || ""),
    String(formData.get("ageGroup") || ""),
    Number(formData.get("capacity") || 10),
    COLORS[Math.floor(Math.random() * COLORS.length)]
  );

  revalidatePath("/classrooms");
}

export async function updateClassroom(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "admin") return;
  const id = String(formData.get("classroomId"));

  db.prepare(`UPDATE classrooms SET name=?, age_group=?, capacity=? WHERE id=?`).run(
    String(formData.get("name") || ""),
    String(formData.get("ageGroup") || ""),
    Number(formData.get("capacity") || 10),
    id
  );

  revalidatePath("/classrooms");
}
