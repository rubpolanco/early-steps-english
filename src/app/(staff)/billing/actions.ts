"use server";

import { revalidatePath } from "next/cache";
import { v4 as uuid } from "uuid";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getInvoice, getPaymentsForInvoice } from "@/lib/queries";

export async function createTuitionPlan(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "admin") return;

  db.prepare(
    `INSERT INTO tuition_plans (id, school_id, name, amount, frequency) VALUES (?,?,?,?,?)`
  ).run(
    uuid(),
    session.schoolId,
    String(formData.get("name") || ""),
    Number(formData.get("amount") || 0),
    String(formData.get("frequency") || "monthly")
  );

  revalidatePath("/billing");
}

export async function createInvoice(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "admin") return;

  const studentId = String(formData.get("studentId"));
  const planId = String(formData.get("tuitionPlanId") || "") || null;
  const amount = Number(formData.get("amount") || 0);
  const periodLabel = String(formData.get("periodLabel") || "");
  const dueDate = String(formData.get("dueDate") || "");

  db.prepare(
    `INSERT INTO invoices (id, student_id, tuition_plan_id, period_label, amount, due_date, status) VALUES (?,?,?,?,?,?, 'unpaid')`
  ).run(uuid(), studentId, planId, periodLabel, amount, dueDate);

  revalidatePath("/billing");
}

export async function recordPayment(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "admin") return;

  const invoiceId = String(formData.get("invoiceId"));
  const amount = Number(formData.get("amount") || 0);
  const method = String(formData.get("method") || "cash");
  if (amount <= 0) return;

  db.prepare(
    `INSERT INTO payments (id, invoice_id, amount, method, recorded_by_staff_id) VALUES (?,?,?,?,?)`
  ).run(uuid(), invoiceId, amount, method, session.sub);

  const invoice = getInvoice(invoiceId);
  if (invoice) {
    const paid = getPaymentsForInvoice(invoiceId).reduce((sum, p) => sum + p.amount, 0);
    const status = paid >= invoice.amount ? "paid" : paid > 0 ? "partial" : "unpaid";
    db.prepare(`UPDATE invoices SET status = ? WHERE id = ?`).run(status, invoiceId);
  }

  revalidatePath("/billing");
  revalidatePath(`/billing/${invoiceId}`);
  revalidatePath("/parent/billing");
}
