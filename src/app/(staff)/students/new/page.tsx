import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getSchool, getClassrooms } from "@/lib/queries";
import { SectionTitle } from "@/components/ui";
import { createStudent } from "../actions";

export default async function NewStudentPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/students");
  const school = getSchool();
  const classrooms = getClassrooms(school.id);

  return (
    <div className="max-w-xl">
      <SectionTitle>Add a Child</SectionTitle>
      <form action={createStudent} className="card p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-brand-navy mb-1">First name</label>
            <input name="firstName" required className="w-full rounded-xl border border-brand-navy/15 px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-brand-navy mb-1">Last name</label>
            <input name="lastName" required className="w-full rounded-xl border border-brand-navy/15 px-3 py-2" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-brand-navy mb-1">Date of birth</label>
            <input name="dob" type="date" className="w-full rounded-xl border border-brand-navy/15 px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-brand-navy mb-1">Gender</label>
            <select name="gender" className="w-full rounded-xl border border-brand-navy/15 px-3 py-2">
              <option value="">Prefer not to say</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-brand-navy mb-1">Classroom</label>
          <select name="classroomId" className="w-full rounded-xl border border-brand-navy/15 px-3 py-2">
            <option value="">Unassigned</option>
            {classrooms.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.age_group})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-brand-navy mb-1">Allergies</label>
          <input name="allergies" placeholder="e.g. Peanuts" className="w-full rounded-xl border border-brand-navy/15 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-brand-navy mb-1">Notes</label>
          <textarea name="notes" rows={3} className="w-full rounded-xl border border-brand-navy/15 px-3 py-2" />
        </div>
        <button type="submit" className="btn-primary px-5 py-2.5">Add Child</button>
      </form>
    </div>
  );
}
