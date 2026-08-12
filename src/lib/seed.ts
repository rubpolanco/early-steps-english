import { v4 as uuid } from "uuid";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { UPLOADS_DIR } from "@/lib/storage";

// Demo passwords (documented in README) — change before any real-world use.
export const DEMO_STAFF_PASSWORD = "Teach2026!";
export const DEMO_GUARDIAN_PASSWORD = "Familia2026!";

function isoDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}
function isoDaysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function ensureSeeded() {
  const existing = db.prepare("SELECT id FROM schools LIMIT 1").get() as
    | { id: string }
    | undefined;
  if (existing) return;

  const schoolId = uuid();
  db.prepare(
    `INSERT INTO schools (id, name, tagline, address, phone, email) VALUES (?,?,?,?,?,?)`
  ).run(
    schoolId,
    "Early Steps English",
    "English Activity Center · Centro de Inglés Infantil",
    "Av. Winston Churchill 500, Santo Domingo, Dominican Republic",
    "(809) 555-0142",
    "hello@earlystepsenglish.com"
  );

  // ---- Classrooms ----
  const classroomDefs = [
    { name: "Little Explorers", age_group: "1–2 years", color: "sky", capacity: 8 },
    { name: "Curious Cubs", age_group: "2–3 years", color: "yellow", capacity: 10 },
    { name: "Bright Sparks", age_group: "3–4 years", color: "green", capacity: 12 },
    { name: "Junior Scholars", age_group: "4–5 years", color: "blue", capacity: 12 },
  ];
  const classroomIds: Record<string, string> = {};
  for (const c of classroomDefs) {
    const id = uuid();
    classroomIds[c.name] = id;
    db.prepare(
      `INSERT INTO classrooms (id, school_id, name, age_group, capacity, color) VALUES (?,?,?,?,?,?)`
    ).run(id, schoolId, c.name, c.age_group, c.capacity, c.color);
  }

  // ---- Staff ----
  const staffPasswordHash = await hashPassword(DEMO_STAFF_PASSWORD);
  const staffDefs = [
    { name: "Elizabeth Guzman", email: "admin@earlystepsenglish.com", role: "admin", classroom: null, phone: "(809) 555-0101" },
    { name: "Jennifer Reyes", email: "jennifer@earlystepsenglish.com", role: "teacher", classroom: "Little Explorers", phone: "(809) 555-0102" },
    { name: "Carla Pimentel", email: "carla@earlystepsenglish.com", role: "teacher", classroom: "Curious Cubs", phone: "(809) 555-0103" },
    { name: "Daniel Ureña", email: "daniel@earlystepsenglish.com", role: "teacher", classroom: "Bright Sparks", phone: "(809) 555-0104" },
    { name: "Michelle Vargas", email: "michelle@earlystepsenglish.com", role: "teacher", classroom: "Junior Scholars", phone: "(809) 555-0105" },
    { name: "Ana Gómez", email: "frontdesk@earlystepsenglish.com", role: "front_desk", classroom: null, phone: "(809) 555-0106" },
  ] as const;
  const staffIds: Record<string, string> = {};
  for (const s of staffDefs) {
    const id = uuid();
    staffIds[s.email] = id;
    db.prepare(
      `INSERT INTO staff (id, school_id, name, email, password_hash, role, classroom_id, phone) VALUES (?,?,?,?,?,?,?,?)`
    ).run(
      id,
      schoolId,
      s.name,
      s.email,
      staffPasswordHash,
      s.role,
      s.classroom ? classroomIds[s.classroom] : null,
      s.phone
    );
  }

  // ---- Tuition plans ----
  const planFull = uuid();
  const planHalf = uuid();
  db.prepare(
    `INSERT INTO tuition_plans (id, school_id, name, amount, frequency) VALUES (?,?,?,?,?)`
  ).run(planFull, schoolId, "Full-Time Tuition", 250, "monthly");
  db.prepare(
    `INSERT INTO tuition_plans (id, school_id, name, amount, frequency) VALUES (?,?,?,?,?)`
  ).run(planHalf, schoolId, "Half-Day Tuition", 150, "monthly");

  const guardianPasswordHash = await hashPassword(DEMO_GUARDIAN_PASSWORD);
  function makeGuardian(name: string, email: string, phone: string) {
    const id = uuid();
    db.prepare(
      `INSERT INTO guardians (id, school_id, name, email, password_hash, phone) VALUES (?,?,?,?,?,?)`
    ).run(id, schoolId, name, email, guardianPasswordHash, phone);
    return id;
  }
  function linkGuardian(studentId: string, guardianId: string, relationship: string, isPrimary: boolean) {
    db.prepare(
      `INSERT INTO student_guardians (student_id, guardian_id, relationship, is_primary) VALUES (?,?,?,?)`
    ).run(studentId, guardianId, relationship, isPrimary ? 1 : 0);
  }
  function makePickup(studentId: string, name: string, relationship: string, phone: string, pin: string, addedBy?: string) {
    db.prepare(
      `INSERT INTO pickup_people (id, student_id, name, relationship, phone, pin_code, added_by_guardian_id) VALUES (?,?,?,?,?,?,?)`
    ).run(uuid(), studentId, name, relationship, phone, pin, addedBy ?? null);
  }
  function makeStudent(opts: {
    first: string; last: string; dob: string; gender: string; classroom: string;
    status?: "enrolled" | "waitlist"; desiredStart?: string; allergies?: string;
  }) {
    const id = uuid();
    db.prepare(
      `INSERT INTO students (id, school_id, classroom_id, first_name, last_name, dob, gender, status, enrollment_date, desired_start_date, allergies, immunization_status, immunization_expiry)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).run(
      id, schoolId, classroomIds[opts.classroom], opts.first, opts.last, opts.dob, opts.gender,
      opts.status ?? "enrolled",
      opts.status === "waitlist" ? null : isoDaysAgo(120),
      opts.desiredStart ?? null,
      opts.allergies ?? null,
      Math.random() > 0.8 ? "due_soon" : "up_to_date",
      isoDaysFromNow(180)
    );
    return id;
  }

  type Family = {
    student: Parameters<typeof makeStudent>[0];
    guardians: { name: string; email: string; phone: string; relationship: string }[];
    pickups?: { name: string; relationship: string; phone: string; pin: string }[];
  };

  const families: Family[] = [
    {
      student: { first: "Emma", last: "Castillo", dob: "2023-05-10", gender: "female", classroom: "Little Explorers", allergies: "Peanuts" },
      guardians: [
        { name: "Patricia Castillo", email: "patricia.castillo@example.com", phone: "(809) 555-1201", relationship: "mother" },
        { name: "José Castillo", email: "jose.castillo@example.com", phone: "(809) 555-1202", relationship: "father" },
      ],
      pickups: [
        { name: "Miguelina Castillo", relationship: "grandmother", phone: "(809) 555-1210", pin: "4821" },
        { name: "Yolanda Pérez", relationship: "nanny", phone: "(809) 555-1211", pin: "5533" },
      ],
    },
    {
      student: { first: "Mateo", last: "Ruiz", dob: "2023-02-20", gender: "male", classroom: "Little Explorers" },
      guardians: [{ name: "Vanessa Ruiz", email: "vanessa.ruiz@example.com", phone: "(809) 555-1220", relationship: "mother" }],
      pickups: [{ name: "Rafael Ruiz", relationship: "uncle", phone: "(809) 555-1221", pin: "7712" }],
    },
    {
      student: { first: "Adrián", last: "Tejada", dob: "2023-07-07", gender: "male", classroom: "Little Explorers" },
      guardians: [{ name: "Estefanía Tejada", email: "estefania.tejada@example.com", phone: "(809) 555-1230", relationship: "mother" }],
      pickups: [{ name: "Rocío Tejada", relationship: "nanny / service maid", phone: "(809) 555-1231", pin: "3390" }],
    },
    {
      student: { first: "Sofía", last: "Almonte", dob: "2022-11-02", gender: "female", classroom: "Curious Cubs" },
      guardians: [
        { name: "Carmen Almonte", email: "carmen.almonte@example.com", phone: "(809) 555-1240", relationship: "mother" },
        { name: "Luis Almonte", email: "luis.almonte@example.com", phone: "(809) 555-1241", relationship: "father" },
      ],
      pickups: [{ name: "Pedro Lantigua", relationship: "school van driver", phone: "(809) 555-1242", pin: "6644" }],
    },
    {
      student: { first: "Liam", last: "Peña", dob: "2022-08-15", gender: "male", classroom: "Curious Cubs" },
      guardians: [{ name: "Rosa Peña", email: "rosa.pena@example.com", phone: "(809) 555-1250", relationship: "mother" }],
      pickups: [{ name: "Ana Peña", relationship: "grandmother", phone: "(809) 555-1251", pin: "8890" }],
    },
    {
      student: { first: "Camila", last: "Reynoso", dob: "2022-04-18", gender: "female", classroom: "Curious Cubs", status: "waitlist", desiredStart: isoDaysFromNow(21) },
      guardians: [{ name: "Michelle Reynoso", email: "michelle.reynoso@example.com", phone: "(809) 555-1260", relationship: "mother" }],
    },
    {
      student: { first: "Valentina", last: "Cruz", dob: "2021-12-01", gender: "female", classroom: "Bright Sparks", allergies: "Lactose intolerant" },
      guardians: [
        { name: "Melissa Cruz", email: "melissa.cruz@example.com", phone: "(809) 555-1270", relationship: "mother" },
        { name: "Andrés Cruz", email: "andres.cruz@example.com", phone: "(809) 555-1271", relationship: "father" },
      ],
      pickups: [
        { name: "Digna Cruz", relationship: "grandmother", phone: "(809) 555-1272", pin: "1123" },
        { name: "Wendy Solano", relationship: "nanny / service maid", phone: "(809) 555-1273", pin: "9981" },
      ],
    },
    {
      student: { first: "Diego", last: "Santana", dob: "2021-09-09", gender: "male", classroom: "Bright Sparks" },
      guardians: [{ name: "Karina Santana", email: "karina.santana@example.com", phone: "(809) 555-1280", relationship: "mother" }],
      pickups: [{ name: "Julio Santana", relationship: "uncle", phone: "(809) 555-1281", pin: "2266" }],
    },
    {
      student: { first: "Isabella", last: "Mercedes", dob: "2021-03-22", gender: "female", classroom: "Junior Scholars" },
      guardians: [
        { name: "Yesenia Mercedes", email: "yesenia.mercedes@example.com", phone: "(809) 555-1290", relationship: "mother" },
        { name: "Franklin Mercedes", email: "franklin.mercedes@example.com", phone: "(809) 555-1291", relationship: "father" },
      ],
      pickups: [{ name: "Altagracia Mercedes", relationship: "grandmother", phone: "(809) 555-1292", pin: "4470" }],
    },
    {
      student: { first: "Sebastián", last: "Objío", dob: "2021-01-30", gender: "male", classroom: "Junior Scholars" },
      guardians: [{ name: "Claudia Objío", email: "claudia.objio@example.com", phone: "(809) 555-1300", relationship: "mother" }],
    },
  ];

  const studentIds: Record<string, string> = {};
  const guardianIdByEmail: Record<string, string> = {};

  for (const fam of families) {
    const studentId = makeStudent(fam.student);
    studentIds[`${fam.student.first} ${fam.student.last}`] = studentId;

    let firstGuardianId: string | null = null;
    fam.guardians.forEach((g, idx) => {
      let gid = guardianIdByEmail[g.email];
      if (!gid) {
        gid = makeGuardian(g.name, g.email, g.phone);
        guardianIdByEmail[g.email] = gid;
      }
      linkGuardian(studentId, gid, g.relationship, idx === 0);
      if (idx === 0) firstGuardianId = gid;
    });

    for (const p of fam.pickups ?? []) {
      makePickup(studentId, p.name, p.relationship, p.phone, p.pin, firstGuardianId ?? undefined);
    }

    // Billing: current + previous month invoice for enrolled students
    if (fam.student.status !== "waitlist") {
      const plan = fam.student.classroom === "Little Explorers" ? planFull : planFull;
      const thisMonth = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });
      const lastMonthDate = new Date();
      lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
      const lastMonth = lastMonthDate.toLocaleString("en-US", { month: "long", year: "numeric" });

      const lastInvId = uuid();
      db.prepare(
        `INSERT INTO invoices (id, student_id, tuition_plan_id, period_label, amount, due_date, status) VALUES (?,?,?,?,?,?,?)`
      ).run(lastInvId, studentId, plan, lastMonth, 250, isoDaysAgo(20), "paid");
      db.prepare(
        `INSERT INTO payments (id, invoice_id, amount, method, paid_at, recorded_by_staff_id) VALUES (?,?,?,?,?,?)`
      ).run(uuid(), lastInvId, 250, "card", isoDaysAgo(22), staffIds["admin@earlystepsenglish.com"]);

      const curInvId = uuid();
      const paidThisMonth = Math.random() > 0.55;
      db.prepare(
        `INSERT INTO invoices (id, student_id, tuition_plan_id, period_label, amount, due_date, status) VALUES (?,?,?,?,?,?,?)`
      ).run(curInvId, studentId, plan, thisMonth, 250, isoDaysFromNow(5), paidThisMonth ? "paid" : "unpaid");
      if (paidThisMonth) {
        db.prepare(
          `INSERT INTO payments (id, invoice_id, amount, method, paid_at, recorded_by_staff_id) VALUES (?,?,?,?,?,?)`
        ).run(uuid(), curInvId, 250, "transfer", isoDaysAgo(2), staffIds["admin@earlystepsenglish.com"]);
      }
    }

    // Immunization document
    db.prepare(
      `INSERT INTO documents (id, student_id, name, doc_type, expires_at) VALUES (?,?,?,?,?)`
    ).run(uuid(), studentId, "Immunization record", "immunization", isoDaysFromNow(180));
  }

  // ---- Attendance + daily reports for the last 5 weekdays (enrolled students only) ----
  const enrolledStudents = Object.entries(studentIds).filter(
    ([name]) => !name.startsWith("Camila")
  );
  const teacherByClassroomEmail: Record<string, string> = {
    "Little Explorers": "jennifer@earlystepsenglish.com",
    "Curious Cubs": "carla@earlystepsenglish.com",
    "Bright Sparks": "daniel@earlystepsenglish.com",
    "Junior Scholars": "michelle@earlystepsenglish.com",
  };
  const studentClassroomName: Record<string, string> = {};
  for (const fam of families) {
    if (fam.student.status === "waitlist") continue;
    studentClassroomName[`${fam.student.first} ${fam.student.last}`] = fam.student.classroom;
  }

  const moods = ["Happy", "Playful", "Calm", "Tired", "Curious"];
  const activities = [
    "English phonics circle, sensory play, outdoor recess",
    "Story time (The Very Hungry Caterpillar), art project, music & movement",
    "Alphabet games, block building, garden walk",
    "Show & tell in English, painting, snack-time counting",
  ];

  for (let dayOffset = 5; dayOffset >= 1; dayOffset--) {
    const d = new Date();
    d.setDate(d.getDate() - dayOffset);
    if (d.getDay() === 0 || d.getDay() === 6) continue; // skip weekends
    const dateStr = d.toISOString().slice(0, 10);

    for (const [name, studentId] of enrolledStudents) {
      if (Math.random() < 0.08) continue; // occasional absence
      const classroom = studentClassroomName[name];
      const teacherId = staffIds[teacherByClassroomEmail[classroom]];
      const checkIn = `${dateStr}T07:${30 + Math.floor(Math.random() * 25)}:00`;
      const checkOut = `${dateStr}T16:${Math.floor(Math.random() * 45)}:00`;

      db.prepare(
        `INSERT OR IGNORE INTO attendance (id, student_id, date, check_in_time, check_in_by_type, check_in_by_name, checked_in_staff_id, check_out_time, check_out_by_type, check_out_by_name, checked_out_staff_id)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`
      ).run(
        uuid(), studentId, dateStr, checkIn, "guardian", "Parent drop-off", teacherId,
        checkOut, "guardian", "Parent pick-up", teacherId
      );

      db.prepare(
        `INSERT OR IGNORE INTO daily_reports (id, student_id, date, mood, meals, naps, potty, activities, learning_notes, created_by_staff_id)
         VALUES (?,?,?,?,?,?,?,?,?,?)`
      ).run(
        uuid(), studentId, dateStr,
        moods[Math.floor(Math.random() * moods.length)],
        JSON.stringify([
          { meal: "Breakfast", amount: "Most" },
          { meal: "Lunch", amount: "All" },
          { meal: "Snack", amount: "Some" },
        ]),
        JSON.stringify([{ start: "12:30", end: "14:00" }]),
        JSON.stringify([{ time: "10:00", result: "Dry" }, { time: "13:45", result: "Wet" }]),
        activities[Math.floor(Math.random() * activities.length)],
        "Great participation in English circle time today!",
        teacherId
      );
    }
  }

  // Today's attendance: mix of checked-in, checked-out, and not-yet-arrived
  const today = isoDaysAgo(0);
  let i = 0;
  for (const [name, studentId] of enrolledStudents) {
    const classroom = studentClassroomName[name];
    const teacherId = staffIds[teacherByClassroomEmail[classroom]];
    i++;
    if (i % 4 === 0) continue; // some kids "not arrived yet" today
    const checkedOut = i % 3 === 0;
    db.prepare(
      `INSERT OR IGNORE INTO attendance (id, student_id, date, check_in_time, check_in_by_type, check_in_by_name, checked_in_staff_id, check_out_time, check_out_by_type, check_out_by_name, checked_out_staff_id)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`
    ).run(
      uuid(), studentId, today, `${today}T07:45:00`, "guardian", "Parent drop-off", teacherId,
      checkedOut ? `${today}T15:30:00` : null, checkedOut ? "guardian" : null, checkedOut ? "Parent pick-up" : null, checkedOut ? teacherId : null
    );
  }

  // ---- Messages ----
  const emmaId = studentIds["Emma Castillo"];
  const patriciaId = guardianIdByEmail["patricia.castillo@example.com"];
  const threadId = uuid();
  db.prepare(
    `INSERT INTO message_threads (id, school_id, subject, type, student_id) VALUES (?,?,?,?,?)`
  ).run(threadId, schoolId, "Emma — English Progress", "direct", emmaId);
  db.prepare(`INSERT INTO thread_participants (thread_id, guardian_id) VALUES (?,?)`).run(
    threadId, patriciaId
  );
  db.prepare(
    `INSERT INTO messages (id, thread_id, sender_type, sender_id, sender_name, body) VALUES (?,?,?,?,?,?)`
  ).run(
    uuid(), threadId, "staff", staffIds["jennifer@earlystepsenglish.com"], "Jennifer Reyes",
    "Hi Patricia! Emma had a wonderful day today — she said her first full sentence in English during circle time: \"I want more juice, please!\" 🎉"
  );
  db.prepare(
    `INSERT INTO messages (id, thread_id, sender_type, sender_id, sender_name, body) VALUES (?,?,?,?,?,?)`
  ).run(uuid(), threadId, "guardian", patriciaId, "Patricia Castillo", "That's amazing, thank you for letting me know! We've been practicing at home too.");

  const announcementId = uuid();
  db.prepare(
    `INSERT INTO message_threads (id, school_id, subject, type, classroom_id) VALUES (?,?,?,?,?)`
  ).run(announcementId, schoolId, "Field trip next Friday 🚌", "announcement", classroomIds["Bright Sparks"]);
  db.prepare(
    `INSERT INTO messages (id, thread_id, sender_type, sender_id, sender_name, body) VALUES (?,?,?,?,?,?)`
  ).run(
    uuid(), announcementId, "staff", staffIds["daniel@earlystepsenglish.com"], "Daniel Ureña",
    "Reminder: Bright Sparks is visiting the botanical garden next Friday as part of our nature vocabulary unit. Please send a water bottle and closed-toe shoes. / Recordatorio: visita al jardín botánico el próximo viernes."
  );

  // ---- Media (photo feed) with generated SVG placeholders ----
  const mediaCaptions = [
    { caption: "Story time with 'The Very Hungry Caterpillar' 🐛📖", classroom: "Bright Sparks", bg: "#FFE066", accent: "#0B4F6C" },
    { caption: "Painting our favorite English color words 🎨", classroom: "Curious Cubs", bg: "#A5ECFE", accent: "#0B4F6C" },
    { caption: "Outdoor sensory play — counting leaves in English! 🍃", classroom: "Little Explorers", bg: "#B8E7C4", accent: "#0B4F6C" },
    { caption: "Show & tell Friday — practicing full sentences 🗣️", classroom: "Junior Scholars", bg: "#FFD1DC", accent: "#0B4F6C" },
  ];
  const uploadsDir = require("path").join(UPLOADS_DIR, "demo");
  require("fs").mkdirSync(uploadsDir, { recursive: true });
  mediaCaptions.forEach((m, idx) => {
    const fileName = `demo-${idx + 1}.svg`;
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='640' height='480'>
      <rect width='640' height='480' fill='${m.bg}'/>
      <circle cx='320' cy='160' r='90' fill='#FFF3B0' opacity='0.8'/>
      <text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-family='Verdana' font-size='28' fill='${m.accent}'>Early Steps English</text>
      <text x='50%' y='65%' dominant-baseline='middle' text-anchor='middle' font-family='Verdana' font-size='18' fill='${m.accent}'>${m.classroom}</text>
    </svg>`;
    require("fs").writeFileSync(require("path").join(uploadsDir, fileName), svg);

    const mediaId = uuid();
    db.prepare(
      `INSERT INTO media (id, school_id, classroom_id, type, file_url, caption, uploaded_by_staff_id) VALUES (?,?,?,?,?,?,?)`
    ).run(
      mediaId, schoolId, classroomIds[m.classroom], "photo", `/media/demo/${fileName}`, m.caption,
      staffIds[teacherByClassroomEmail[m.classroom]]
    );
    // tag a student or two from that classroom
    const taggedStudent = Object.entries(studentClassroomName).find(([, c]) => c === m.classroom);
    if (taggedStudent) {
      db.prepare(`INSERT INTO media_students (media_id, student_id) VALUES (?,?)`).run(
        mediaId, studentIds[taggedStudent[0]]
      );
    }
  });
}
