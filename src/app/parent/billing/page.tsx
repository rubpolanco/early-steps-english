import { getSession } from "@/lib/auth";
import { getStudentsForGuardian, getInvoicesForStudent, getPaymentsForInvoice } from "@/lib/queries";
import { formatMoney } from "@/lib/format";
import { SectionTitle, Badge, EmptyState, Avatar } from "@/components/ui";
import { getDict } from "@/lib/i18n";

export default async function ParentBillingPage() {
  const session = await getSession();
  if (!session) return null;
  const children = getStudentsForGuardian(session.sub);
  const { t } = await getDict();
  const s = t.parentApp.billing;

  return (
    <div className="space-y-10">
      <SectionTitle>{s.title}</SectionTitle>
      {children.map((child) => {
        const invoices = getInvoicesForStudent(child.id);
        return (
          <div key={child.id}>
            <div className="flex items-center gap-3 mb-3">
              <Avatar name={`${child.first_name} ${child.last_name}`} url={child.photo_url} />
              <p className="font-heading font-bold text-brand-navy">{child.first_name}</p>
            </div>
            {invoices.length === 0 ? (
              <EmptyState icon="💳" title={s.noInvoices} />
            ) : (
              <div className="card divide-y divide-brand-navy/5">
                {invoices.map((inv) => {
                  const paid = getPaymentsForInvoice(inv.id).reduce((sum, p) => sum + p.amount, 0);
                  const isOverdue = inv.status !== "paid" && inv.due_date < new Date().toISOString().slice(0, 10);
                  return (
                    <div key={inv.id} className="flex items-center gap-3 p-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-brand-navy text-sm">{inv.period_label}</p>
                        <p className="text-xs text-brand-navy/60">{s.due} {inv.due_date} · {s.paidAmountLabel} {formatMoney(paid)} {s.of} {formatMoney(inv.amount)}</p>
                        {inv.tax_amount > 0 && (
                          <p className="text-[11px] text-brand-navy/45">
                            {s.subtotalLabel} {formatMoney(inv.subtotal)} + {s.itebisLabel} {formatMoney(inv.tax_amount)}
                          </p>
                        )}
                      </div>
                      <p className="font-semibold text-brand-navy">{formatMoney(inv.amount)}</p>
                      <Badge color={inv.status === "paid" ? "green" : isOverdue ? "red" : inv.status === "partial" ? "yellow" : "gray"}>
                        {isOverdue ? s.overdue : inv.status === "paid" ? s.paid : inv.status === "partial" ? s.partiallyPaid : s.unpaid}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
      <p className="text-xs text-brand-navy/50">
        {s.paymentNote}
      </p>
    </div>
  );
}
