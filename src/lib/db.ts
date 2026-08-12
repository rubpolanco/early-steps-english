import { DatabaseSync } from "node:sqlite";
import { DB_PATH } from "@/lib/storage";

declare global {
  // eslint-disable-next-line no-var
  var __esDb: DatabaseSync | undefined;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS schools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tagline TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS classrooms (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age_group TEXT,
  capacity INTEGER NOT NULL DEFAULT 12,
  color TEXT NOT NULL DEFAULT 'sky',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS staff (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','teacher','front_desk')),
  classroom_id TEXT REFERENCES classrooms(id) ON DELETE SET NULL,
  phone TEXT,
  photo_url TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  classroom_id TEXT REFERENCES classrooms(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  dob TEXT,
  gender TEXT,
  photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled','waitlist','inactive')),
  enrollment_date TEXT,
  desired_start_date TEXT,
  allergies TEXT,
  notes TEXT,
  immunization_status TEXT DEFAULT 'up_to_date' CHECK (immunization_status IN ('up_to_date','due_soon','overdue','exempt')),
  immunization_expiry TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS guardians (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  phone TEXT,
  photo_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS student_guardians (
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  guardian_id TEXT NOT NULL REFERENCES guardians(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL DEFAULT 'parent',
  is_primary INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (student_id, guardian_id)
);

CREATE TABLE IF NOT EXISTS pickup_people (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  phone TEXT,
  photo_url TEXT,
  pin_code TEXT NOT NULL,
  notes TEXT,
  added_by_guardian_id TEXT REFERENCES guardians(id) ON DELETE SET NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  check_in_time TEXT,
  check_in_by_type TEXT CHECK (check_in_by_type IN ('guardian','pickup_person','staff')),
  check_in_by_name TEXT,
  checked_in_staff_id TEXT REFERENCES staff(id) ON DELETE SET NULL,
  check_out_time TEXT,
  check_out_by_type TEXT CHECK (check_out_by_type IN ('guardian','pickup_person','staff')),
  check_out_by_name TEXT,
  checked_out_staff_id TEXT REFERENCES staff(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(student_id, date)
);

CREATE TABLE IF NOT EXISTS daily_reports (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  mood TEXT,
  meals TEXT,
  naps TEXT,
  potty TEXT,
  activities TEXT,
  learning_notes TEXT,
  created_by_staff_id TEXT REFERENCES staff(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(student_id, date)
);

CREATE TABLE IF NOT EXISTS message_threads (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'direct' CHECK (type IN ('direct','announcement')),
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  classroom_id TEXT REFERENCES classrooms(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_message_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS thread_participants (
  thread_id TEXT NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
  guardian_id TEXT NOT NULL REFERENCES guardians(id) ON DELETE CASCADE,
  PRIMARY KEY (thread_id, guardian_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('staff','guardian')),
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  classroom_id TEXT REFERENCES classrooms(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'photo' CHECK (type IN ('photo','video')),
  file_url TEXT NOT NULL,
  caption TEXT,
  uploaded_by_staff_id TEXT REFERENCES staff(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS media_students (
  media_id TEXT NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  PRIMARY KEY (media_id, student_id)
);

CREATE TABLE IF NOT EXISTS tuition_plans (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount REAL NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('weekly','monthly')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  tuition_plan_id TEXT REFERENCES tuition_plans(id) ON DELETE SET NULL,
  period_label TEXT NOT NULL,
  amount REAL NOT NULL,
  due_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid','paid','overdue','partial')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount REAL NOT NULL,
  method TEXT NOT NULL DEFAULT 'cash',
  paid_at TEXT NOT NULL DEFAULT (datetime('now')),
  recorded_by_staff_id TEXT REFERENCES staff(id) ON DELETE SET NULL,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  doc_type TEXT NOT NULL DEFAULT 'other',
  file_url TEXT,
  expires_at TEXT,
  uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

// The `invoices` table predates ITEBIS (Dominican VAT) support, and the
// live production database already has real invoices in it — `CREATE TABLE
// IF NOT EXISTS` won't retroactively add columns to a table that already
// exists. This runs an idempotent, additive migration on every connection:
// safe to run against a fresh dev database (columns already exist via
// SCHEMA... no, SCHEMA doesn't include them, so this always adds them the
// first time) and safe to re-run against a database that already has them
// (each ALTER is guarded by a table_info check).
function ensureInvoiceTaxColumns(conn: DatabaseSync) {
  const cols = conn.prepare("PRAGMA table_info(invoices)").all() as unknown as { name: string }[];
  const names = new Set(cols.map((c) => c.name));
  if (!names.has("subtotal")) {
    conn.exec("ALTER TABLE invoices ADD COLUMN subtotal REAL");
  }
  if (!names.has("tax_rate")) {
    conn.exec("ALTER TABLE invoices ADD COLUMN tax_rate REAL NOT NULL DEFAULT 0");
  }
  if (!names.has("tax_amount")) {
    conn.exec("ALTER TABLE invoices ADD COLUMN tax_amount REAL NOT NULL DEFAULT 0");
  }
  // Backfill any invoices created before this migration (or before tax
  // tracking existed) so every row has a consistent subtotal/tax split —
  // treated as tax-free at the old `amount`, since that's what was charged.
  conn.exec("UPDATE invoices SET subtotal = amount WHERE subtotal IS NULL");
}

function createConnection() {
  const conn = new DatabaseSync(DB_PATH);
  // Give concurrent writers room to queue instead of failing instantly
  // with SQLITE_BUSY ("database is locked") if two connections happen to
  // touch the file at the same moment.
  conn.exec("PRAGMA busy_timeout = 10000");
  conn.exec("PRAGMA journal_mode = WAL");
  conn.exec("PRAGMA foreign_keys = ON");
  conn.exec(SCHEMA);
  ensureInvoiceTaxColumns(conn);
  return conn;
}

let instance: DatabaseSync | undefined = global.__esDb;

function getDb(): DatabaseSync {
  if (!instance) {
    instance = createConnection();
    if (process.env.NODE_ENV !== "production") global.__esDb = instance;
  }
  return instance;
}

// `db` looks like a normal DatabaseSync, but the real connection isn't
// opened (and the schema isn't run) until something actually calls a
// method on it — e.g. `db.prepare(...)` from inside a query function at
// real request time.
//
// This laziness matters specifically for `next build`. Next's "Collecting
// page data" step imports every route's modules (including this one,
// transitively, through queries.ts) using ~dozens of parallel worker
// processes just to read each route's static config — it never actually
// calls a query function. If we opened + migrated the SQLite file eagerly
// at import time (the old behavior), all of those worker processes would
// race to open and write-migrate the same file at once, and lose that
// race with a "database is locked" (SQLITE_BUSY) error. Deferring the
// real connection until first genuine use means the build never touches
// the file at all — only the single running server process does, at
// runtime, one at a time.
export const db = new Proxy(
  {},
  {
    get(_target, prop, _receiver) {
      const real = getDb();
      const value = Reflect.get(real as object, prop, real);
      return typeof value === "function" ? value.bind(real) : value;
    },
  }
) as unknown as DatabaseSync;

export function nowIso() {
  return new Date().toISOString();
}
