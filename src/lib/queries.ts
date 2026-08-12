import { db } from "@/lib/db";
import type {
  School, Classroom, Staff, Student, Guardian, StudentGuardian, PickupPerson,
  Attendance, DailyReport, MessageThread, Message, Media, TuitionPlan, Invoice,
  Payment, DocumentRow,
} from "@/lib/types";

export function getSchool(): School {
  return db.prepare("SELECT * FROM schools LIMIT 1").get() as unknown as School;
}

export function getClassrooms(schoolId: string): Classroom[] {
  return db
    .prepare("SELECT * FROM classrooms WHERE school_id = ? ORDER BY name")
    .all(schoolId) as unknown as Classroom[];
}

export function getClassroom(id: string): Classroom | undefined {
  return db.prepare("SELECT * FROM classrooms WHERE id = ?").get(id) as unknown as Classroom | undefined;
}

export function getStaffBySchool(schoolId: string): Staff[] {
  return db
    .prepare("SELECT * FROM staff WHERE school_id = ? ORDER BY role, name")
    .all(schoolId) as unknown as Staff[];
}

export function getStaffByEmail(email: string): Staff | undefined {
  return db.prepare("SELECT * FROM staff WHERE email = ?").get(email) as unknown as Staff | undefined;
}

export function getStaffById(id: string): Staff | undefined {
  return db.prepare("SELECT * FROM staff WHERE id = ?").get(id) as unknown as Staff | undefined;
}

export function getGuardianByEmail(email: string): Guardian | undefined {
  return db.prepare("SELECT * FROM guardians WHERE email = ?").get(email) as unknown as Guardian | undefined;
}

export function getGuardianById(id: string): Guardian | undefined {
  return db.prepare("SELECT * FROM guardians WHERE id = ?").get(id) as unknown as Guardian | undefined;
}

export function getStudents(
  schoolId: string,
  opts: { status?: string; classroomId?: string } = {}
): Student[] {
  let sql = "SELECT * FROM students WHERE school_id = ?";
  const params: (string | number)[] = [schoolId];
  if (opts.status) {
    sql += " AND status = ?";
    params.push(opts.status);
  }
  if (opts.classroomId) {
    sql += " AND classroom_id = ?";
    params.push(opts.classroomId);
  }
  sql += " ORDER BY first_name";
  return db.prepare(sql).all(...params) as unknown as Student[];
}

export function getStudent(id: string): Student | undefined {
  return db.prepare("SELECT * FROM students WHERE id = ?").get(id) as unknown as Student | undefined;
}

export function getStudentsForGuardian(guardianId: string): Student[] {
  return db
    .prepare(
      `SELECT s.* FROM students s
       JOIN student_guardians sg ON sg.student_id = s.id
       WHERE sg.guardian_id = ? ORDER BY s.first_name`
    )
    .all(guardianId) as unknown as Student[];
}

export function getGuardiansForStudent(
  studentId: string
): (Guardian & { relationship: string; is_primary: number })[] {
  return db
    .prepare(
      `SELECT g.*, sg.relationship, sg.is_primary FROM guardians g
       JOIN student_guardians sg ON sg.guardian_id = g.id
       WHERE sg.student_id = ? ORDER BY sg.is_primary DESC, g.name`
    )
    .all(studentId) as unknown as (Guardian & { relationship: string; is_primary: number })[];
}

export function getStudentGuardianLinks(studentId: string): StudentGuardian[] {
  return db
    .prepare("SELECT * FROM student_guardians WHERE student_id = ?")
    .all(studentId) as unknown as StudentGuardian[];
}

export function isGuardianOfStudent(guardianId: string, studentId: string): boolean {
  const row = db
    .prepare(
      "SELECT 1 FROM student_guardians WHERE guardian_id = ? AND student_id = ?"
    )
    .get(guardianId, studentId);
  return !!row;
}

export function getPickupPeople(studentId: string): PickupPerson[] {
  return db
    .prepare(
      "SELECT * FROM pickup_people WHERE student_id = ? AND active = 1 ORDER BY name"
    )
    .all(studentId) as unknown as PickupPerson[];
}

export function getAttendanceForDate(schoolId: string, date: string) {
  return db
    .prepare(
      `SELECT a.*, s.first_name, s.last_name, s.classroom_id, s.photo_url
       FROM attendance a
       JOIN students s ON s.id = a.student_id
       WHERE s.school_id = ? AND a.date = ?`
    )
    .all(schoolId, date) as unknown as (Attendance & {
    first_name: string;
    last_name: string;
    classroom_id: string | null;
    photo_url: string | null;
  })[];
}

export function getAttendanceForStudentDate(studentId: string, date: string) {
  return db
    .prepare("SELECT * FROM attendance WHERE student_id = ? AND date = ?")
    .get(studentId, date) as unknown as Attendance | undefined;
}

export function getAttendanceHistory(studentId: string, limit = 20) {
  return db
    .prepare(
      "SELECT * FROM attendance WHERE student_id = ? ORDER BY date DESC LIMIT ?"
    )
    .all(studentId, limit) as unknown as Attendance[];
}

