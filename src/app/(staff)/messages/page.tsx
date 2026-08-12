import Link from "next/link";
import { getSchool, getThreadsForSchool, getStudent, getClassroom, getStudents, getClassrooms } from "@/lib/queries";
import { SectionTitle, Badge, EmptyState } from "@/components/ui";
import { startDirectThread, createAnnouncement } from "./actions";
import { getDict } from "@/lib/i18n";

export default async function MessagesPage() {
  const school = getSchool();
  const threads = getThreadsForSchool(school.id);
  const students = getStudents(school.id, { status: "enrolled" });
  const classrooms = getClassrooms(school.id);
  const { t } = await getDict();
  const s = t.staffApp.messages;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <SectionTitle>{s.title}</SectionTitle>
        {threads.length === 0 ? (
          <EmptyState icon="💬" title={s.noThreads} />
        ) : (
          <div className="card divide-y divide-brand-navy/5">
            {threads.map((thread) => {
              const student = thread.student_id ? getStudent(thread.student_id) : undefined;
              const classroom = thread.classroom_id ? getClassroom(thread.classroom_id) : undefined;
              return (
                <Link key={thread.id} href={`/messages/${thread.id}`} className="flex items-center gap-3 p-4 hover:bg-brand-sky-light/40">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-brand-navy text-sm">{thread.subject}</p>
                    <p className="text-xs text-brand-navy/60">
                      {student ? `${student.first_name} ${student.last_name}` : classroom?.name}
                    </p>
                  </div>
                  <Badge color={thread.type === "announcement" ? "yellow" : "blue"}>
                    {thread.type === "announcement" ? s.announcement : s.directMessage}
                  </Badge>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div>
          <SectionTitle>{s.messageAFamilyHeading}</SectionTitle>
          <form action={startDirectThread} className="card p-4 space-y-2">
            <select name="studentId" required className="w-full rounded-lg border border-brand-navy/15 px-3 py-2 text-sm">
              <option value="">{t.staffApp.reports.selectStudent}</option>
              {students.map((st) => <option key={st.id} value={st.id}>{st.first_name} {st.last_name}</option>)}
            </select>
            <input name="subject" placeholder={s.subjectPlaceholder} className="w-full rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
            <textarea name="body" placeholder={s.writeMessagePlaceholder} rows={3} className="w-full rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
            <button type="submit" className="btn-primary w-full py-2 text-sm">{s.startConversationButton}</button>
          </form>
        </div>

        <div>
          <SectionTitle>{s.classroomAnnouncementHeading}</SectionTitle>
          <form action={createAnnouncement} className="card p-4 space-y-2">
            <select name="classroomId" className="w-full rounded-lg border border-brand-navy/15 px-3 py-2 text-sm">
              <option value="">{s.wholeSchoolOption}</option>
              {classrooms.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input name="subject" placeholder={s.subjectPlaceholder} required className="w-full rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
            <textarea name="body" placeholder={s.writeAnnouncementPlaceholder} rows={3} className="w-full rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
            <button type="submit" className="btn-yellow w-full py-2 text-sm">{s.postAnnouncementButton}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
