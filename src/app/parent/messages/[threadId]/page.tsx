import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getThread, getMessages, getThreadsForGuardian } from "@/lib/queries";
import { SectionTitle } from "@/components/ui";
import { sendParentReply } from "../actions";
import { getDict } from "@/lib/i18n";

export default async function ParentThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { threadId } = await params;
  const allowed = getThreadsForGuardian(session.sub).some((t) => t.id === threadId);
  if (!allowed) notFound();

  const thread = getThread(threadId);
  if (!thread) notFound();
  const messages = getMessages(threadId);
  const canReply = thread.type === "direct";
  const { locale, t } = await getDict();
  const s = t.parentApp.messages;

  return (
    <div className="max-w-2xl">
      <SectionTitle>{thread.subject}</SectionTitle>
      <div className="card p-4 space-y-4 mb-4 max-h-[55vh] overflow-y-auto">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender_type === "guardian" && m.sender_id === session.sub ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${m.sender_type === "guardian" ? "bg-brand-blue text-white" : "bg-brand-sky-light text-brand-navy"}`}>
              <p className="font-semibold text-xs opacity-80 mb-0.5">{m.sender_name}</p>
              <p>{m.body}</p>
              <p className="text-[10px] opacity-60 mt-1">{new Date(m.created_at).toLocaleString(locale === "es" ? "es-ES" : "en-US")}</p>
            </div>
          </div>
        ))}
        {messages.length === 0 && <p className="text-sm text-brand-navy/60">{s.noMessages}</p>}
      </div>

      {canReply ? (
        <form action={sendParentReply} className="flex gap-2">
          <input type="hidden" name="threadId" value={thread.id} />
          <input name="body" placeholder={s.typeMessage} className="flex-1 rounded-xl border border-brand-navy/15 px-4 py-2.5" />
          <button type="submit" className="btn-primary px-5 py-2.5">{t.common.send}</button>
        </form>
      ) : (
        <p className="text-xs text-brand-navy/50">{s.announcementNotice}</p>
      )}
    </div>
  );
}
