import Link from "next/link";
import { getSession } from "@/lib/auth";
import {
  getSchool, getClassrooms, getStudents, getAttendanceForDate, getInvoicesForSchool,
} from "@/lib/queries";
import { StatCard, SectionTitle, Badge, Avatar } from "@/components/ui";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default async function DashboardPage() {
  const session = await getSession();
  const school = getSchool();
  const classrooms = getClassrooms(school.id);
  const enrolled = getStudents(school.id, { status: "enrolled" });
  const waitlist = getStudents(school.id, { status: "waitlist" });
  const today = todayIso();
  const attendance = getAttendanceForDate(school.id, today);
  const invoices = getInvoicesForSchool(school.id);

  const checkedIn = attendance.filter((a) => a.check_in_time && !a.check_out_time).length;
  const checkedOutToday = attendance.filter((a) => a.check_out_time).length;
  const notArrived = enrolled.length - attendance.length;
  const unpaidInvoices = invoices.filter((i) => i.status === "unpaid").length;

  const classroomById = Object.fromEntries(classrooms.map((c) => [c.id, c]));

  return (
    <div>
      <SectionTitle>
        Good day, {session?.name?.split(" ")[0]} 👋
      </SectionTitle>
      <p className="text-brand-navy/70 -mt-3 mb-6 text-sm">
        {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Checked in now" value={checkedIn} color="green" hint={`${enrolled.length} enrolled`} />
        <StatCard label="Checked out today" value={checkedOutToday} color="sky" />
        <StatCard label="Not arrived yet" value={Math.max(notArrived, 0)} color="yellow" />
        <StatCard label="Unpaid invoices" value={unpaidInvoices} color="pink" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SectionTitle action={<Link href="/checkin" className="text-sm font-semibold text-brand-blue">Open kiosk →</Link>}>
            Today&apos;s attendance
          </SectionTitle>
          <div className="card divide-y divide-brand-navy/5">
            {attendance.length === 0 && (
              <p className="p-6 text-center text-brand-navy/60 text-sm">No check-ins recorded yet today.</p>
            )}
            {attendance.map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-4">
                <Avatar name={`${a.first_name} ${a.last_name}`} url={a.photo_url} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-brand-navy text-sm">{a.first_name} {a.last_name}</p>
                  <p className="text-xs text-brand-navy/60">
                    {a.classroom_id ? classroomById[a.classroom_id]?.name : "—"}
                  </p>
                </div>
                <div className="text-right text-xs text-brand-navy/70">
                  {a.check_in_time && <p>In: {a.check_in_time.slice(11, 16)}</p>}
                  {a.check_out_time && <p>Out: {a.check_out_time.slice(11, 16)}</p>}
                </div>
                <Badge color={a.check_out_time ? "gray" : "green"}>
                  {a.check_out_time ? "Picked up" : "At school"}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <SectionTitle>Classrooms</SectionTitle>
            <div className="card divide-y divide-brand-navy/5">
              {classrooms.map((c) => {
                const count = enrolled.filter((s) => s.classroom_id === c.id).length;
                return (
                  <div key={c.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-semibold text-brand-navy text-sm">{c.name}</p>
                      <p className="text-xs text-brand-navy/60">{c.age_group}</p>
                    </div>
                    <Badge color="blue">{count}/{c.capacity}</Badge>
                  </div>
                );
              })}
            </div>
          </div>

          {waitlist.length > 0 && (
            <div>
              <SectionTitle action={<Link href="/enrollment" className="text-sm font-semibold text-brand-blue">View →</Link>}>
                Waitlist
              </SectionTitle>
              <div className="card p-4">
                <p className="text-sm text-brand-navy/70">{waitlist.length} {waitlist.length === 1 ? "family is" : "families are"} waiting for enrollment.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
