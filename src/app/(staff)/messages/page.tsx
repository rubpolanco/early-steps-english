import Link from "next/link";
import { getSchool, getThreadsForSchool, getStudent, getClassroom, getStudents, getClassrooms } from "@/lib/queries";
import { SectionTitle, Badge, EmptyState } from "@/components/ui";
import { startDirectThread, createAnnouncement } from "./actions";

export default async function MessagesPage() {
  const school = getSchool();
  const threads = getThreadsForSchool(school.id);
  const students = getStudents(school.id, { status: "enrolled" });
  const classrooms = getClassrooms(school.id);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <SectionTitle>Messages</SectionTitle>
        {threads.length === 0 ? (
          <EmptyState icon="💬" title="No conversations yet" />
        ) : (
          <div className="card divide-y divide-brand-navy/5">
            {threads.map((t) => {
              const student = t.student_id ? getStudent(t.student_id) : undefined;
              const classroom = t.classroom_id ? getClassroom(t.classroom_id) : undefined;
              return (
                <Link key={t.id} href={`/messages/${t.id}`} className="flex items-center gap-3 p-4 hover:bg-brand-sky-light/40">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-brand-navy text-sm">{t.subject}</p>
                    <p className="text-xs text-brand-navy/60">
                      {student ? `${student.first_name} ${student.last_name}` : classroom?.name}
                    </p>
                  </div>
                  <Badge color={t.type === "announcement" ? "yellow" : "blue"}>
                    {t.type === "announcement" ? "Announcement" : "Direct"}
                  </Badge>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div>
          <SectionTitle>Message a family</SectionTitle>
          <form action={startDirectThread} className="card p-4 space-y-2">
            <select name="studentId" required className="w-full rounded-lg border border-brand-navy/15 px-3 py-2 text-sm">
              <option value="">Select a child</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
            </select>
            <input name="subject" placeholder="Subject" className="w-full rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
            <textarea name="body" placeholder="Write a message..." rows={3} className="w-full rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
            <button type="submit" className="btn-primary w-full py-2 text-sm">Start conversation</button>
          </form>
        </div>

        <div>
          <SectionTitle>Classroom announcement</SectionTitle>
          <form action={createAnnouncement} className="card p-4 space-y-2">
            <select name="classroomId" className="w-full rounded-lg border border-brand-navy/15 px-3 py-2 text-sm">
              <option value="">Whole school</option>
              {classrooms.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input name="subject" placeholder="Subject" required className="w-full rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
            <textarea name="body" placeholder="Write an announcement..." rows={3} className="w-full rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
            <button type="submit" className="btn-yellow w-full py-2 text-sm">Post announcement</button>
          </form>
        </div>
      </div>
    </div>
  );
}
