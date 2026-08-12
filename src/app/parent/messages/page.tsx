import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getThreadsForGuardian, getStudent, getClassroom } from "@/lib/queries";
import { SectionTitle, Badge, EmptyState } from "@/components/ui";

export default async function ParentMessagesPage() {
  const session = await getSession();
  if (!session) return null;
  const threads = getThreadsForGuardian(session.sub);

  return (
    <div>
      <SectionTitle>Messages</SectionTitle>
      {threads.length === 0 ? (
        <EmptyState icon="💬" title="No messages yet" />
      ) : (
        <div className="card divide-y divide-brand-navy/5">
          {threads.map((t) => {
            const student = t.student_id ? getStudent(t.student_id) : undefined;
            const classroom = t.classroom_id ? getClassroom(t.classroom_id) : undefined;
            return (
              <Link key={t.id} href={`/parent/messages/${t.id}`} className="flex items-center gap-3 p-4 hover:bg-brand-sky-light/40">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-brand-navy text-sm">{t.subject}</p>
                  <p className="text-xs text-brand-navy/60">{student ? `${student.first_name} ${student.last_name}` : classroom?.name}</p>
                </div>
                <Badge color={t.type === "announcement" ? "yellow" : "blue"}>{t.type === "announcement" ? "Announcement" : "Direct"}</Badge>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
