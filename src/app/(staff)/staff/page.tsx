import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getSchool, getStaffBySchool, getClassrooms } from "@/lib/queries";
import { Avatar, Badge, SectionTitle } from "@/components/ui";
import { createStaff, toggleStaffActive, updateStaff } from "./actions";
import { getDict } from "@/lib/i18n";

export default async function StaffPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/dashboard");
  const school = getSchool();
  const staff = getStaffBySchool(school.id);
  const classrooms = getClassrooms(school.id);
  const classroomById = Object.fromEntries(classrooms.map((c) => [c.id, c]));
  const { t } = await getDict();
  const s = t.staffApp.staffPage;
  const ROLE_LABEL: Record<string, string> = {
    admin: s.roleDirector,
    teacher: s.roleTeacher,
    front_desk: s.roleFrontDesk,
  };

  return (
    <div className="space-y-8">
      <SectionTitle>{s.title}</SectionTitle>

      <div className="card divide-y divide-brand-navy/5">
        {staff.map((member) => (
          <div key={member.id} className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Avatar name={member.name} url={member.photo_url} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-brand-navy text-sm">{member.name}</p>
                <p className="text-xs text-brand-navy/60">
                  {ROLE_LABEL[member.role]} {member.classroom_id && `· ${classroomById[member.classroom_id]?.name}`} · {member.email}
                </p>
              </div>
              <Badge color={member.active ? "green" : "gray"}>{member.active ? t.common.active : t.common.inactive}</Badge>
              <form action={toggleStaffActive}>
                <input type="hidden" name="staffId" value={member.id} />
                <button className="btn-secondary px-3 py-1.5 text-xs">{member.active ? t.common.deactivate : t.common.reactivate}</button>
              </form>
            </div>

            <details className="group">
              <summary className="btn-secondary inline-block px-3 py-1.5 text-xs cursor-pointer select-none list-none">
                {t.common.editDetails}
              </summary>
              <form
                action={updateStaff}
                className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg bg-brand-sky/5 p-4"
              >
                <input type="hidden" name="staffId" value={member.id} />
                <input
                  name="name"
                  defaultValue={member.name}
                  placeholder={s.fullName}
                  required
                  className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm"
                />
                <input
                  name="email"
                  type="email"
                  defaultValue={member.email}
                  placeholder={t.common.email}
                  required
                  className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm"
                />
                <input
                  name="phone"
                  defaultValue={member.phone ?? ""}
                  placeholder={t.common.phone}
                  className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm"
                />
                <select
                  name="role"
                  defaultValue={member.role}
                  className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm"
                >
                  <option value="teacher">{s.roleTeacher}</option>
                  <option value="front_desk">{s.roleFrontDesk}</option>
                  <option value="admin">{s.roleDirector}</option>
                </select>
                <select
                  name="classroomId"
                  defaultValue={member.classroom_id ?? ""}
                  className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm"
                >
                  <option value="">{s.noClassroomAssigned}</option>
                  {classrooms.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input
                  name="password"
                  placeholder={s.newPassword}
                  className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm"
                />
                <button type="submit" className="btn-primary px-4 py-2 text-sm sm:col-span-2">
                  {t.common.saveChanges}
                </button>
              </form>
            </details>
          </div>
        ))}
      </div>

      <div>
        <SectionTitle>{s.addStaff}</SectionTitle>
        <form action={createStaff} className="card p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input name="name" placeholder={s.fullName} required className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
          <input name="email" type="email" placeholder={t.common.email} required className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
          <input name="phone" placeholder={t.common.phone} className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
          <select name="role" className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm">
            <option value="teacher">{s.roleTeacher}</option>
            <option value="front_desk">{s.roleFrontDesk}</option>
            <option value="admin">{s.roleDirector}</option>
          </select>
          <select name="classroomId" className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm">
            <option value="">{s.noClassroomAssigned}</option>
            {classrooms.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input name="password" placeholder={s.temporaryPassword} className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
          <button type="submit" className="btn-primary px-4 py-2 text-sm sm:col-span-2">{s.addStaffButton}</button>
        </form>
      </div>
    </div>
  );
}
