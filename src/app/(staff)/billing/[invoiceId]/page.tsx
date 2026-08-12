import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getInvoice, getStudent, getPaymentsForInvoice } from "@/lib/queries";
import { formatMoney } from "@/lib/format";
import { SectionTitle, Badge } from "@/components/ui";
import { recordPayment } from "../actions";
import { getDict } from "@/lib/i18n";

const STATUS_LABEL_KEY = {
  paid: "paid",
  unpaid: "unpaid",
  partial: "partiallyPaid",
} as const;

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ invoiceId: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/dashboard");
  const { invoiceId } = await params;
  const invoice = getInvoice(invoiceId);
  if (!invoice) notFound();
  const student = getStudent(invoice.student_id);
  const payments = getPaymentsForInvoice(invoiceId);
  const paidTotal = payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = invoice.amount - paidTotal;
  const { locale, t } = await getDict();
  const s = t.staffApp.billing;
  const statusKey = invoice.status as keyof typeof STATUS_LABEL_KEY;

  return (
    <div className="max-w-lg space-y-6">
      <SectionTitle>{s.invoice} — {invoice.period_label}</SectionTitle>
      <div className="card p-5">
        <p className="font-semibold text-brand-navy">{student?.first_name} {student?.last_name}</p>
        <p className="text-sm text-brand-navy/60 mb-3">{s.duePrefix} {invoice.due_date}</p>
        <div className="flex justify-between text-sm mb-1 text-brand-navy/70">
          <span>{s.subtotalLabel}</span><span>{formatMoney(invoice.subtotal)}</span>
        </div>
        {invoice.tax_amount > 0 && (
          <div className="flex justify-between text-sm mb-1 text-brand-navy/70">
            <span>{s.itebisLabel}</span><span>{formatMoney(invoice.tax_amount)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm mb-1 pt-1 border-t border-brand-navy/10">
          <span>{s.totalLabel}</span><span className="font-semibold">{formatMoney(invoice.amount)}</span>
        </div>
        <div className="flex justify-between text-sm mb-1">
          <span>{s.paid}</span><span className="font-semibold text-emerald-700">{formatMoney(paidTotal)}</span>
        </div>
        <div className="flex justify-between text-sm mb-3">
          <span>{s.balanceLabel}</span><span className="font-semibold">{formatMoney(balance)}</span>
        </div>
        <Badge color={invoice.status === "paid" ? "green" : invoice.status === "partial" ? "yellow" : "gray"}>{s[STATUS_LABEL_KEY[statusKey]]}</Badge>
      </div>

      <div>
        <SectionTitle>{s.paymentHistoryHeading}</SectionTitle>
        <div className="card divide-y divide-brand-navy/5">
          {payments.map((p) => (
            <div key={p.id} className="flex justify-between p-3 text-sm">
              <span>{new Date(p.paid_at).toLocaleDateString(locale === "es" ? "es-ES" : "en-US")} · {p.method}</span>
              <span className="font-semibold">{formatMoney(p.amount)}</span>
            </div>
          ))}
          {payments.length === 0 && <p className="p-4 text-sm text-brand-navy/60">{s.noPaymentsRecorded}</p>}
        </div>
      </div>

      {balance > 0 && (
        <div>
          <SectionTitle>{s.recordPayment}</SectionTitle>
          <form action={recordPayment} className="card p-4 space-y-2">
            <input type="hidden" name="invoiceId" value={invoice.id} />
            <input name="amount" type="number" step="0.01" min="0.01" max={balance} defaultValue={balance} className="w-full rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
            <select name="method" className="w-full rounded-lg border border-brand-navy/15 px-3 py-2 text-sm">
              <option value="cash">{s.cash}</option>
              <option value="card">{s.card}</option>
              <option value="transfer">{s.transfer}</option>
              <option value="check">{s.check}</option>
            </select>
            <button type="submit" className="btn-primary w-full py-2 text-sm">{s.recordPayment}</button>
          </form>
          <p className="text-xs text-brand-navy/50 mt-2">
            {s.amountExceedsBalanceNote}
          </p>
          <p className="text-xs text-brand-navy/50 mt-1">
            {s.paymentProcessorNote}
          </p>
        </div>
      )}
    </div>
  );
}
