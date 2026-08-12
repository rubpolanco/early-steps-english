import Link from "next/link";
import { getSession } from "@/lib/auth";
import {
  getStudentsForGuardian, getClassroom, getAttendanceForStudentDate, getDailyReport, calcAge,
} from "@/lib/queries";
import { Avatar, Badge, SectionTitle, EmptyState } from "@/components/ui";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default async function ParentHomePage() {
  const session = await getSession();
  if (!session) return null;
  const children = getStudentsForGuardian(session.sub);
  const today = todayIso();

  return (
    <div>
      <SectionTitle>Hi {session.name.split(" ")[0]}! 👋</SectionTitle>
      <p className="text-sm text-brand-navy/70 -mt-3 mb-6">
        {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
      </p>

      {children.length === 0 ? (
        <EmptyState icon="🧒" title="No children linked to your account yet" subtitle="Please contact the school office." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {children.map((child) => {
            const classroom = child.classroom_id ? getClassroom(child.classroom_id) : undefined;
            const attendance = getAttendanceForStudentDate(child.id, today);
            const report = getDailyReport(child.id, today);
            const status = !attendance?.check_in_time ? "not_arrived" : attendance.check_out_time ? "picked_up" : "at_school";

            return (
              <div key={child.id} className="card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar name={`${child.first_name} ${child.last_name}`} url={child.photo_url} size={56} />
                  <div className="flex-1">
                    <p className="font-heading font-bold text-brand-navy">{child.first_name} {child.last_name}</p>
                    <p className="text-xs text-brand-navy/60">{calcAge(child.dob)} · {classroom?.name ?? "Unassigned"}</p>
                  </div>
                  <Badge color={status === "at_school" ? "green" : status === "picked_up" ? "gray" : "yellow"}>
                    {status === "at_school" ? "At school" : status === "picked_up" ? "Picked up" : "Not arrived"}
                  </Badge>
                </div>
                {attendance?.check_in_time && (
                  <p className="text-xs text-brand-navy/70 mb-1">
                    Checked in at {attendance.check_in_time.slice(11, 16)} by {attendance.check_in_by_name}
                  </p>
                )}
                {attendance?.check_out_time && (
                  <p className="text-xs text-brand-navy/70 mb-3">
                    Picked up at {attendance.check_out_time.slice(11, 16)} by {attendance.check_out_by_name}
                  </p>
                )}
                {report ? (
                  <p className="text-xs bg-brand-sky-light rounded-lg p-2 text-brand-navy/80 mb-3">
                    Mood today: <strong>{report.mood}</strong>
                  </p>
                ) : (
                  <p className="text-xs text-brand-navy/50 mb-3">No daily report yet today.</p>
                )}
                <div className="flex gap-2 flex-wrap text-xs">
                  <Link href="/parent/reports" className="btn-secondary px-3 py-1.5">Daily report</Link>
                  <Link href="/parent/photos" className="btn-secondary px-3 py-1.5">Photos</Link>
                  <Link href="/parent/pickup-people" className="btn-secondary px-3 py-1.5">Pickup people</Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
