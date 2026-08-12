import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getSchool, getClassrooms, getStudents, calcAge } from "@/lib/queries";
import { Avatar, Badge, SectionTitle, EmptyState } from "@/components/ui";

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

  return (
    <div>
      <SectionTitle
        action={
          session?.role === "admin" ? (
            <Link href="/students/new" className="btn-primary px-4 py-2 text-sm">+ Add Child</Link>
          ) : undefined
        }
      >
        Children
      </SectionTitle>

      <div className="flex gap-2 mb-6 flex-wrap">
        <Link href="/students" className={`badge ${!classroom ? "bg-brand-blue text-white" : "bg-white border border-brand-navy/15 text-brand-navy"}`}>
          All ({getStudents(school.id, { status: "enrolled" }).length})
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
        <EmptyState icon="🧒" title="No children found" subtitle="Try a different classroom filter." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((s) => (
            <Link href={`/students/${s.id}`} key={s.id} className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
              <Avatar name={`${s.first_name} ${s.last_name}`} url={s.photo_url} size={48} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-brand-navy truncate">{s.first_name} {s.last_name}</p>
                <p className="text-xs text-brand-navy/60">{calcAge(s.dob)} · {s.classroom_id ? classroomById[s.classroom_id]?.name : "Unassigned"}</p>
              </div>
              {s.allergies && <Badge color="red">Allergy</Badge>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
