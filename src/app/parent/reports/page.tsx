import { getSession } from "@/lib/auth";
import { getStudentsForGuardian, getDailyReportsHistory, calcAge } from "@/lib/queries";
import { parseMeals, parseNaps, parsePotty, formatDate } from "@/lib/format";
import { Avatar, SectionTitle, EmptyState, Badge } from "@/components/ui";
import { getDict } from "@/lib/i18n";

export default async function ParentReportsPage() {
  const session = await getSession();
  if (!session) return null;
  const children = getStudentsForGuardian(session.sub);
  const { locale, t } = await getDict();
  const s = t.parentApp.reports;

  return (
    <div className="space-y-10">
      <SectionTitle>{s.title}</SectionTitle>
      {children.map((child) => {
        const history = getDailyReportsHistory(child.id, 10);
        return (
          <div key={child.id}>
            <div className="flex items-center gap-3 mb-3">
              <Avatar name={`${child.first_name} ${child.last_name}`} url={child.photo_url} />
              <div>
                <p className="font-heading font-bold text-brand-navy">{child.first_name}</p>
                <p className="text-xs text-brand-navy/60">{calcAge(child.dob, locale)}</p>
              </div>
            </div>
            {history.length === 0 ? (
              <EmptyState icon="📝" title={s.noReports} />
            ) : (
              <div className="space-y-3">
                {history.map((r) => {
                  const meals = parseMeals(r.meals);
                  const naps = parseNaps(r.naps);
                  const potty = parsePotty(r.potty);
                  return (
                    <div key={r.id} className="card p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold text-brand-navy text-sm">{formatDate(r.date)}</p>
                        {r.mood && <Badge color="blue">{r.mood}</Badge>}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-brand-navy/80">
                        <div>
                          <p className="font-semibold mb-1">🍽 {s.meals}</p>
                          {meals.map((m) => <p key={m.meal}>{m.meal}: {m.amount}</p>)}
                        </div>
                        <div>
                          <p className="font-semibold mb-1">😴 {s.naps}</p>
                          {naps.length > 0 ? naps.map((n, i) => <p key={i}>{n.start} – {n.end}</p>) : <p>—</p>}
                        </div>
                        <div>
                          <p className="font-semibold mb-1">🚼 {s.diapers}</p>
                          {potty.length > 0 ? potty.map((p, i) => <p key={i}>{p.note}</p>) : <p>—</p>}
                        </div>
                      </div>
                      {r.activities && <p className="text-xs text-brand-navy/70 mt-3"><strong>{s.activities}:</strong> {r.activities}</p>}
                      {r.learning_notes && <p className="text-xs text-brand-navy/70 mt-1"><strong>{s.learningNote}:</strong> {r.learning_notes}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
