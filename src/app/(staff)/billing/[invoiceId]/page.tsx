import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getInvoice, getStudent, getPaymentsForInvoice } from "@/lib/queries";
import { formatMoney } from "@/lib/format";
import { SectionTitle, Badge } from "@/components/ui";
import { recordPayment } from "../actions";

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
  const paidTotal = payments.reduce((s, p) => s + p.amount, 0);
  const balance = invoice.amount - paidTotal;

  return (
    <div className="max-w-lg space-y-6">
      <SectionTitle>Invoice — {invoice.period_label}</SectionTitle>
      <div className="card p-5">
        <p className="font-semibold text-brand-navy">{student?.first_name} {student?.last_name}</p>
        <p className="text-sm text-brand-navy/60 mb-3">Due {invoice.due_date}</p>
        <div className="flex justify-between text-sm mb-1">
          <span>Total</span><span className="font-semibold">{formatMoney(invoice.amount)}</span>
        </div>
        <div className="flex justify-between text-sm mb-1">
          <span>Paid</span><span className="font-semibold text-emerald-700">{formatMoney(paidTotal)}</span>
        </div>
        <div className="flex justify-between text-sm mb-3">
          <span>Balance</span><span className="font-semibold">{formatMoney(balance)}</span>
        </div>
        <Badge color={invoice.status === "paid" ? "green" : invoice.status === "partial" ? "yellow" : "gray"}>{invoice.status}</Badge>
      </div>

      <div>
        <SectionTitle>Payment history</SectionTitle>
        <div className="card divide-y divide-brand-navy/5">
          {payments.map((p) => (
            <div key={p.id} className="flex justify-between p-3 text-sm">
              <span>{new Date(p.paid_at).toLocaleDateString()} · {p.method}</span>
              <span className="font-semibold">{formatMoney(p.amount)}</span>
            </div>
          ))}
          {payments.length === 0 && <p className="p-4 text-sm text-brand-navy/60">No payments recorded.</p>}
        </div>
      </div>

      {balance > 0 && (
        <div>
          <SectionTitle>Record a payment</SectionTitle>
          <form action={recordPayment} className="card p-4 space-y-2">
            <input type="hidden" name="invoiceId" value={invoice.id} />
            <input name="amount" type="number" step="0.01" defaultValue={balance} className="w-full rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
            <select name="method" className="w-full rounded-lg border border-brand-navy/15 px-3 py-2 text-sm">
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="transfer">Bank transfer</option>
              <option value="check">Check</option>
            </select>
            <button type="submit" className="btn-primary w-full py-2 text-sm">Record payment</button>
          </form>
          <p className="text-xs text-brand-navy/50 mt-2">
            Note: this records payments manually. Connecting a real payment processor (e.g. Stripe) would require API keys you provide.
          </p>
        </div>
      )}
    </div>
  );
}
