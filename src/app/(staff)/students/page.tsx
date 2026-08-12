import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getSchool, getClassrooms, getStudents, calcAge } from "@/lib/queries";
import { Avatar, Badge, SectionTitle, EmptyState } from "@/components/ui";
import { getDict } from "@/lib/i18n";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ classroom?: string }>;
}) {
  const session = await getSession();
  const school = getSchool();
  const classrooms = getClassrooms(school.id);
  const { classroom } = await searchParams;
  const students = getStudents(school.id, { status: "enrolled", classroomId: classroom });
  const classroomById = Object.fromEntries(classrooms.map((c) => [c.id, c]));
  const { locale, t } = await getDict();
  const s = t.staffApp.students;

  return (
    <div>
      <SectionTitle
        action={
          session?.role === "admin" ? (
            <Link href="/students/new" className="btn-primary px-4 py-2 text-sm">{s.addStudent}</Link>
          ) : undefined
        }
      >
        {s.title}
      </SectionTitle>

      <div className="flex gap-2 mb-6 flex-wrap">
        <Link href="/students" className={`badge ${!classroom ? "bg-brand-blue text-white" : "bg-white border border-brand-navy/15 text-brand-navy"}`}>
          {s.allFilter} ({getStudents(school.id, { status: "enrolled" }).length})
        </Link>
        {classrooms.map((c) => (
          <Link
            key={c.id}
            href={`/students?classroom=${c.id}`}
            className={`badge ${classroom === c.id ? "bg-brand-blue text-white" : "bg-white border border-brand-navy/15 text-brand-navy"}`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {students.length === 0 ? (
        <EmptyState icon="🧒" title={s.noChildrenTitle} subtitle={s.noChildrenSubtitle} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((st) => (
            <Link href={`/students/${st.id}`} key={st.id} className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
              <Avatar name={`${st.first_name} ${st.last_name}`} url={st.photo_url} size={48} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-brand-navy truncate">{st.first_name} {st.last_name}</p>
                <p className="text-xs text-brand-navy/60">{calcAge(st.dob, locale)} · {st.classroom_id ? classroomById[st.classroom_id]?.name : t.staffApp.classrooms.unassigned}</p>
              </div>
              {st.allergies && <Badge color="red">{s.allergyBadge}</Badge>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
