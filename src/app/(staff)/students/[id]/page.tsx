import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import {
  getStudent, getClassrooms, getSchool, getGuardiansForStudent, getPickupPeople,
  getDocumentsForStudent, calcAge, getAttendanceHistory, getClassroom,
} from "@/lib/queries";
import { Avatar, Badge, SectionTitle } from "@/components/ui";
import {
  updateStudent, addGuardian, removeGuardian, addPickupPerson, removePickupPerson, addDocument,
} from "../actions";
import { getDict } from "@/lib/i18n";

const IMMUNIZATION_LABEL_KEY = {
  up_to_date: "immunizationUpToDate",
  due_soon: "immunizationDueSoon",
  overdue: "immunizationOverdue",
  exempt: "immunizationExempt",
} as const;

const STATUS_LABEL_KEY = {
  enrolled: "enrolled",
  waitlist: "waitlist",
  inactive: "inactiveStatus",
} as const;

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  const student = getStudent(id);
  if (!student) notFound();

  const school = getSchool();
  const classrooms = getClassrooms(school.id);
  const guardians = getGuardiansForStudent(id);
  const pickups = getPickupPeople(id);
  const documents = getDocumentsForStudent(id);
  const attendance = getAttendanceHistory(id, 10);
  const classroom = student.classroom_id ? getClassroom(student.classroom_id) : undefined;
  const isAdmin = session?.role === "admin";
  const { locale, t } = await getDict();
  const s = t.staffApp.students;
  const immunizationKey = student.immunization_status as keyof typeof IMMUNIZATION_LABEL_KEY;
  const statusKey = student.status as keyof typeof STATUS_LABEL_KEY;

  return (
    <div className="space-y-8">
      <div className="card p-6 flex flex-col sm:flex-row gap-4 sm:items-center">
        <Avatar name={`${student.first_name} ${student.last_name}`} url={student.photo_url} size={72} />
        <div className="flex-1">
          <h1 className="font-heading text-2xl font-bold text-brand-navy">
            {student.first_name} {student.last_name}
          </h1>
          <p className="text-sm text-brand-navy/70">
            {calcAge(student.dob, locale)} {s.ageOldSuffix} · {classroom?.name ?? t.staffApp.classrooms.unassigned} {student.dob && `· ${s.bornPrefix} ${student.dob}`}
          </p>
          <div className="flex gap-2 mt-2 flex-wrap">
            <Badge color={student.status === "enrolled" ? "green" : student.status === "waitlist" ? "yellow" : "gray"}>
              {s[STATUS_LABEL_KEY[statusKey]]}
            </Badge>
            {student.allergies && <Badge color="red">⚠ {student.allergies}</Badge>}
            <Badge color={student.immunization_status === "up_to_date" ? "green" : "yellow"}>
              {s.immunizationsLabel}: {s[IMMUNIZATION_LABEL_KEY[immunizationKey]]}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href={`/reports?student=${student.id}`} className="btn-secondary px-3 py-2 text-sm">{t.nav.dailyReports}</Link>
          <Link href={`/billing?student=${student.id}`} className="btn-secondary px-3 py-2 text-sm">{t.nav.billing}</Link>
        </div>
      </div>

      {isAdmin && (
        <div>
          <SectionTitle>{s.editProfile}</SectionTitle>
          <form action={updateStudent} className="card p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input type="hidden" name="studentId" value={student.id} />
            <div>
              <label className="block text-sm font-semibold text-brand-navy mb-1">{s.firstName}</label>
              <input name="firstName" defaultValue={student.first_name} className="w-full rounded-xl border border-brand-navy/15 px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-navy mb-1">{s.lastName}</label>
              <input name="lastName" defaultValue={student.last_name} className="w-full rounded-xl border border-brand-navy/15 px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-navy mb-1">{s.dateOfBirth}</label>
              <input name="dob" type="date" defaultValue={student.dob ?? ""} className="w-full rounded-xl border border-brand-navy/15 px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-navy mb-1">{s.classroom}</label>
              <select name="classroomId" defaultValue={student.classroom_id ?? ""} className="w-full rounded-xl border border-brand-navy/15 px-3 py-2">
                <option value="">{t.staffApp.classrooms.unassigned}</option>
                {classrooms.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-navy mb-1">{s.status}</label>
              <select name="status" defaultValue={student.status} className="w-full rounded-xl border border-brand-navy/15 px-3 py-2">
                <option value="enrolled">{s.enrolled}</option>
                <option value="waitlist">{s.waitlist}</option>
                <option value="inactive">{s.inactiveStatus}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-navy mb-1">{s.immunizationsLabel}</label>
              <select name="immunizationStatus" defaultValue={student.immunization_status} className="w-full rounded-xl border border-brand-navy/15 px-3 py-2">
                <option value="up_to_date">{s.immunizationUpToDate}</option>
                <option value="due_soon">{s.immunizationDueSoon}</option>
                <option value="overdue">{s.immunizationOverdue}</option>
                <option value="exempt">{s.immunizationExempt}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-navy mb-1">{s.allergies}</label>
              <input name="allergies" defaultValue={student.allergies ?? ""} className="w-full rounded-xl border border-brand-navy/15 px-3 py-2" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-brand-navy mb-1">{t.common.notes}</label>
              <textarea name="notes" defaultValue={student.notes ?? ""} rows={2} className="w-full rounded-xl border border-brand-navy/15 px-3 py-2" />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" className="btn-primary px-5 py-2">{t.common.saveChanges}</button>
            </div>
          </form>
        </div>
      )}

      <div>
        <SectionTitle>{s.guardians}</SectionTitle>
        <div className="card divide-y divide-brand-navy/5">
          {guardians.map((g) => (
            <div key={g.id} className="flex items-center gap-3 p-4">
              <Avatar name={g.name} url={g.photo_url} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-brand-navy text-sm">{g.name} {g.is_primary ? <Badge color="blue">{s.primaryBadge}</Badge> : null}</p>
                <p className="text-xs text-brand-navy/60">{g.relationship} · {g.email} {g.phone && `· ${g.phone}`}</p>
              </div>
              {isAdmin && (
                <form action={removeGuardian}>
                  <input type="hidden" name="studentId" value={student.id} />
                  <input type="hidden" name="guardianId" value={g.id} />
                  <button className="text-xs text-red-600 hover:underline">{s.remove}</button>
                </form>
              )}
            </div>
          ))}
          {guardians.length === 0 && <p className="p-4 text-sm text-brand-navy/60">{s.noGuardiansYet}</p>}
        </div>
        <form action={addGuardian} className="card p-4 mt-3 grid grid-cols-1 sm:grid-cols-4 gap-2">
          <input type="hidden" name="studentId" value={student.id} />
          <input name="name" placeholder={t.staffApp.staffPage.fullName} required className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
          <input name="email" type="email" placeholder={t.common.email} required className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
          <input name="phone" placeholder={t.common.phone} className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
          <select name="relationship" className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm">
            <option value="mother">{s.relationshipMother}</option>
            <option value="father">{s.relationshipFather}</option>
            <option value="guardian">{s.relationshipGuardianOption}</option>
          </select>
          <button type="submit" className="btn-secondary px-4 py-2 text-sm sm:col-span-4">{s.addGuardianButton}</button>
        </form>
      </div>

      <div>
        <SectionTitle>{s.pickupPeople}</SectionTitle>
        <p className="text-sm text-brand-navy/60 -mt-3 mb-3">
          {s.pickupSubtitle.replace("{name}", student.first_name)}
        </p>
        <div className="card divide-y divide-brand-navy/5">
          {pickups.map((p) => (
            <div key={p.id} className="flex items-center gap-3 p-4">
              <Avatar name={p.name} url={p.photo_url} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-brand-navy text-sm">{p.name}</p>
                <p className="text-xs text-brand-navy/60">{p.relationship} {p.phone && `· ${p.phone}`}</p>
              </div>
              <Badge color="yellow">{s.pin} {p.pin_code}</Badge>
              <form action={removePickupPerson}>
                <input type="hidden" name="studentId" value={student.id} />
                <input type="hidden" name="pickupId" value={p.id} />
                <button className="text-xs text-red-600 hover:underline">{s.remove}</button>
              </form>
            </div>
          ))}
          {pickups.length === 0 && <p className="p-4 text-sm text-brand-navy/60">{s.noPickupPeopleYet}</p>}
        </div>
        <form action={addPickupPerson} className="card p-4 mt-3 grid grid-cols-1 sm:grid-cols-4 gap-2">
          <input type="hidden" name="studentId" value={student.id} />
          <input name="name" placeholder={t.staffApp.staffPage.fullName} required className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
          <input name="relationship" placeholder={s.relationshipPlaceholder} required className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
          <input name="phone" placeholder={t.common.phone} className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
          <input name="pin" placeholder={s.pinOptionalPlaceholder} maxLength={4} className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
          <button type="submit" className="btn-secondary px-4 py-2 text-sm sm:col-span-4">{s.addPickupPersonButton}</button>
        </form>
      </div>

      <div>
        <SectionTitle>{s.documentsHeading}</SectionTitle>
        <div className="card divide-y divide-brand-navy/5">
          {documents.map((d) => (
            <div key={d.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-semibold text-brand-navy text-sm">{d.name}</p>
                <p className="text-xs text-brand-navy/60">{d.doc_type} {d.expires_at && `· ${s.expiresLabel} ${d.expires_at}`}</p>
              </div>
              <Badge color="blue">{s.onFile}</Badge>
            </div>
          ))}
          {documents.length === 0 && <p className="p-4 text-sm text-brand-navy/60">{s.noDocumentsYet}</p>}
        </div>
        {isAdmin && (
          <form action={addDocument} className="card p-4 mt-3 grid grid-cols-1 sm:grid-cols-4 gap-2">
            <input type="hidden" name="studentId" value={student.id} />
            <input name="name" placeholder={s.documentNamePlaceholder} required className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
            <select name="docType" className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm">
              <option value="immunization">{s.docTypeImmunization}</option>
              <option value="enrollment_form">{s.docTypeEnrollmentForm}</option>
              <option value="medical">{s.docTypeMedical}</option>
              <option value="other">{s.docTypeOther}</option>
            </select>
            <input name="expiresAt" type="date" className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
            <button type="submit" className="btn-secondary px-4 py-2 text-sm">{s.addDocumentButton}</button>
          </form>
        )}
      </div>

      <div>
        <SectionTitle>{s.recentAttendance}</SectionTitle>
        <div className="card divide-y divide-brand-navy/5">
          {attendance.map((a) => (
            <div key={a.id} className="flex items-center justify-between p-3 text-sm">
              <span className="text-brand-navy/70">{a.date}</span>
              <span className="text-brand-navy">
                {a.check_in_time ? `${t.staffApp.dashboard.checkInLabel} ${a.check_in_time.slice(11, 16)} (${a.check_in_by_name})` : s.absent}
                {a.check_out_time ? ` · ${t.staffApp.dashboard.checkOutLabel} ${a.check_out_time.slice(11, 16)} (${a.check_out_by_name})` : ""}
              </span>
            </div>
          ))}
          {attendance.length === 0 && <p className="p-4 text-sm text-brand-navy/60">{s.noAttendanceYet}</p>}
        </div>
      </div>
    </div>
  );
}
