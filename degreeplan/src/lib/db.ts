/**
 * lib/db.ts
 * SQLite via sql.js — pure JavaScript/WASM, no native compilation required.
 * Persists to ./data/degreeplan.db on disk; loads it back on startup.
 */
import initSqlJs, { Database, SqlValue } from 'sql.js';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'degreeplan.db');

// ── Singleton ─────────────────────────────────────────────────────────────────
let _db: Database | null = null;
let _initPromise: Promise<Database> | null = null;

export async function getDb(): Promise<Database> {
  if (_db) return _db;
  if (_initPromise) return _initPromise;
  _initPromise = (async () => {
    const SQL = await initSqlJs();
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    _db = fs.existsSync(DB_PATH)
      ? new SQL.Database(fs.readFileSync(DB_PATH))
      : new SQL.Database();
    applySchema(_db);
    persist(_db);
    return _db;
  })();
  return _initPromise;
}

/** Write the in-memory DB back to disk after every mutation. */
function persist(db: Database) {
  fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
}

// ── Schema ────────────────────────────────────────────────────────────────────
function applySchema(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS courses (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      code        TEXT NOT NULL,
      title       TEXT NOT NULL,
      units       INTEGER NOT NULL DEFAULT 3,
      category    TEXT NOT NULL DEFAULT '',
      major       TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      syllabus    TEXT NOT NULL DEFAULT '',
      prereqs     TEXT NOT NULL DEFAULT '[]',
      offered     TEXT NOT NULL DEFAULT '[]',
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_courses_code_major ON courses(code, major);

    CREATE TABLE IF NOT EXISTS plans (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      major           TEXT NOT NULL,
      second_major    TEXT,
      standing        TEXT NOT NULL,
      grad_term       TEXT NOT NULL,
      max_units       INTEGER NOT NULL DEFAULT 16,
      include_summer  INTEGER NOT NULL DEFAULT 0,
      transcript_text TEXT NOT NULL DEFAULT '',
      result_json     TEXT,
      feasibility     TEXT,
      created_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

// ── Query helpers ─────────────────────────────────────────────────────────────
type Params = { [key: string]: SqlValue } | SqlValue[];

function queryAll(db: Database, sql: string, params?: Params): any[] {
  const stmt = db.prepare(sql);
  if (params) stmt.bind(params as any);
  const rows: any[] = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function queryOne(db: Database, sql: string, params?: Params): any | null {
  const stmt = db.prepare(sql);
  if (params) stmt.bind(params as any);
  const row = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  return row;
}

// ── Types ─────────────────────────────────────────────────────────────────────
export interface Course {
  id?: number;
  code: string;
  title: string;
  units: number;
  category: string;
  major: string;
  description: string;
  syllabus: string;
  prereqs: string[];
  offered: string[];
}

function hydrate(row: any): Course {
  return {
    ...row,
    id: Number(row.id),
    units: Number(row.units),
    prereqs: JSON.parse(row.prereqs || '[]'),
    offered: JSON.parse(row.offered  || '[]'),
  };
}

function courseParams(c: Course | Partial<Course>) {
  return {
    $code:        c.code        ?? '',
    $title:       c.title       ?? '',
    $units:       c.units       ?? 3,
    $category:    c.category    ?? '',
    $major:       c.major       ?? '',
    $description: c.description ?? '',
    $syllabus:    c.syllabus    ?? '',
    $prereqs:     JSON.stringify(c.prereqs ?? []),
    $offered:     JSON.stringify(c.offered ?? []),
  };
}

// ── Course helpers ─────────────────────────────────────────────────────────────
export async function getAllCourses(): Promise<Course[]> {
  const db = await getDb();
  return queryAll(db, 'SELECT * FROM courses ORDER BY major, code').map(hydrate);
}

export async function upsertCourse(c: Course): Promise<Course> {
  const db = await getDb();
  db.run(`
    INSERT INTO courses (code,title,units,category,major,description,syllabus,prereqs,offered)
    VALUES ($code,$title,$units,$category,$major,$description,$syllabus,$prereqs,$offered)
    ON CONFLICT(code,major) DO UPDATE SET
      title=excluded.title, units=excluded.units, category=excluded.category,
      description=excluded.description, syllabus=excluded.syllabus,
      prereqs=excluded.prereqs, offered=excluded.offered,
      updated_at=datetime('now')
  `, courseParams(c));
  persist(db);
  return hydrate(queryOne(db, 'SELECT * FROM courses WHERE code=$code AND major=$major', { $code: c.code, $major: c.major })!);
}

export async function updateCourse(id: number, c: Partial<Course>): Promise<Course> {
  const db = await getDb();
  const existing = queryOne(db, 'SELECT * FROM courses WHERE id=$id', { $id: id });
  if (!existing) throw new Error(`Course ${id} not found`);
  db.run(`
    UPDATE courses
    SET code=$code, title=$title, units=$units, category=$category,
        major=$major, description=$description, syllabus=$syllabus,
        prereqs=$prereqs, offered=$offered, updated_at=datetime('now')
    WHERE id=$id
  `, {
    ...courseParams({ ...hydrate(existing), ...c }),
    $id: id,
  });
  persist(db);
  return hydrate(queryOne(db, 'SELECT * FROM courses WHERE id=$id', { $id: id })!);
}

export async function deleteCourse(id: number): Promise<void> {
  const db = await getDb();
  db.run('DELETE FROM courses WHERE id=$id', { $id: id });
  persist(db);
}

export async function bulkInsertCourses(courses: Course[]): Promise<number> {
  const db = await getDb();
  let inserted = 0;
  db.run('BEGIN TRANSACTION');
  try {
    for (const c of courses) {
      db.run(`
        INSERT OR IGNORE INTO courses
          (code,title,units,category,major,description,syllabus,prereqs,offered)
        VALUES ($code,$title,$units,$category,$major,$description,$syllabus,$prereqs,$offered)
      `, courseParams(c));
      inserted += db.getRowsModified();
    }
    db.run('COMMIT');
  } catch (e) {
    db.run('ROLLBACK');
    throw e;
  }
  persist(db);
  return inserted;
}

export async function savePlan(p: {
  major: string; second_major?: string; standing: string; grad_term: string;
  max_units: number; include_summer: boolean; transcript_text: string;
  result_json: any; feasibility: string;
}): Promise<number> {
  const db = await getDb();
  db.run(`
    INSERT INTO plans
      (major,second_major,standing,grad_term,max_units,include_summer,transcript_text,result_json,feasibility)
    VALUES ($major,$second_major,$standing,$grad_term,$max_units,$include_summer,$transcript_text,$result_json,$feasibility)
  `, {
    $major:           p.major,
    $second_major:    p.second_major ?? null,
    $standing:        p.standing,
    $grad_term:       p.grad_term,
    $max_units:       p.max_units,
    $include_summer:  p.include_summer ? 1 : 0,
    $transcript_text: p.transcript_text,
    $result_json:     typeof p.result_json === 'string' ? p.result_json : JSON.stringify(p.result_json),
    $feasibility:     p.feasibility,
  });
  persist(db);
  const row = queryOne(db, 'SELECT last_insert_rowid() AS id');
  return Number(row?.id ?? 0);
}
