import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getThreadsForGuardian, getStudent, getClassroom } from "@/lib/queries";
import { SectionTitle, Badge, EmptyState } from "@/components/ui";
import { getDict } from "@/lib/i18n";

export default async function ParentMessagesPage() {
  const session = await getSession();
  if (!session) return null;
  const threads = getThreadsForGuardian(session.sub);
  const { t } = await getDict();
  const s = t.parentApp.messages;

  return (
    <div>
      <SectionTitle>{s.title}</SectionTitle>
      {threads.length === 0 ? (
        <EmptyState icon="💬" title={s.noThreads} />
      ) : (
        <div className="card divide-y divide-brand-navy/5">
          {threads.map((thread) => {
            const student = thread.student_id ? getStudent(thread.student_id) : undefined;
            const classroom = thread.classroom_id ? getClassroom(thread.classroom_id) : undefined;
            return (
              <Link key={thread.id} href={`/parent/messages/${thread.id}`} className="flex items-center gap-3 p-4 hover:bg-brand-sky-light/40">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-brand-navy text-sm">{thread.subject}</p>
                  <p className="text-xs text-brand-navy/60">{student ? `${student.first_name} ${student.last_name}` : classroom?.name}</p>
                </div>
                <Badge color={thread.type === "announcement" ? "yellow" : "blue"}>{thread.type === "announcement" ? s.announcement : s.direct}</Badge>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
