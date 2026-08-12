import { getSession } from "@/lib/auth";
import {
  getSchool, getClassrooms, getStudents, getAttendanceForStudentDate,
  getGuardiansForStudent, getPickupPeople, calcAge,
} from "@/lib/queries";
import { Avatar, Badge, SectionTitle } from "@/components/ui";
import { checkIn, checkOut } from "./actions";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default async function CheckinPage() {
  const session = await getSession();
  const school = getSchool();
  const classrooms = getClassrooms(school.id);
  const students = getStudents(school.id, { status: "enrolled" });
  const today = todayIso();

  const visibleClassrooms =
    session?.role === "teacher" && session.classroomId
      ? classrooms.filter((c) => c.id === session.classroomId)
      : classrooms;

  return (
    <div>
      <SectionTitle>Check-In / Check-Out Kiosk</SectionTitle>
      <p className="text-sm text-brand-navy/70 -mt-3 mb-6">
        {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} · Select who is dropping off or picking up each child.
      </p>

      <div className="space-y-8">
        {visibleClassrooms.map((classroom) => {
          const roster = students.filter((s) => s.classroom_id === classroom.id);
          if (roster.length === 0) return null;
          return (
            <div key={classroom.id}>
              <h3 className="font-heading font-bold text-brand-navy mb-3">
                {classroom.name} <span className="text-sm font-normal text-brand-navy/60">({classroom.age_group})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {roster.map((student) => {
                  const attendance = getAttendanceForStudentDate(student.id, today);
                  const guardians = getGuardiansForStudent(student.id);
                  const pickups = getPickupPeople(student.id);
                  const options = [
                    ...guardians.map((g) => ({ value: `guardian:${g.id}`, label: `${g.name} (${g.relationship})` })),
                    ...pickups.map((p) => ({ value: `pickup_person:${p.id}`, label: `${p.name} (${p.relationship})` })),
                  ];

                  const status = !attendance?.check_in_time
                    ? "not_arrived"
                    : attendance.check_out_time
                    ? "picked_up"
                    : "at_school";

                  return (
                    <div key={student.id} className="card p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar name={`${student.first_name} ${student.last_name}`} url={student.photo_url} />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-brand-navy text-sm truncate">
                            {student.first_name} {student.last_name}
                          </p>
                          <p className="text-xs text-brand-navy/60">{calcAge(student.dob)}</p>
                        </div>
                        <Badge color={status === "at_school" ? "green" : status === "picked_up" ? "gray" : "yellow"}>
                          {status === "at_school" ? "At school" : status === "picked_up" ? "Picked up" : "Not arrived"}
                        </Badge>
                      </div>

                      {status !== "picked_up" && (
                        <form action={status === "not_arrived" ? checkIn : checkOut} className="flex gap-2">
                          <input type="hidden" name="studentId" value={student.id} />
                          <select
                            name="who"
                            required
                            className="flex-1 min-w-0 rounded-lg border border-brand-navy/15 px-2 py-1.5 text-xs"
                          >
                            {options.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                          <button
                            type="submit"
                            className={status === "not_arrived" ? "btn-primary px-3 py-1.5 text-xs" : "btn-yellow px-3 py-1.5 text-xs"}
                          >
                            {status === "not_arrived" ? "Check In" : "Check Out"}
                          </button>
                        </form>
                      )}
                      {status === "picked_up" && attendance && (
                        <p className="text-xs text-brand-navy/60">
                          Picked up at {attendance.check_out_time?.slice(11, 16)} by {attendance.check_out_by_name}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
