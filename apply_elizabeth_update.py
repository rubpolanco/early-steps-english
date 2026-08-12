import pathlib

# 1) src/lib/seed.ts — seed the Director/Admin demo record as Elizabeth Guzman
p = pathlib.Path("src/lib/seed.ts")
text = p.read_text()
old = '{ name: "Sofía Martínez", email: "admin@earlystepsenglish.com", role: "admin", classroom: null, phone: "(809) 555-0101" },'
new = '{ name: "Elizabeth Guzman", email: "admin@earlystepsenglish.com", role: "admin", classroom: null, phone: "(809) 555-0101" },'
assert old in text, "seed.ts: pattern not found — may already be patched"
p.write_text(text.replace(old, new))
print("patched src/lib/seed.ts")

# 2) src/app/(staff)/staff/actions.ts — add updateStaff server action
p = pathlib.Path("src/app/(staff)/staff/actions.ts")
text = p.read_text()
old = '''export async function toggleStaffActive(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "admin") return;
  const id = String(formData.get("staffId"));
  db.prepare(`UPDATE staff SET active = 1 - active WHERE id = ?`).run(id);
  revalidatePath("/staff");
}'''
new = old + '''

export async function updateStaff(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "admin") return;

  const id = String(formData.get("staffId") || "");
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!id || !name || !email) return;

  const phone = String(formData.get("phone") || "").trim();
  const role = String(formData.get("role") || "teacher");
  const classroomId = String(formData.get("classroomId") || "") || null;
  const newPassword = String(formData.get("password") || "").trim();

  const existing = db.prepare("SELECT id FROM staff WHERE email = ? AND id != ?").get(email, id);
  if (existing) return;

  if (newPassword) {
    const passwordHash = await hashPassword(newPassword);
    db.prepare(
      `UPDATE staff SET name = ?, email = ?, phone = ?, role = ?, classroom_id = ?, password_hash = ? WHERE id = ?`
    ).run(name, email, phone, role, classroomId, passwordHash, id);
  } else {
    db.prepare(
      `UPDATE staff SET name = ?, email = ?, phone = ?, role = ?, classroom_id = ? WHERE id = ?`
    ).run(name, email, phone, role, classroomId, id);
  }

  revalidatePath("/staff");
}'''
assert old in text, "actions.ts: pattern not found — may already be patched"
p.write_text(text.replace(old, new))
print("patched src/app/(staff)/staff/actions.ts")

# 3) src/app/(staff)/staff/page.tsx — add an inline "Edit details" panel per staff row
p = pathlib.Path("src/app/(staff)/staff/page.tsx")
text = p.read_text()

old_import = 'import { createStaff, toggleStaffActive } from "./actions";'
new_import = 'import { createStaff, toggleStaffActive, updateStaff } from "./actions";'
assert old_import in text, "page.tsx: import line not found — may already be patched"
text = text.replace(old_import, new_import)

old_block = '''      <div className="card divide-y divide-brand-navy/5">
        {staff.map((s) => (
          <div key={s.id} className="flex items-center gap-3 p-4">
            <Avatar name={s.name} url={s.photo_url} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-brand-navy text-sm">{s.name}</p>
              <p className="text-xs text-brand-navy/60">
                {ROLE_LABEL[s.role]} {s.classroom_id && `· ${classroomById[s.classroom_id]?.name}`} · {s.email}
              </p>
            </div>
            <Badge color={s.active ? "green" : "gray"}>{s.active ? "Active" : "Inactive"}</Badge>
            <form action={toggleStaffActive}>
              <input type="hidden" name="staffId" value={s.id} />
              <button className="btn-secondary px-3 py-1.5 text-xs">{s.active ? "Deactivate" : "Reactivate"}</button>
            </form>
          </div>
        ))}
      </div>'''

new_block = '''      <div className="card divide-y divide-brand-navy/5">
        {staff.map((s) => (
          <div key={s.id} className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Avatar name={s.name} url={s.photo_url} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-brand-navy text-sm">{s.name}</p>
                <p className="text-xs text-brand-navy/60">
                  {ROLE_LABEL[s.role]} {s.classroom_id && `· ${classroomById[s.classroom_id]?.name}`} · {s.email}
                </p>
              </div>
              <Badge color={s.active ? "green" : "gray"}>{s.active ? "Active" : "Inactive"}</Badge>
              <form action={toggleStaffActive}>
                <input type="hidden" name="staffId" value={s.id} />
                <button className="btn-secondary px-3 py-1.5 text-xs">{s.active ? "Deactivate" : "Reactivate"}</button>
              </form>
            </div>

            <details className="group">
              <summary className="btn-secondary inline-block px-3 py-1.5 text-xs cursor-pointer select-none list-none">
                ✎ Edit details
              </summary>
              <form
                action={updateStaff}
                className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg bg-brand-sky/5 p-4"
              >
                <input type="hidden" name="staffId" value={s.id} />
                <input
                  name="name"
                  defaultValue={s.name}
                  placeholder="Full name"
                  required
                  className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm"
                />
                <input
                  name="email"
                  type="email"
                  defaultValue={s.email}
                  placeholder="Email"
                  required
                  className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm"
                />
                <input
                  name="phone"
                  defaultValue={s.phone ?? ""}
                  placeholder="Phone"
                  className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm"
                />
                <select
                  name="role"
                  defaultValue={s.role}
                  className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm"
                >
                  <option value="teacher">Teacher</option>
                  <option value="front_desk">Front Desk</option>
                  <option value="admin">Director / Admin</option>
                </select>
                <select
                  name="classroomId"
                  defaultValue={s.classroom_id ?? ""}
                  className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm"
                >
                  <option value="">No classroom assigned</option>
                  {classrooms.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input
                  name="password"
                  placeholder="New password (leave blank to keep current)"
                  className="rounded-lg border border-brand-navy/15 px-3 py-2 text-sm"
                />
                <button type="submit" className="btn-primary px-4 py-2 text-sm sm:col-span-2">
                  Save changes
                </button>
              </form>
            </details>
          </div>
        ))}
      </div>'''

assert old_block in text, "page.tsx: staff list block not found — may already be patched"
text = text.replace(old_block, new_block)
p.write_text(text)
print("patched src/app/(staff)/staff/page.tsx")

print("\nAll files patched successfully.")
