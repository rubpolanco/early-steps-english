import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getSchool, getStaffBySchool, getClassrooms } from "@/lib/queries";
import { Avatar, Badge, SectionTitle } from "@/components/ui";
import { createStaff, toggleStaffActive, updateStaff } from "./actions";

const ROLE_LABEL: Record<string, string> = {
  admin: "Director / Admin",
  teacher: "Teacher",
  front_desk: "Front Desk",
};

export default async function StaffPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/dashboard");
  const school = getSchool();
  const staff = getStaffBySchool(school.id);
  const classrooms = getClassrooms(school.id);
  const classroomById = Object.fromEntries(classrooms.map((c) => [c.id, c]));

  return (
    <div className="space-y-8">
      <SectionTitle>Staff</SectionTitle>

      <div className="card divide-y divide-brand-navy/5">
        {staff.map((s) => (
          <div key={s.id} className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Avatar name={s.name} url={s.photo_url} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-brand-navy text-sm">{s.name}</p>
                <p className="text-xs text-brand-navy/60">
                  {ROLE_LABEL[s.role]} {s.classroom_id && `· ${classroomById[s.classroom_id]?.name}`} · {s.email}
                </p>
              </div>
              <Badge color={s.active ? "green" : "gray"}>{s.active ? "Active" : "Inactive"}</Badge>
              <form action={toggleStaffActive}>
                <input type="hidden" name="staffId" value={s.id} />
                <button className="btn-secondary px-3 py-1.5 text-xs">{s.active ? "Deactivate" : "Reactivate"}</button>
              </form>
            </div>

            <details className="group">
              <summary className="btn-secondary inline-block px-3 py-1.5 text-xs cursor-pointer select-none list-none">
                ✎ Edit details
              </summary>
              <form
                action={updateStaff}
                className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg bg-brand-sky/5 p-4"
              >
                <input type="hidden" name="staffId" value={s.id} />
                <input
                  name="name"
                  defaultValue={s.name}
                  placeholder="Full name"
                  required
                  className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm"
                />
                <input
                  name="email"
                  type="email"
                  defaultValue={s.email}
                  placeholder="Email"
                  required
                  className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm"
                />
                <input
                  name="phone"
                  defaultValue={s.phone ?? ""}
                  placeholder="Phone"
                  className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm"
                />
                <select
                  name="role"
                  defaultValue={s.role}
                  className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm"
                >
                  <option value="teacher">Teacher</option>
                  <option value="front_desk">Front Desk</option>
                  <option value="admin">Director / Admin</option>
                </select>
                <select
                  name="classroomId"
                  defaultValue={s.classroom_id ?? ""}
                  className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm"
                >
                  <option value="">No classroom assigned</option>
                  {classrooms.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input
                  name="password"
                  placeholder="New password (leave blank to keep current)"
                  className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm"
                />
                <button type="submit" className="btn-primary px-4 py-2 text-sm sm:col-span-2">
                  Save changes
                </button>
              </form>
            </details>
          </div>
        ))}
      </div>

      <div>
        <SectionTitle>Add staff member</SectionTitle>
        <form action={createStaff} className="card p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input name="name" placeholder="Full name" required className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
          <input name="email" type="email" placeholder="Email" required className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
          <input name="phone" placeholder="Phone" className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
          <select name="role" className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm">
            <option value="teacher">Teacher</option>
            <option value="front_desk">Front Desk</option>
            <option value="admin">Director / Admin</option>
          </select>
          <select name="classroomId" className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm">
            <option value="">No classroom assigned</option>
            {classrooms.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input name="password" placeholder="Temporary password (default: Teach2026!)" className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
          <button type="submit" className="btn-primary px-4 py-2 text-sm sm:col-span-2">+ Add staff member</button>
        </form>
      </div>
    </div>
  );
}
