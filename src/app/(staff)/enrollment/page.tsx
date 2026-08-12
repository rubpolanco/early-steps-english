import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getSchool, getClassrooms, getStudents, getGuardiansForStudent } from "@/lib/queries";
import { SectionTitle, EmptyState, Badge } from "@/components/ui";
import { addWaitlistEntry, enrollStudent } from "./actions";
import { getDict } from "@/lib/i18n";

export default async function EnrollmentPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/dashboard");
  const school = getSchool();
  const classrooms = getClassrooms(school.id);
  const waitlist = getStudents(school.id, { status: "waitlist" });
  const { t } = await getDict();
  const s = t.staffApp.enrollment;

  return (
    <div className="space-y-8">
      <SectionTitle>{s.pageHeading}</SectionTitle>

      {waitlist.length === 0 ? (
        <EmptyState icon="📋" title={s.noWaitlist} subtitle={s.waitlistEmptySubtitle} />
      ) : (
        <div className="card divide-y divide-brand-navy/5">
          {waitlist.map((st) => {
            const guardians = getGuardiansForStudent(st.id);
            return (
              <div key={st.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1">
                  <p className="font-semibold text-brand-navy text-sm">{st.first_name} {st.last_name}</p>
                  <p className="text-xs text-brand-navy/60">
                    {guardians.map((g) => g.name).join(", ") || s.noGuardianOnFile}
                    {st.desired_start_date && ` · ${s.wantsToStartPrefix} ${st.desired_start_date}`}
                  </p>
                </div>
                <Badge color="yellow">{t.staffApp.students.waitlist}</Badge>
                <form action={enrollStudent} className="flex gap-2">
                  <input type="hidden" name="studentId" value={st.id} />
                  <select name="classroomId" className="rounded-lg border border-brand-navy/15 px-2 py-1.5 text-xs">
                    <option value="">{s.chooseClassroomOption}</option>
                    {classrooms.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <button type="submit" className="btn-primary px-3 py-1.5 text-xs">{s.enrollButton}</button>
                </form>
              </div>
            );
          })}
        </div>
      )}

      <div>
        <SectionTitle>{s.addToWaitlistHeading}</SectionTitle>
        <form action={addWaitlistEntry} className="card p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input name="firstName" placeholder={s.childFirstNamePlaceholder} required className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
          <input name="lastName" placeholder={s.childLastNamePlaceholder} required className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
          <input name="dob" type="date" className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
          <input name="desiredStart" type="date" placeholder={s.desiredStartPlaceholder} className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
          <input name="guardianName" placeholder={s.guardianNamePlaceholder} className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
          <input name="guardianEmail" type="email" placeholder={s.guardianEmailPlaceholder} className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
          <input name="guardianPhone" placeholder={s.guardianPhonePlaceholder} className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
          <textarea name="notes" placeholder={t.common.notes} className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm sm:col-span-2" />
          <button type="submit" className="btn-primary px-4 py-2 text-sm sm:col-span-2">{s.addToWaitlist}</button>
        </form>
      </div>
    </div>
  );
}
