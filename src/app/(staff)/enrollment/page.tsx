import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getSchool, getClassrooms, getStudents, getGuardiansForStudent } from "@/lib/queries";
import { SectionTitle, EmptyState, Badge } from "@/components/ui";
import { addWaitlistEntry, enrollStudent } from "./actions";

export default async function EnrollmentPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/dashboard");
  const school = getSchool();
  const classrooms = getClassrooms(school.id);
  const waitlist = getStudents(school.id, { status: "waitlist" });

  return (
    <div className="space-y-8">
      <SectionTitle>Enrollment & Waitlist</SectionTitle>

      {waitlist.length === 0 ? (
        <EmptyState icon="📋" title="No one on the waitlist" subtitle="New prospective families you add will show up here." />
      ) : (
        <div className="card divide-y divide-brand-navy/5">
          {waitlist.map((s) => {
            const guardians = getGuardiansForStudent(s.id);
            return (
              <div key={s.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1">
                  <p className="font-semibold text-brand-navy text-sm">{s.first_name} {s.last_name}</p>
                  <p className="text-xs text-brand-navy/60">
                    {guardians.map((g) => g.name).join(", ") || "No guardian on file"}
                    {s.desired_start_date && ` · Wants to start ${s.desired_start_date}`}
                  </p>
                </div>
                <Badge color="yellow">Waitlist</Badge>
                <form action={enrollStudent} className="flex gap-2">
                  <input type="hidden" name="studentId" value={s.id} />
                  <select name="classroomId" className="rounded-lg border border-brand-navy/15 px-2 py-1.5 text-xs">
                    <option value="">Choose classroom</option>
                    {classrooms.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <button type="submit" className="btn-primary px-3 py-1.5 text-xs">Enroll</button>
                </form>
              </div>
            );
          })}
        </div>
      )}

      <div>
        <SectionTitle>Add to waitlist</SectionTitle>
        <form action={addWaitlistEntry} className="card p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input name="firstName" placeholder="Child's first name" required className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
          <input name="lastName" placeholder="Child's last name" required className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
          <input name="dob" type="date" className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
          <input name="desiredStart" type="date" placeholder="Desired start date" className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
          <input name="guardianName" placeholder="Parent/guardian name" className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
          <input name="guardianEmail" type="email" placeholder="Parent/guardian email" className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
          <input name="guardianPhone" placeholder="Parent/guardian phone" className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
          <textarea name="notes" placeholder="Notes" className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm sm:col-span-2" />
          <button type="submit" className="btn-primary px-4 py-2 text-sm sm:col-span-2">+ Add to waitlist</button>
        </form>
      </div>
    </div>
  );
}
