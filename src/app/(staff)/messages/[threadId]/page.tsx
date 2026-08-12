import { notFound } from "next/navigation";
import { getThread, getMessages, getStudent, getClassroom } from "@/lib/queries";
import { getSession } from "@/lib/auth";
import { SectionTitle } from "@/components/ui";
import { sendReply } from "../actions";
import { getDict } from "@/lib/i18n";

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  const thread = getThread(threadId);
  if (!thread) notFound();
  const messages = getMessages(threadId);
  const session = await getSession();
  const student = thread.student_id ? getStudent(thread.student_id) : undefined;
  const classroom = thread.classroom_id ? getClassroom(thread.classroom_id) : undefined;
  const { t } = await getDict();
  const s = t.staffApp.messages;

  return (
    <div className="max-w-2xl">
      <SectionTitle>{thread.subject}</SectionTitle>
      <p className="text-sm text-brand-navy/60 -mt-3 mb-6">
        {student ? `${s.aboutPrefix} ${student.first_name} ${student.last_name}` : classroom ? `${s.announcementToPrefix} ${classroom.name}` : s.wholeSchoolAnnouncement}
      </p>

      <div className="card p-4 space-y-4 mb-4 max-h-[50vh] overflow-y-auto">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender_type === "staff" && m.sender_id === session?.sub ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${m.sender_type === "staff" ? "bg-brand-blue text-white" : "bg-brand-sky-light text-brand-navy"}`}>
              <p className="font-semibold text-xs opacity-80 mb-0.5">{m.sender_name}</p>
              <p>{m.body}</p>
              <p className="text-[10px] opacity-60 mt-1">{new Date(m.created_at).toLocaleString()}</p>
            </div>
          </div>
        ))}
        {messages.length === 0 && <p className="text-sm text-brand-navy/60">{s.noMessagesYet}</p>}
      </div>

      <form action={sendReply} className="flex gap-2">
        <input type="hidden" name="threadId" value={thread.id} />
        <input name="body" placeholder={s.typeMessage} className="flex-1 rounded-xl border border-brand-navy/15 px-4 py-2.5" />
        <button type="submit" className="btn-primary px-5 py-2.5">{t.common.send}</button>
      </form>
    </div>
  );
}
