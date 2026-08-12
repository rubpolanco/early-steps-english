export interface School {
  id: string;
  name: string;
  tagline: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
}

export interface Classroom {
  id: string;
  school_id: string;
  name: string;
  age_group: string | null;
  capacity: number;
  color: string;
}

export type StaffRole = "admin" | "teacher" | "front_desk";

export interface Staff {
  id: string;
  school_id: string;
  name: string;
  email: string;
  password_hash: string;
  role: StaffRole;
  classroom_id: string | null;
  phone: string | null;
  photo_url: string | null;
  active: number;
}

export type StudentStatus = "enrolled" | "waitlist" | "inactive";

export interface Student {
  id: string;
  school_id: string;
  classroom_id: string | null;
  first_name: string;
  last_name: string;
  dob: string | null;
  gender: string | null;
  photo_url: string | null;
  status: StudentStatus;
  enrollment_date: string | null;
  desired_start_date: string | null;
  allergies: string | null;
  notes: string | null;
  immunization_status: "up_to_date" | "due_soon" | "overdue" | "exempt";
  immunization_expiry: string | null;
}

export interface Guardian {
  id: string;
  school_id: string;
  name: string;
  email: string;
  password_hash: string;
  phone: string | null;
  photo_url: string | null;
}

export interface StudentGuardian {
  student_id: string;
  guardian_id: string;
  relationship: string;
  is_primary: number;
}

export interface PickupPerson {
  id: string;
  student_id: string;
  name: string;
  relationship: string;
  phone: string | null;
  photo_url: string | null;
  pin_code: string;
  notes: string | null;
  added_by_guardian_id: string | null;
  active: number;
}

export interface Attendance {
  id: string;
  student_id: string;
  date: string;
  check_in_time: string | null;
  check_in_by_type: "guardian" | "pickup_person" | "staff" | null;
  check_in_by_name: string | null;
  checked_in_staff_id: string | null;
  check_out_time: string | null;
  check_out_by_type: "guardian" | "pickup_person" | "staff" | null;
  check_out_by_name: string | null;
  checked_out_staff_id: string | null;
  notes: string | null;
}

export interface DailyReport {
  id: string;
  student_id: string;
  date: string;
  mood: string | null;
  meals: string | null;
  naps: string | null;
  potty: string | null;
  activities: string | null;
  learning_notes: string | null;
  created_by_staff_id: string | null;
  updated_at: string;
}

export interface MessageThread {
  id: string;
  school_id: string;
  subject: string;
  type: "direct" | "announcement";
  student_id: string | null;
  classroom_id: string | null;
  created_at: string;
  last_message_at: string;
}

export interface Message {
  id: string;
  thread_id: string;
  sender_type: "staff" | "guardian";
  sender_id: string;
  sender_name: string;
  body: string;
  created_at: string;
}

export interface Media {
  id: string;
  school_id: string;
  classroom_id: string | null;
  type: "photo" | "video";
  file_url: string;
  caption: string | null;
  uploaded_by_staff_id: string | null;
  created_at: string;
}

export interface TuitionPlan {
  id: string;
  school_id: string;
  name: string;
  amount: number;
  frequency: "weekly" | "monthly";
}

export type InvoiceStatus = "unpaid" | "paid" | "overdue" | "partial";

export interface Invoice {
  id: string;
  student_id: string;
  tuition_plan_id: string | null;
  period_label: string;
  amount: number;
  due_date: string;
  status: InvoiceStatus;
  created_at: string;
}

export interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  method: string;
  paid_at: string;
  recorded_by_staff_id: string | null;
  notes: string | null;
}

export interface DocumentRow {
  id: string;
  student_id: string;
  name: string;
  doc_type: string;
  file_url: string | null;
  expires_at: string | null;
  uploaded_at: string;
}
