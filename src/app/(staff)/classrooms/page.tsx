import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getSchool, getClassrooms, getStudents, getStaffBySchool } from "@/lib/queries";
import { SectionTitle, Badge } from "@/components/ui";
import { createClassroom, updateClassroom } from "./actions";

export default async function ClassroomsPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/dashboard");
  const school = getSchool();
  const classrooms = getClassrooms(school.id);
  const students = getStudents(school.id, { status: "enrolled" });
  const staff = getStaffBySchool(school.id);

  return (
    <div className="space-y-8">
      <SectionTitle>Classrooms</SectionTitle>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {classrooms.map((c) => {
          const roster = students.filter((s) => s.classroom_id === c.id);
          const teachers = staff.filter((s) => s.classroom_id === c.id);
          return (
            <div key={c.id} className="card p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-heading font-bold text-brand-navy text-lg">{c.name}</h3>
                <Badge color="blue">{roster.length}/{c.capacity}</Badge>
              </div>
              <p className="text-sm text-brand-navy/70 mb-3">{c.age_group}</p>
              <p className="text-xs text-brand-navy/60 mb-3">
                Teacher{teachers.length !== 1 ? "s" : ""}: {teachers.map((t) => t.name).join(", ") || "Unassigned"}
              </p>
              <form action={updateClassroom} className="flex flex-wrap gap-2 items-end">
                <input type="hidden" name="classroomId" value={c.id} />
                <div>
                  <label className="block text-xs font-semibold text-brand-navy/70">Name</label>
                  <input name="name" defaultValue={c.name} className="rounded-lg border border-brand-navy/15 px-2 py-1 text-sm w-36" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-navy/70">Age group</label>
                  <input name="ageGroup" defaultValue={c.age_group ?? ""} className="rounded-lg border border-brand-navy/15 px-2 py-1 text-sm w-28" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-navy/70">Capacity</label>
                  <input name="capacity" type="number" defaultValue={c.capacity} className="rounded-lg border border-brand-navy/15 px-2 py-1 text-sm w-16" />
                </div>
                <button type="submit" className="btn-secondary px-3 py-1.5 text-xs">Save</button>
              </form>
            </div>
          );
        })}
      </div>

      <div>
        <SectionTitle>Add classroom</SectionTitle>
        <form action={createClassroom} className="card p-5 flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold text-brand-navy/70">Name</label>
            <input name="name" required className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-navy/70">Age group</label>
            <input name="ageGroup" placeholder="e.g. 3–4 years" className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-navy/70">Capacity</label>
            <input name="capacity" type="number" defaultValue={10} className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm w-20" />
          </div>
          <button type="submit" className="btn-primary px-4 py-2 text-sm">+ Add classroom</button>
        </form>
      </div>
    </div>
  );
}
