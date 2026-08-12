"use server";

import { redirect } from "next/navigation";
import { getStaffByEmail, getGuardianByEmail, getStudentsForGuardian } from "@/lib/queries";
import { setSessionCookie, verifyPassword } from "@/lib/auth";
import { ensureSeeded } from "@/lib/seed";

export async function login(formData: FormData) {
  await ensureSeeded();

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "");

  if (!email || !password) {
    redirect(`/login?error=${encodeURIComponent("Please enter your email and password.")}`);
  }

  const staff = getStaffByEmail(email);
  if (staff) {
    const ok = await verifyPassword(password, staff.password_hash);
    if (!ok) {
      redirect(`/login?error=${encodeURIComponent("Incorrect password.")}`);
    }
    if (!staff.active) {
      redirect(`/login?error=${encodeURIComponent("This staff account is inactive.")}`);
    }
    await setSessionCookie({
      sub: staff.id,
      role: staff.role,
      name: staff.name,
      schoolId: staff.school_id,
      classroomId: staff.classroom_id,
    });
    redirect(next && next.startsWith("/") ? next : "/dashboard");
  }

  const guardian = getGuardianByEmail(email);
  if (guardian) {
    const ok = await verifyPassword(password, guardian.password_hash);
    if (!ok) {
      redirect(`/login?error=${encodeURIComponent("Incorrect password.")}`);
    }
    const kids = getStudentsForGuardian(guardian.id);
    await setSessionCookie({
      sub: guardian.id,
      role: "parent",
      name: guardian.name,
      schoolId: guardian.school_id,
      studentIds: kids.map((k) => k.id),
    });
    redirect(next && next.startsWith("/parent") ? next : "/parent");
  }

  redirect(`/login?error=${encodeURIComponent("We couldn't find an account with that email.")}`);
}
