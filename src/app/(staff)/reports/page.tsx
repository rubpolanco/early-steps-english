import { getSession } from "@/lib/auth";
import { getSchool, getClassrooms, getStudents, getDailyReport, calcAge } from "@/lib/queries";
import { parseMeals, parseNaps, parsePotty } from "@/lib/format";
import { Avatar, Badge, SectionTitle } from "@/components/ui";
import { saveDailyReport } from "./actions";
import { getDict } from "@/lib/i18n";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

const MOODS = ["Happy", "Playful", "Calm", "Tired", "Curious", "Fussy"] as const;
const AMOUNTS = ["All", "Most", "Some", "None", "Not offered"] as const;

const MOOD_LABEL_KEY = {
  Happy: "moodHappy",
  Playful: "moodPlayful",
  Calm: "moodCalm",
  Tired: "moodTired",
  Curious: "moodCurious",
  Fussy: "moodFussy",
} as const satisfies Record<(typeof MOODS)[number], string>;

const AMOUNT_LABEL_KEY = {
  All: "amountAll",
  Most: "amountMost",
  Some: "amountSome",
  None: "amountNone",
  "Not offered": "amountNotOffered",
} as const satisfies Record<(typeof AMOUNTS)[number], string>;

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ classroom?: string; student?: string }>;
}) {
  const session = await getSession();
  const school = getSchool();
  const classrooms = getClassrooms(school.id);
  const { classroom, student: highlightId } = await searchParams;
  const students = getStudents(school.id, { status: "enrolled", classroomId: classroom });
  const today = todayIso();
  const { locale, t } = await getDict();
  const s = t.staffApp.reports;

  const visibleClassrooms =
    session?.role === "teacher" && session.classroomId
      ? classrooms.filter((c) => c.id === session.classroomId)
      : classrooms;
  const visibleStudents = classroom ? students : students.filter((st) =>
    visibleClassrooms.some((c) => c.id === st.classroom_id)
  );

  return (
    <div>
      <SectionTitle>{s.title}</SectionTitle>
      <p className="text-sm text-brand-navy/70 -mt-3 mb-6">
        {s.reportsSubtitle}
      </p>

      <div className="flex gap-2 mb-6 flex-wrap">
        <a href="/reports" className={`badge ${!classroom ? "bg-brand-blue text-white" : "bg-white border border-brand-navy/15 text-brand-navy"}`}>{t.staffApp.students.allFilter}</a>
        {classrooms.map((c) => (
          <a key={c.id} href={`/reports?classroom=${c.id}`} className={`badge ${classroom === c.id ? "bg-brand-blue text-white" : "bg-white border border-brand-navy/15 text-brand-navy"}`}>
            {c.name}
          </a>
        ))}
      </div>

      <div className="space-y-4">
        {visibleStudents.map((st) => {
          const existing = getDailyReport(st.id, today);
          const meals = parseMeals(existing?.meals ?? null);
          const naps = parseNaps(existing?.naps ?? null);
          const potty = parsePotty(existing?.potty ?? null);
          const breakfastVal = meals.find((m) => m.meal === "Breakfast")?.amount ?? "";
          const lunchVal = meals.find((m) => m.meal === "Lunch")?.amount ?? "";
          const snackVal = meals.find((m) => m.meal === "Snack")?.amount ?? "";

          return (
            <details key={st.id} className="card overflow-hidden" open={highlightId === st.id}>
              <summary className="p-4 flex items-center gap-3 cursor-pointer select-none">
                <Avatar name={`${st.first_name} ${st.last_name}`} url={st.photo_url} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-brand-navy text-sm">{st.first_name} {st.last_name}</p>
                  <p className="text-xs text-brand-navy/60">{calcAge(st.dob, locale)}</p>
                </div>
                <Badge color={existing ? "green" : "gray"}>{existing ? s.reportSaved : s.noReportYet}</Badge>
              </summary>
              <form action={saveDailyReport} className="p-4 pt-0 space-y-4 border-t border-brand-navy/10">
                <input type="hidden" name="studentId" value={st.id} />

                <div>
                  <label className="block text-xs font-semibold text-brand-navy/70 mb-1">{s.mood}</label>
                  <div className="flex gap-2 flex-wrap">
                    {MOODS.map((m) => (
                      <label key={m} className="text-xs">
                        <input type="radio" name="mood" value={m} defaultChecked={existing?.mood === m} className="mr-1" />
                        {s[MOOD_LABEL_KEY[m]]}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { name: "breakfast", label: s.mealBreakfast, val: breakfastVal },
                    { name: "lunch", label: s.mealLunch, val: lunchVal },
                    { name: "snack", label: s.mealSnack, val: snackVal },
                  ].map((meal) => (
                    <div key={meal.name}>
                      <label className="block text-xs font-semibold text-brand-navy/70 mb-1">{meal.label}</label>
                      <select name={meal.name} defaultValue={meal.val} className="w-full rounded-lg border border-brand-navy/15 px-2 py-1.5 text-xs">
                        <option value="">—</option>
                        {AMOUNTS.map((a) => <option key={a} value={a}>{s[AMOUNT_LABEL_KEY[a]]}</option>)}
                      </select>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-brand-navy/70 mb-1">{s.napStartLabel}</label>
                    <input name="napStart" type="time" defaultValue={naps[0]?.start ?? ""} className="w-full rounded-lg border border-brand-navy/15 px-2 py-1.5 text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-navy/70 mb-1">{s.napEndLabel}</label>
                    <input name="napEnd" type="time" defaultValue={naps[0]?.end ?? ""} className="w-full rounded-lg border border-brand-navy/15 px-2 py-1.5 text-xs" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-navy/70 mb-1">{s.pottyDiaperNotesLabel}</label>
                  <input
                    name="pottyNotes"
                    defaultValue={potty.map((p) => p.note ?? `${p.time ?? ""} ${p.result ?? ""}`.trim()).join(", ")}
                    placeholder={s.pottyNotesPlaceholder}
                    className="w-full rounded-lg border border-brand-navy/15 px-2 py-1.5 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-navy/70 mb-1">{s.activities}</label>
                  <textarea name="activities" defaultValue={existing?.activities ?? ""} rows={2} className="w-full rounded-lg border border-brand-navy/15 px-2 py-1.5 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-navy/70 mb-1">{s.learningNote}</label>
                  <textarea name="learningNotes" defaultValue={existing?.learning_notes ?? ""} rows={2} className="w-full rounded-lg border border-brand-navy/15 px-2 py-1.5 text-xs" />
                </div>

                <button type="submit" className="btn-primary px-4 py-2 text-sm">{s.saveReportButton}</button>
              </form>
            </details>
          );
        })}
        {visibleStudents.length === 0 && (
          <p className="card p-6 text-center text-sm text-brand-navy/60">{s.noChildrenFound}</p>
        )}
      </div>
    </div>
  );
}
