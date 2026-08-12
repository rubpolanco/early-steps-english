import { getSession } from "@/lib/auth";
import { getStudentsForGuardian, getInvoicesForStudent, getPaymentsForInvoice } from "@/lib/queries";
import { formatMoney } from "@/lib/format";
import { SectionTitle, Badge, EmptyState, Avatar } from "@/components/ui";

export default async function ParentBillingPage() {
  const session = await getSession();
  if (!session) return null;
  const children = getStudentsForGuardian(session.sub);

  return (
    <div className="space-y-10">
      <SectionTitle>Billing</SectionTitle>
      {children.map((child) => {
        const invoices = getInvoicesForStudent(child.id);
        return (
          <div key={child.id}>
            <div className="flex items-center gap-3 mb-3">
              <Avatar name={`${child.first_name} ${child.last_name}`} url={child.photo_url} />
              <p className="font-heading font-bold text-brand-navy">{child.first_name}</p>
            </div>
            {invoices.length === 0 ? (
              <EmptyState icon="💳" title="No invoices yet" />
            ) : (
              <div className="card divide-y divide-brand-navy/5">
                {invoices.map((inv) => {
                  const paid = getPaymentsForInvoice(inv.id).reduce((s, p) => s + p.amount, 0);
                  const isOverdue = inv.status !== "paid" && inv.due_date < new Date().toISOString().slice(0, 10);
                  return (
                    <div key={inv.id} className="flex items-center gap-3 p-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-brand-navy text-sm">{inv.period_label}</p>
                        <p className="text-xs text-brand-navy/60">Due {inv.due_date} · Paid {formatMoney(paid)} of {formatMoney(inv.amount)}</p>
                      </div>
                      <p className="font-semibold text-brand-navy">{formatMoney(inv.amount)}</p>
                      <Badge color={inv.status === "paid" ? "green" : isOverdue ? "red" : inv.status === "partial" ? "yellow" : "gray"}>
                        {isOverdue ? "Overdue" : inv.status}
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
        To make a payment, please contact the school office. Online payments can be enabled once a payment processor is connected.
      </p>
    </div>
  );
}
