"use server";

import { revalidatePath } from "next/cache";
import { v4 as uuid } from "uuid";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getInvoice, getPaymentsForInvoice } from "@/lib/queries";

// Dominican Republic ITEBIS (Impuesto sobre Transferencia de Bienes
// Industrializados y Servicios) standard rate. Applied per-invoice (not
// unconditionally) since some educational services may be tax-exempt —
// staff decide at invoice-creation time via a checkbox.
const ITEBIS_RATE = 0.18;

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

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
  const subtotal = round2(Number(formData.get("amount") || 0));
  const periodLabel = String(formData.get("periodLabel") || "");
  const dueDate = String(formData.get("dueDate") || "");
  if (subtotal <= 0 || !periodLabel || !dueDate) return;

  const applyTax = formData.get("applyTax") === "yes";
  const taxRate = applyTax ? ITEBIS_RATE : 0;
  const taxAmount = round2(subtotal * taxRate);
  const total = round2(subtotal + taxAmount);

  db.prepare(
    `INSERT INTO invoices (id, student_id, tuition_plan_id, period_label, amount, subtotal, tax_rate, tax_amount, due_date, status)
     VALUES (?,?,?,?,?,?,?,?,?, 'unpaid')`
  ).run(uuid(), studentId, planId, periodLabel, total, subtotal, taxRate, taxAmount, dueDate);

  revalidatePath("/billing");
  revalidatePath("/parent/billing");
}

export async function recordPayment(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "admin") return;

  const invoiceId = String(formData.get("invoiceId"));
  const method = String(formData.get("method") || "cash");
  const invoice = getInvoice(invoiceId);
  if (!invoice) return;

  const alreadyPaid = getPaymentsForInvoice(invoiceId).reduce((sum, p) => sum + p.amount, 0);
  const remaining = round2(invoice.amount - alreadyPaid);
  let amount = round2(Number(formData.get("amount") || 0));
  if (amount <= 0 || remaining <= 0) return;
  // Robustness: a stray extra digit or a double submit should never push
  // an invoice into credit — cap the recorded payment at the real balance.
  if (amount > remaining) amount = remaining;

  db.prepare(
    `INSERT INTO payments (id, invoice_id, amount, method, recorded_by_staff_id) VALUES (?,?,?,?,?)`
  ).run(uuid(), invoiceId, amount, method, session.sub);

  const paidTotal = round2(alreadyPaid + amount);
  const status = paidTotal >= invoice.amount ? "paid" : paidTotal > 0 ? "partial" : "unpaid";
  db.prepare(`UPDATE invoices SET status = ? WHERE id = ?`).run(status, invoiceId);

  revalidatePath("/billing");
  revalidatePath(`/billing/${invoiceId}`);
  revalidatePath("/parent/billing");
}
