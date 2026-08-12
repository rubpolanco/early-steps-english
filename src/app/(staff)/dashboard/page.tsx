import Link from "next/link";
import { getSession } from "@/lib/auth";
import {
  getSchool, getClassrooms, getStudents, getAttendanceForDate, getInvoicesForSchool,
} from "@/lib/queries";
import { StatCard, SectionTitle, Badge, Avatar } from "@/components/ui";
import { getDict, translateAgeGroup } from "@/lib/i18n";

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
  const { locale, t } = await getDict();
  const s = t.staffApp.dashboard;

  const checkedIn = attendance.filter((a) => a.check_in_time && !a.check_out_time).length;
  const checkedOutToday = attendance.filter((a) => a.check_out_time).length;
  const notArrived = enrolled.length - attendance.length;
  const unpaidInvoices = invoices.filter((i) => i.status === "unpaid").length;

  const classroomById = Object.fromEntries(classrooms.map((c) => [c.id, c]));

  return (
    <div>
      <SectionTitle>
        {s.greeting}, {session?.name?.split(" ")[0]} 👋
      </SectionTitle>
      <p className="text-brand-navy/70 -mt-3 mb-6 text-sm">
        {new Date().toLocaleDateString(locale === "es" ? "es-ES" : "en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label={s.checkedInNow} value={checkedIn} color="green" icon="✅" hint={`${enrolled.length} ${s.enrolledSuffix}`} />
        <StatCard label={s.checkedOutToday} value={checkedOutToday} color="sky" icon="👋" />
        <StatCard label={s.notArrivedYet} value={Math.max(notArrived, 0)} color="yellow" icon="⏳" />
        <StatCard label={s.unpaidInvoicesLabel} value={unpaidInvoices} color="pink" icon="💳" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SectionTitle action={<Link href="/checkin" className="text-sm font-semibold text-brand-blue">{s.openKiosk} →</Link>}>
            {s.todaysAttendance}
          </SectionTitle>
          <div className="card divide-y divide-brand-navy/5">
            {attendance.length === 0 && (
              <p className="p-6 text-center text-brand-navy/60 text-sm">{s.noCheckins}</p>
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
                  {a.check_in_time && <p>{s.checkInLabel}: {a.check_in_time.slice(11, 16)}</p>}
                  {a.check_out_time && <p>{s.checkOutLabel}: {a.check_out_time.slice(11, 16)}</p>}
                </div>
                <Badge color={a.check_out_time ? "gray" : "green"} dot>
                  {a.check_out_time ? s.pickedUp : s.atSchool}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <SectionTitle>{t.nav.classrooms}</SectionTitle>
            <div className="card divide-y divide-brand-navy/5">
              {classrooms.map((c) => {
                const count = enrolled.filter((s) => s.classroom_id === c.id).length;
                return (
                  <div key={c.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-semibold text-brand-navy text-sm">{c.name}</p>
                      <p className="text-xs text-brand-navy/60">{translateAgeGroup(c.age_group, locale)}</p>
                    </div>
                    <Badge color="blue">{count}/{c.capacity}</Badge>
                  </div>
                );
              })}
            </div>
          </div>

          {waitlist.length > 0 && (
            <div>
              <SectionTitle action={<Link href="/enrollment" className="text-sm font-semibold text-brand-blue">{s.view} →</Link>}>
                {t.staffApp.enrollment.waitlistTitle}
              </SectionTitle>
              <div className="card p-4">
                <p className="text-sm text-brand-navy/70">{waitlist.length} {waitlist.length === 1 ? s.familyWaitingOne : s.familiesWaitingMany}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
