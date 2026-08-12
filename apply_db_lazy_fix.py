import pathlib

p = pathlib.Path("src/lib/db.ts")
text = p.read_text()

old = '''function createConnection() {
  const conn = new DatabaseSync(DB_PATH);
  conn.exec("PRAGMA busy_timeout = 10000");
  conn.exec("PRAGMA journal_mode = WAL");
  conn.exec("PRAGMA foreign_keys = ON");
  return conn;
}

export const db = global.__esDb ?? createConnection();
if (process.env.NODE_ENV !== "production") global.__esDb = db;

const SCHEMA = `'''

new = '''const SCHEMA = `'''

assert old in text, "db.ts: top block not found — may already be patched or drifted"
text = text.replace(old, new)

old2 = '''`;

db.exec(SCHEMA);

export function nowIso() {'''

new2 = '''`;

function createConnection() {
  const conn = new DatabaseSync(DB_PATH);
  // Give concurrent writers room to queue instead of failing instantly
  // with SQLITE_BUSY ("database is locked") if two connections happen to
  // touch the file at the same moment.
  conn.exec("PRAGMA busy_timeout = 10000");
  conn.exec("PRAGMA journal_mode = WAL");
  conn.exec("PRAGMA foreign_keys = ON");
  conn.exec(SCHEMA);
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
// method on it -- e.g. `db.prepare(...)` from inside a query function at
// real request time.
//
// This laziness matters specifically for `next build`. Next's "Collecting
// page data" step imports every route's modules (including this one,
// transitively, through queries.ts) using dozens of parallel worker
// processes just to read each route's static config -- it never actually
// calls a query function. If we opened + migrated the SQLite file eagerly
// at import time (the old behavior), all of those worker processes would
// race to open and write-migrate the same file at once, and lose that
// race with a "database is locked" (SQLITE_BUSY) error. Deferring the
// real connection until first genuine use means the build never touches
// the file at all -- only the single running server process does, at
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

export function nowIso() {'''

assert old2 in text, "db.ts: bottom block not found — may already be patched or drifted"
text = text.replace(old2, new2)

p.write_text(text)
print("patched src/lib/db.ts")
