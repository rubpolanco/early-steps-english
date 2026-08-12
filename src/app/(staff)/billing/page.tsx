import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getSchool, getTuitionPlans, getInvoicesForSchool, getStudents } from "@/lib/queries";
import { formatMoney } from "@/lib/format";
import { SectionTitle, Badge, StatCard } from "@/components/ui";
import { createTuitionPlan, createInvoice } from "./actions";
import { getDict } from "@/lib/i18n";

const STATUS_LABEL_KEY = {
  paid: "paid",
  unpaid: "unpaid",
  partial: "partiallyPaid",
} as const;

export default async function BillingPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/dashboard");
  const school = getSchool();
  const plans = getTuitionPlans(school.id);
  const invoices = getInvoicesForSchool(school.id);
  const students = getStudents(school.id, { status: "enrolled" });
  const { t } = await getDict();
  const s = t.staffApp.billing;

  const today = new Date().toISOString().slice(0, 10);
  const isOverdue = (inv: { status: string; due_date: string }) =>
    inv.status !== "paid" && inv.due_date < today;

  const totalOutstanding = invoices.filter((i) => i.status !== "paid").reduce((sum, i) => sum + i.amount, 0);
  const totalCollected = invoices.filter((i) => i.status === "paid").reduce((sum, i) => sum + i.amount, 0);
  const overdueCount = invoices.filter(isOverdue).length;

  return (
    <div className="space-y-8">
      <SectionTitle>{s.title}</SectionTitle>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label={s.collectedLabel} value={formatMoney(totalCollected)} color="green" />
        <StatCard label={s.outstandingLabel} value={formatMoney(totalOutstanding)} color="yellow" />
        <StatCard label={s.overdueInvoicesLabel} value={overdueCount} color="pink" />
      </div>

      <div>
        <SectionTitle>{s.invoicesHeading}</SectionTitle>
        <div className="card divide-y divide-brand-navy/5">
          {invoices.map((inv) => {
            const overdue = isOverdue(inv);
            const statusKey = inv.status as keyof typeof STATUS_LABEL_KEY;
            return (
              <Link key={inv.id} href={`/billing/${inv.id}`} className="flex items-center gap-3 p-4 hover:bg-brand-sky-light/40">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-brand-navy text-sm">{inv.first_name} {inv.last_name} — {inv.period_label}</p>
                  <p className="text-xs text-brand-navy/60">{s.duePrefix} {inv.due_date}</p>
                  {inv.tax_amount > 0 && (
                    <p className="text-[11px] text-brand-navy/45">
                      {s.subtotalLabel} {formatMoney(inv.subtotal)} + {s.itebisLabel} {formatMoney(inv.tax_amount)}
                    </p>
                  )}
                </div>
                <p className="font-semibold text-brand-navy">{formatMoney(inv.amount)}</p>
                <Badge color={inv.status === "paid" ? "green" : overdue ? "red" : inv.status === "partial" ? "yellow" : "gray"}>
                  {overdue ? s.overdueBadge : s[STATUS_LABEL_KEY[statusKey]]}
                </Badge>
              </Link>
            );
          })}
          {invoices.length === 0 && <p className="p-4 text-sm text-brand-navy/60">{s.noInvoices}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <SectionTitle>{s.createInvoiceHeading}</SectionTitle>
          <form action={createInvoice} className="card p-4 space-y-2">
            <select name="studentId" required className="w-full rounded-lg border border-brand-navy/15 px-3 py-2 text-sm">
              <option value="">{s.selectChildOption}</option>
              {students.map((st) => <option key={st.id} value={st.id}>{st.first_name} {st.last_name}</option>)}
            </select>
            <select name="tuitionPlanId" className="w-full rounded-lg border border-brand-navy/15 px-3 py-2 text-sm">
              <option value="">{s.noPlanOption}</option>
              {plans.map((p) => <option key={p.id} value={p.id}>{p.name} — {formatMoney(p.amount)}</option>)}
            </select>
            <input name="periodLabel" placeholder={s.periodPlaceholder} required className="w-full rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
            <input name="amount" type="number" step="0.01" min="0.01" placeholder={s.amountBeforeTaxPlaceholder} required className="w-full rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
            <input name="dueDate" type="date" required className="w-full rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
            <label className="flex items-start gap-2 text-xs text-brand-navy/70 pt-1">
              <input type="checkbox" name="applyTax" value="yes" defaultChecked className="mt-0.5" />
              <span>{s.applyItebisLabel}</span>
            </label>
            <button type="submit" className="btn-primary w-full py-2 text-sm">{s.createInvoiceHeading}</button>
            <p className="text-[11px] text-brand-navy/45 pt-1">{s.itebisNote}</p>
          </form>
        </div>

        <div>
          <SectionTitle>{s.tuitionPlansHeading}</SectionTitle>
          <div className="card p-4 space-y-2 mb-3">
            {plans.map((p) => (
              <div key={p.id} className="flex justify-between text-sm">
                <span className="text-brand-navy">{p.name}</span>
                <span className="font-semibold text-brand-navy">{formatMoney(p.amount)} / {p.frequency}</span>
              </div>
            ))}
            {plans.length === 0 && <p className="text-sm text-brand-navy/60">{s.noPlansYet}</p>}
          </div>
          <form action={createTuitionPlan} className="card p-4 space-y-2">
            <input name="name" placeholder={s.planNamePlaceholder} required className="w-full rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
            <input name="amount" type="number" step="0.01" placeholder={s.amount} required className="w-full rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
            <select name="frequency" className="w-full rounded-lg border border-brand-navy/15 px-3 py-2 text-sm">
              <option value="monthly">{s.frequencyMonthly}</option>
              <option value="weekly">{s.frequencyWeekly}</option>
            </select>
            <button type="submit" className="btn-secondary w-full py-2 text-sm">{s.addPlanButton}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
