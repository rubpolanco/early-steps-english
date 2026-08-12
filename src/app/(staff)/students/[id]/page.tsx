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

  return (
    <div className="space-y-8">
      <div className="card p-6 flex flex-col sm:flex-row gap-4 sm:items-center">
        <Avatar name={`${student.first_name} ${student.last_name}`} url={student.photo_url} size={72} />
        <div className="flex-1">
          <h1 className="font-heading text-2xl font-bold text-brand-navy">
            {student.first_name} {student.last_name}
          </h1>
          <p className="text-sm text-brand-navy/70">
            {calcAge(student.dob)} old · {classroom?.name ?? "Unassigned"} {student.dob && `· Born ${student.dob}`}
          </p>
          <div className="flex gap-2 mt-2 flex-wrap">
            <Badge color={student.status === "enrolled" ? "green" : student.status === "waitlist" ? "yellow" : "gray"}>
              {student.status}
            </Badge>
            {student.allergies && <Badge color="red">⚠ {student.allergies}</Badge>}
            <Badge color={student.immunization_status === "up_to_date" ? "green" : "yellow"}>
              Immunizations: {student.immunization_status.replace("_", " ")}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href={`/reports?student=${student.id}`} className="btn-secondary px-3 py-2 text-sm">Daily reports</Link>
          <Link href={`/billing?student=${student.id}`} className="btn-secondary px-3 py-2 text-sm">Billing</Link>
        </div>
      </div>

      {isAdmin && (
        <div>
          <SectionTitle>Edit profile</SectionTitle>
          <form action={updateStudent} className="card p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input type="hidden" name="studentId" value={student.id} />
            <div>
              <label className="block text-sm font-semibold text-brand-navy mb-1">First name</label>
              <input name="firstName" defaultValue={student.first_name} className="w-full rounded-xl border border-brand-navy/15 px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-navy mb-1">Last name</label>
              <input name="lastName" defaultValue={student.last_name} className="w-full rounded-xl border border-brand-navy/15 px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-navy mb-1">Date of birth</label>
              <input name="dob" type="date" defaultValue={student.dob ?? ""} className="w-full rounded-xl border border-brand-navy/15 px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-navy mb-1">Classroom</label>
              <select name="classroomId" defaultValue={student.classroom_id ?? ""} className="w-full rounded-xl border border-brand-navy/15 px-3 py-2">
                <option value="">Unassigned</option>
                {classrooms.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-navy mb-1">Status</label>
              <select name="status" defaultValue={student.status} className="w-full rounded-xl border border-brand-navy/15 px-3 py-2">
                <option value="enrolled">Enrolled</option>
                <option value="waitlist">Waitlist</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-navy mb-1">Immunization status</label>
              <select name="immunizationStatus" defaultValue={student.immunization_status} className="w-full rounded-xl border border-brand-navy/15 px-3 py-2">
                <option value="up_to_date">Up to date</option>
                <option value="due_soon">Due soon</option>
                <option value="overdue">Overdue</option>
                <option value="exempt">Exempt</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-navy mb-1">Allergies</label>
              <input name="allergies" defaultValue={student.allergies ?? ""} className="w-full rounded-xl border border-brand-navy/15 px-3 py-2" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-brand-navy mb-1">Notes</label>
              <textarea name="notes" defaultValue={student.notes ?? ""} rows={2} className="w-full rounded-xl border border-brand-navy/15 px-3 py-2" />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" className="btn-primary px-5 py-2">Save changes</button>
            </div>
          </form>
        </div>
      )}

      <div>
        <SectionTitle>Parents / Guardians</SectionTitle>
        <div className="card divide-y divide-brand-navy/5">
          {guardians.map((g) => (
            <div key={g.id} className="flex items-center gap-3 p-4">
              <Avatar name={g.name} url={g.photo_url} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-brand-navy text-sm">{g.name} {g.is_primary ? <Badge color="blue">Primary</Badge> : null}</p>
                <p className="text-xs text-brand-navy/60">{g.relationship} · {g.email} {g.phone && `· ${g.phone}`}</p>
              </div>
              {isAdmin && (
                <form action={removeGuardian}>
                  <input type="hidden" name="studentId" value={student.id} />
                  <input type="hidden" name="guardianId" value={g.id} />
                  <button className="text-xs text-red-600 hover:underline">Remove</button>
                </form>
              )}
            </div>
          ))}
          {guardians.length === 0 && <p className="p-4 text-sm text-brand-navy/60">No guardians linked yet.</p>}
        </div>
        <form action={addGuardian} className="card p-4 mt-3 grid grid-cols-1 sm:grid-cols-4 gap-2">
          <input type="hidden" name="studentId" value={student.id} />
          <input name="name" placeholder="Full name" required className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
          <input name="email" type="email" placeholder="Email" required className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
          <input name="phone" placeholder="Phone" className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
          <select name="relationship" className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm">
            <option value="mother">Mother</option>
            <option value="father">Father</option>
            <option value="guardian">Guardian</option>
          </select>
          <button type="submit" className="btn-secondary px-4 py-2 text-sm sm:col-span-4">+ Add parent / guardian</button>
        </form>
      </div>

      <div>
        <SectionTitle>Authorized pickup people</SectionTitle>
        <p className="text-sm text-brand-navy/60 -mt-3 mb-3">
          Anyone besides the parents/guardians who is allowed to pick up {student.first_name} — grandparents, an uncle or aunt, a nanny/service maid, etc.
        </p>
        <div className="card divide-y divide-brand-navy/5">
          {pickups.map((p) => (
            <div key={p.id} className="flex items-center gap-3 p-4">
              <Avatar name={p.name} url={p.photo_url} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-brand-navy text-sm">{p.name}</p>
                <p className="text-xs text-brand-navy/60">{p.relationship} {p.phone && `· ${p.phone}`}</p>
              </div>
              <Badge color="yellow">PIN {p.pin_code}</Badge>
              <form action={removePickupPerson}>
                <input type="hidden" name="studentId" value={student.id} />
                <input type="hidden" name="pickupId" value={p.id} />
                <button className="text-xs text-red-600 hover:underline">Remove</button>
              </form>
            </div>
          ))}
          {pickups.length === 0 && <p className="p-4 text-sm text-brand-navy/60">No additional pickup people yet.</p>}
        </div>
        <form action={addPickupPerson} className="card p-4 mt-3 grid grid-cols-1 sm:grid-cols-4 gap-2">
          <input type="hidden" name="studentId" value={student.id} />
          <input name="name" placeholder="Full name" required className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
          <input name="relationship" placeholder="Relationship (e.g. Grandmother, Nanny)" required className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
          <input name="phone" placeholder="Phone" className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
          <input name="pin" placeholder="4-digit PIN (optional)" maxLength={4} className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
          <button type="submit" className="btn-secondary px-4 py-2 text-sm sm:col-span-4">+ Add authorized pickup person</button>
        </form>
      </div>

      <div>
        <SectionTitle>Documents</SectionTitle>
        <div className="card divide-y divide-brand-navy/5">
          {documents.map((d) => (
            <div key={d.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-semibold text-brand-navy text-sm">{d.name}</p>
                <p className="text-xs text-brand-navy/60">{d.doc_type} {d.expires_at && `· expires ${d.expires_at}`}</p>
              </div>
              <Badge color="blue">On file</Badge>
            </div>
          ))}
          {documents.length === 0 && <p className="p-4 text-sm text-brand-navy/60">No documents on file.</p>}
        </div>
        {isAdmin && (
          <form action={addDocument} className="card p-4 mt-3 grid grid-cols-1 sm:grid-cols-4 gap-2">
            <input type="hidden" name="studentId" value={student.id} />
            <input name="name" placeholder="Document name" required className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
            <select name="docType" className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm">
              <option value="immunization">Immunization</option>
              <option value="enrollment_form">Enrollment form</option>
              <option value="medical">Medical</option>
              <option value="other">Other</option>
            </select>
            <input name="expiresAt" type="date" className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm" />
            <button type="submit" className="btn-secondary px-4 py-2 text-sm">+ Add document</button>
          </form>
        )}
      </div>

      <div>
        <SectionTitle>Recent attendance</SectionTitle>
        <div className="card divide-y divide-brand-navy/5">
          {attendance.map((a) => (
            <div key={a.id} className="flex items-center justify-between p-3 text-sm">
              <span className="text-brand-navy/70">{a.date}</span>
              <span className="text-brand-navy">
                {a.check_in_time ? `In ${a.check_in_time.slice(11, 16)} (${a.check_in_by_name})` : "Absent"}
                {a.check_out_time ? ` · Out ${a.check_out_time.slice(11, 16)} (${a.check_out_by_name})` : ""}
              </span>
            </div>
          ))}
          {attendance.length === 0 && <p className="p-4 text-sm text-brand-navy/60">No attendance recorded yet.</p>}
        </div>
      </div>
    </div>
  );
}
