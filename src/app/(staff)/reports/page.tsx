import { getSession } from "@/lib/auth";
import { getSchool, getClassrooms, getStudents, getDailyReport, calcAge } from "@/lib/queries";
import { parseMeals, parseNaps, parsePotty } from "@/lib/format";
import { Avatar, Badge, SectionTitle } from "@/components/ui";
import { saveDailyReport } from "./actions";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

const MOODS = ["Happy", "Playful", "Calm", "Tired", "Curious", "Fussy"];
const AMOUNTS = ["All", "Most", "Some", "None", "Not offered"];

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

  const visibleClassrooms =
    session?.role === "teacher" && session.classroomId
      ? classrooms.filter((c) => c.id === session.classroomId)
      : classrooms;
  const visibleStudents = classroom ? students : students.filter((s) =>
    visibleClassrooms.some((c) => c.id === s.classroom_id)
  );

  return (
    <div>
      <SectionTitle>Daily Reports</SectionTitle>
      <p className="text-sm text-brand-navy/70 -mt-3 mb-6">
        Fill out today&apos;s report for each child — meals, naps, potty, mood and activities.
      </p>

      <div className="flex gap-2 mb-6 flex-wrap">
        <a href="/reports" className={`badge ${!classroom ? "bg-brand-blue text-white" : "bg-white border border-brand-navy/15 text-brand-navy"}`}>All</a>
        {classrooms.map((c) => (
          <a key={c.id} href={`/reports?classroom=${c.id}`} className={`badge ${classroom === c.id ? "bg-brand-blue text-white" : "bg-white border border-brand-navy/15 text-brand-navy"}`}>
            {c.name}
          </a>
        ))}
      </div>

      <div className="space-y-4">
        {visibleStudents.map((s) => {
          const existing = getDailyReport(s.id, today);
          const meals = parseMeals(existing?.meals ?? null);
          const naps = parseNaps(existing?.naps ?? null);
          const potty = parsePotty(existing?.potty ?? null);
          const breakfastVal = meals.find((m) => m.meal === "Breakfast")?.amount ?? "";
          const lunchVal = meals.find((m) => m.meal === "Lunch")?.amount ?? "";
          const snackVal = meals.find((m) => m.meal === "Snack")?.amount ?? "";

          return (
            <details key={s.id} className="card overflow-hidden" open={highlightId === s.id}>
              <summary className="p-4 flex items-center gap-3 cursor-pointer select-none">
                <Avatar name={`${s.first_name} ${s.last_name}`} url={s.photo_url} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-brand-navy text-sm">{s.first_name} {s.last_name}</p>
                  <p className="text-xs text-brand-navy/60">{calcAge(s.dob)}</p>
                </div>
                <Badge color={existing ? "green" : "gray"}>{existing ? "Report saved" : "No report yet"}</Badge>
              </summary>
              <form action={saveDailyReport} className="p-4 pt-0 space-y-4 border-t border-brand-navy/10">
                <input type="hidden" name="studentId" value={s.id} />

                <div>
                  <label className="block text-xs font-semibold text-brand-navy/70 mb-1">Mood</label>
                  <div className="flex gap-2 flex-wrap">
                    {MOODS.map((m) => (
                      <label key={m} className="text-xs">
                        <input type="radio" name="mood" value={m} defaultChecked={existing?.mood === m} className="mr-1" />
                        {m}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { name: "breakfast", label: "Breakfast", val: breakfastVal },
                    { name: "lunch", label: "Lunch", val: lunchVal },
                    { name: "snack", label: "Snack", val: snackVal },
                  ].map((meal) => (
                    <div key={meal.name}>
                      <label className="block text-xs font-semibold text-brand-navy/70 mb-1">{meal.label}</label>
                      <select name={meal.name} defaultValue={meal.val} className="w-full rounded-lg border border-brand-navy/15 px-2 py-1.5 text-xs">
                        <option value="">—</option>
                        {AMOUNTS.map((a) => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-brand-navy/70 mb-1">Nap start</label>
                    <input name="napStart" type="time" defaultValue={naps[0]?.start ?? ""} className="w-full rounded-lg border border-brand-navy/15 px-2 py-1.5 text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-navy/70 mb-1">Nap end</label>
                    <input name="napEnd" type="time" defaultValue={naps[0]?.end ?? ""} className="w-full rounded-lg border border-brand-navy/15 px-2 py-1.5 text-xs" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-navy/70 mb-1">Potty / diaper notes</label>
                  <input
                    name="pottyNotes"
                    defaultValue={potty.map((p) => p.note ?? `${p.time ?? ""} ${p.result ?? ""}`.trim()).join(", ")}
                    placeholder="e.g. 10:00 Dry, 13:45 Wet"
                    className="w-full rounded-lg border border-brand-navy/15 px-2 py-1.5 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-navy/70 mb-1">Activities today</label>
                  <textarea name="activities" defaultValue={existing?.activities ?? ""} rows={2} className="w-full rounded-lg border border-brand-navy/15 px-2 py-1.5 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-navy/70 mb-1">Learning notes for parents</label>
                  <textarea name="learningNotes" defaultValue={existing?.learning_notes ?? ""} rows={2} className="w-full rounded-lg border border-brand-navy/15 px-2 py-1.5 text-xs" />
                </div>

                <button type="submit" className="btn-primary px-4 py-2 text-sm">Save report</button>
              </form>
            </details>
          );
        })}
        {visibleStudents.length === 0 && (
          <p className="card p-6 text-center text-sm text-brand-navy/60">No children found.</p>
        )}
      </div>
    </div>
  );
}
