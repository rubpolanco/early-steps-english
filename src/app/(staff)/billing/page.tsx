import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getSchool, getTuitionPlans, getInvoicesForSchool, getStudents } from "@/lib/queries";
import { formatMoney } from "@/lib/format";
import { SectionTitle, Badge, StatCard } from "@/components/ui";
import { createTuitionPlan, createInvoice } from "./actions";

export default async function BillingPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/dashboard");
  const school = getSchool();
  const plans = getTuitionPlans(school.id);
  const invoices = getInvoicesForSchool(school.id);
  const students = getStudents(school.id, { status: "enrolled" });

  const totalOutstanding = invoices.filter((i) => i.status !== "paid").reduce((s, i) => s + i.amount, 0);
  const totalCollected = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const overdueCount = invoices.filter((i) => i.status !== "paid" && i.due_date < new Date().toISOString().slice(0, 10)).length;

  return (
    <div className="space-y-8">
      <SectionTitle>Billing</SectionTitle>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Collected" value={formatMoney(totalCollected)} color="green" />
        <StatCard label="Outstanding" value={formatMoney(totalOutstanding)} color="yellow" />
        <StatCard label="Overdue invoices" value={overdueCount} color="pink" />
      </div>

      <div>
        <SectionTitle>Invoices</SectionTitle>
        <div className="card divide-y divide-brand-navy/5">
          {invoices.map((inv) => {
            const isOverdue = inv.status !== "paid" && inv.due_date < new Date().toISOString().slice(0, 10);
            return (
              <Link key={inv.id} href={`/billing/${inv.id}`} className="flex items-center gap-3 p-4 hover:bg-brand-sky-light/40">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-brand-navy text-sm">{inv.first_name} {inv.last_name} — {inv.period_label}</p>
                  <p className="text-xs text-brand-navy/60">Due {inv.due_date}</p>
                </div>
                <p className="font-semibold text-brand-navy">{formatMoney(inv.amount)}</p>
                <Badge color={inv.status === "paid" ? "green" : isOverdue ? "red" : inv.status === "partial" ? "yellow" : "gray"}>
                  {isOverdue ? "Overdue" : inv.status}
                </Badge>
              </Link>
            );
          })}
          {invoices.length === 0 && <p className="p-4 text-sm text-brand-navy/60">No invoices yet.</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <SectionTitle>Create invoice</SectionTitle>
          <form action={createInvoice} className="card p-4 space-y-2">
            <select name="studentId" required className="w-full rounded-lg border border-brand-navy/15 px-3 py-2 text-sm">
              <option value="">Select child</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
            </select>
            <select name="tuitionPlanId" className="w-full rounded-lg border border-brand-navy/15 px-3 py-2 text-sm">
              <option value="">No plan</option>
              {plans.map((p) => <option key={p.id} value={p.id}>{p.name} — {formatMoney(p.amount)}</option>)}
            </select>
            <input name="periodLabel" placeholder="Period (e.g. September 2026)" required className="w-full rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
            <input name="amount" type="number" step="0.01" placeholder="Amount" required className="w-full rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
            <input name="dueDate" type="date" required className="w-full rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
            <button type="submit" className="btn-primary w-full py-2 text-sm">Create invoice</button>
          </form>
        </div>

        <div>
          <SectionTitle>Tuition plans</SectionTitle>
          <div className="card p-4 space-y-2 mb-3">
            {plans.map((p) => (
              <div key={p.id} className="flex justify-between text-sm">
                <span className="text-brand-navy">{p.name}</span>
                <span className="font-semibold text-brand-navy">{formatMoney(p.amount)} / {p.frequency}</span>
              </div>
            ))}
            {plans.length === 0 && <p className="text-sm text-brand-navy/60">No plans yet.</p>}
          </div>
          <form action={createTuitionPlan} className="card p-4 space-y-2">
            <input name="name" placeholder="Plan name" required className="w-full rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
            <input name="amount" type="number" step="0.01" placeholder="Amount" required className="w-full rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
            <select name="frequency" className="w-full rounded-lg border border-brand-navy/15 px-3 py-2 text-sm">
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
            </select>
            <button type="submit" className="btn-secondary w-full py-2 text-sm">+ Add plan</button>
          </form>
        </div>
      </div>
    </div>
  );
}
