import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getSchool, getClassrooms, getStudents, getStaffBySchool } from "@/lib/queries";
import { SectionTitle, Badge } from "@/components/ui";
import { createClassroom, updateClassroom } from "./actions";
import { getDict, translateAgeGroup } from "@/lib/i18n";

export default async function ClassroomsPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/dashboard");
  const school = getSchool();
  const classrooms = getClassrooms(school.id);
  const students = getStudents(school.id, { status: "enrolled" });
  const staff = getStaffBySchool(school.id);
  const { locale, t } = await getDict();
  const s = t.staffApp.classrooms;

  return (
    <div className="space-y-8">
      <SectionTitle>{s.title}</SectionTitle>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {classrooms.map((c) => {
          const roster = students.filter((st) => st.classroom_id === c.id);
          const teachers = staff.filter((st) => st.classroom_id === c.id);
          return (
            <div key={c.id} className="card p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-heading font-bold text-brand-navy text-lg">{c.name}</h3>
                <Badge color="blue">{roster.length}/{c.capacity}</Badge>
              </div>
              <p className="text-sm text-brand-navy/70 mb-3">{translateAgeGroup(c.age_group, locale)}</p>
              <p className="text-xs text-brand-navy/60 mb-3">
                {teachers.length !== 1 ? s.teachersPlural : s.teacher}: {teachers.map((tc) => tc.name).join(", ") || s.unassigned}
              </p>
              <form action={updateClassroom} className="flex flex-wrap gap-2 items-end">
                <input type="hidden" name="classroomId" value={c.id} />
                <div>
                  <label className="block text-xs font-semibold text-brand-navy/70">{t.common.name}</label>
                  <input name="name" defaultValue={c.name} className="rounded-lg border border-brand-navy/15 px-2 py-1 text-sm w-36" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-navy/70">{s.ageGroup}</label>
                  <input name="ageGroup" defaultValue={c.age_group ?? ""} className="rounded-lg border border-brand-navy/15 px-2 py-1 text-sm w-28" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-navy/70">{s.capacity}</label>
                  <input name="capacity" type="number" defaultValue={c.capacity} className="rounded-lg border border-brand-navy/15 px-2 py-1 text-sm w-16" />
                </div>
                <button type="submit" className="btn-secondary px-3 py-1.5 text-xs">{t.common.save}</button>
              </form>
            </div>
          );
        })}
      </div>

      <div>
        <SectionTitle>{s.addClassroomHeading}</SectionTitle>
        <form action={createClassroom} className="card p-5 flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold text-brand-navy/70">{t.common.name}</label>
            <input name="name" required className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-navy/70">{s.ageGroup}</label>
            <input name="ageGroup" placeholder={s.ageGroupPlaceholder} className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-navy/70">{s.capacity}</label>
            <input name="capacity" type="number" defaultValue={10} className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm w-20" />
          </div>
          <button type="submit" className="btn-primary px-4 py-2 text-sm">{s.addClassroom}</button>
        </form>
      </div>
    </div>
  );
}
