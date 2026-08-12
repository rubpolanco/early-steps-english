import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getSchool, getClassrooms } from "@/lib/queries";
import { SectionTitle } from "@/components/ui";
import { createStudent } from "../actions";
import { getDict, translateAgeGroup } from "@/lib/i18n";

export default async function NewStudentPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/students");
  const school = getSchool();
  const classrooms = getClassrooms(school.id);
  const { locale, t } = await getDict();
  const s = t.staffApp.students;

  return (
    <div className="max-w-xl">
      <SectionTitle>{s.addChildTitle}</SectionTitle>
      <form action={createStudent} className="card p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-brand-navy mb-1">{s.firstName}</label>
            <input name="firstName" required className="w-full rounded-xl border border-brand-navy/15 px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-brand-navy mb-1">{s.lastName}</label>
            <input name="lastName" required className="w-full rounded-xl border border-brand-navy/15 px-3 py-2" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-brand-navy mb-1">{s.dateOfBirth}</label>
            <input name="dob" type="date" className="w-full rounded-xl border border-brand-navy/15 px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-brand-navy mb-1">{s.gender}</label>
            <select name="gender" className="w-full rounded-xl border border-brand-navy/15 px-3 py-2">
              <option value="">{s.preferNotToSay}</option>
              <option value="female">{s.female}</option>
              <option value="male">{s.male}</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-brand-navy mb-1">{s.classroom}</label>
          <select name="classroomId" className="w-full rounded-xl border border-brand-navy/15 px-3 py-2">
            <option value="">{t.staffApp.classrooms.unassigned}</option>
            {classrooms.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({translateAgeGroup(c.age_group, locale)})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-brand-navy mb-1">{s.allergies}</label>
          <input name="allergies" placeholder={s.allergiesPlaceholder} className="w-full rounded-xl border border-brand-navy/15 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-brand-navy mb-1">{t.common.notes}</label>
          <textarea name="notes" rows={3} className="w-full rounded-xl border border-brand-navy/15 px-3 py-2" />
        </div>
        <button type="submit" className="btn-primary px-5 py-2.5">{s.addChildButton}</button>
      </form>
    </div>
  );
}