export function getDailyReport(studentId: string, date: string) {
  return db
    .prepare("SELECT * FROM daily_reports WHERE student_id = ? AND date = ?")
    .get(studentId, date) as unknown as DailyReport | undefined;
}

export function getDailyReportsHistory(studentId: string, limit = 20) {
  return db
    .prepare(
      "SELECT * FROM daily_reports WHERE student_id = ? ORDER BY date DESC LIMIT ?"
    )
    .all(studentId, limit) as unknown as DailyReport[];
}

export function getThreadsForSchool(schoolId: string) {
  return db
    .prepare(
      `SELECT * FROM message_threads WHERE school_id = ? ORDER BY last_message_at DESC`
    )
    .all(schoolId) as unknown as MessageThread[];
}

export function getThreadsForGuardian(guardianId: string) {
  return db
    .prepare(
      `SELECT DISTINCT t.* FROM message_threads t
       LEFT JOIN thread_participants tp ON tp.thread_id = t.id
       LEFT JOIN students s ON s.id = t.student_id
       LEFT JOIN student_guardians sg ON sg.student_id = s.id
       WHERE tp.guardian_id = ? OR sg.guardian_id = ?
       ORDER BY t.last_message_at DESC`
    )
    .all(guardianId, guardianId) as unknown as MessageThread[];
}

export function getThread(id: string): MessageThread | undefined {
  return db.prepare("SELECT * FROM message_threads WHERE id = ?").get(id) as unknown as MessageThread | undefined;
}

export function getMessages(threadId: string): Message[] {
  return db
    .prepare("SELECT * FROM messages WHERE thread_id = ? ORDER BY created_at ASC")
    .all(threadId) as unknown as Message[];
}

export function getMediaForSchool(schoolId: string, limit = 50) {
  return db
    .prepare(
      `SELECT * FROM media WHERE school_id = ? ORDER BY created_at DESC LIMIT ?`
    )
    .all(schoolId, limit) as unknown as Media[];
}

export function getMediaForStudent(studentId: string, limit = 50) {
  return db
    .prepare(
      `SELECT m.* FROM media m
       JOIN media_students ms ON ms.media_id = m.id
       WHERE ms.student_id = ? ORDER BY m.created_at DESC LIMIT ?`
    )
    .all(studentId, limit) as unknown as Media[];
}

export function getMediaStudentTags(mediaId: string) {
  return db
    .prepare(
      `SELECT s.id, s.first_name, s.last_name FROM media_students ms
       JOIN students s ON s.id = ms.student_id WHERE ms.media_id = ?`
    )
    .all(mediaId) as unknown as { id: string; first_name: string; last_name: string }[];
}

export function getMediaForGuardian(guardianId: string, limit = 50) {
  return db
    .prepare(
      `SELECT DISTINCT m.* FROM media m
       JOIN media_students ms ON ms.media_id = m.id
       JOIN student_guardians sg ON sg.student_id = ms.student_id
       WHERE sg.guardian_id = ? ORDER BY m.created_at DESC LIMIT ?`
    )
    .all(guardianId, limit) as unknown as Media[];
}

export function getTuitionPlans(schoolId: string): TuitionPlan[] {
  return db
    .prepare("SELECT * FROM tuition_plans WHERE school_id = ? ORDER BY amount DESC")
    .all(schoolId) as unknown as TuitionPlan[];
}

export function getInvoicesForStudent(studentId: string): Invoice[] {
  return db
    .prepare(
      "SELECT * FROM invoices WHERE student_id = ? ORDER BY due_date DESC"
    )
    .all(studentId) as unknown as Invoice[];
}

export function getInvoicesForSchool(schoolId: string) {
  return db
    .prepare(
      `SELECT i.*, s.first_name, s.last_name FROM invoices i
       JOIN students s ON s.id = i.student_id
       WHERE s.school_id = ? ORDER BY i.due_date DESC`
    )
    .all(schoolId) as unknown as (Invoice & { first_name: string; last_name: string })[];
}

export function getInvoice(id: string): Invoice | undefined {
  return db.prepare("SELECT * FROM invoices WHERE id = ?").get(id) as unknown as Invoice | undefined;
}

export function getPaymentsForInvoice(invoiceId: string): Payment[] {
  return db
    .prepare("SELECT * FROM payments WHERE invoice_id = ? ORDER BY paid_at DESC")
    .all(invoiceId) as unknown as Payment[];
}

export function getDocumentsForStudent(studentId: string): DocumentRow[] {
  return db
    .prepare("SELECT * FROM documents WHERE student_id = ? ORDER BY uploaded_at DESC")
    .all(studentId) as unknown as DocumentRow[];
}

export function fullName(p: { first_name: string; last_name: string }) {
  return `${p.first_name} ${p.last_name}`;
}

export function calcAge(dob: string | null): string {
  if (!dob) return "—";
  const birth = new Date(dob);
  const now = new Date();
  let months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) months -= 1;
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  if (years < 1) return `${months} mo`;
  return `${years}y ${remMonths}mo`;
}
