#!/usr/bin/env node
/**
 * seed.js
 * Populates the SQLite database with starter courses.
 * Run: node seed.js
 *
 * Uses sql.js (pure JS) — no native compilation required.
 */
const path = require('path');
const fs   = require('fs');

async function main() {
  const initSqlJs = require('sql.js');
  const SQL = await initSqlJs();

  const dataDir = path.join(__dirname, 'data');
  const dbPath  = path.join(dataDir, 'degreeplan.db');
  fs.mkdirSync(dataDir, { recursive: true });

  const db = fs.existsSync(dbPath)
    ? new SQL.Database(fs.readFileSync(dbPath))
    : new SQL.Database();

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

  const SEED = [
    // Mathematics (BA)
    { code:'MATH 122B', title:'Calculus I',            units:4, category:'Mathematics Core',  major:'Mathematics (BA)',     description:'Limits, derivatives, introduction to integration. Fundamental theorem of calculus.',            prereqs:[],                      offered:['Fall','Spring'] },
    { code:'MATH 129',  title:'Calculus II',            units:4, category:'Mathematics Core',  major:'Mathematics (BA)',     description:'Techniques and applications of integration, sequences, series, power series.',                 prereqs:['MATH 122B'],           offered:['Fall','Spring'] },
    { code:'MATH 223',  title:'Vector Calculus',        units:4, category:'Mathematics Core',  major:'Mathematics (BA)',     description:"Multivariable calculus. Green's and Stokes' theorems. Line and surface integrals.",            prereqs:['MATH 129'],            offered:['Fall','Spring'] },
    { code:'MATH 254',  title:'Intro to ODE',           units:3, category:'Mathematics Core',  major:'Mathematics (BA)',     description:'First and second order ODEs, systems of equations, Laplace transform.',                      prereqs:['MATH 129'],            offered:['Fall','Spring'] },
    { code:'MATH 313',  title:'Introduction to Proofs', units:3, category:'Proof-Based Core',  major:'Mathematics (BA)',     description:'Logic, set theory, mathematical reasoning and proof techniques.',                             prereqs:['MATH 129'],            offered:['Fall','Spring'] },
    { code:'MATH 323',  title:'Real Analysis I',        units:3, category:'Analysis',          major:'Mathematics (BA)',     description:'Rigorous limits, continuity, differentiation and Riemann integration.',                       prereqs:['MATH 313','MATH 223'], offered:['Fall','Spring'] },
    { code:'MATH 324',  title:'Real Analysis II',       units:3, category:'Analysis',          major:'Mathematics (BA)',     description:'Sequences of functions, uniform convergence, metric spaces, topology.',                       prereqs:['MATH 323'],            offered:['Spring'] },
    { code:'MATH 355',  title:'Linear Algebra',         units:3, category:'Algebra',           major:'Mathematics (BA)',     description:'Vector spaces, linear transformations, eigenvalues, inner product spaces.',                    prereqs:['MATH 313'],            offered:['Fall'] },
    { code:'MATH 413',  title:'Abstract Algebra I',     units:3, category:'Algebra',           major:'Mathematics (BA)',     description:'Groups, subgroups, homomorphisms, quotient groups, Sylow theorems.',                          prereqs:['MATH 355'],            offered:['Fall','Spring'] },
    { code:'MATH 414',  title:'Abstract Algebra II',    units:3, category:'Algebra',           major:'Mathematics (BA)',     description:'Rings, ideals, fields, Galois theory and applications.',                                     prereqs:['MATH 413'],            offered:['Spring'] },
    { code:'MATH 425',  title:'Complex Variables',      units:3, category:'Analysis Elective', major:'Mathematics (BA)',     description:'Complex analysis, Cauchy theorem, residues, conformal mappings.',                             prereqs:['MATH 323'],            offered:['Fall'] },
    { code:'MATH 464',  title:'Theory of Probability',  units:3, category:'Applied Elective',  major:'Mathematics (BA)',     description:'Random variables, distributions, expected value, limit theorems.',                            prereqs:['MATH 223'],            offered:['Fall','Spring'] },
    { code:'MATH 485',  title:'Mathematical Modeling',  units:3, category:'Applied Elective',  major:'Mathematics (BA)',     description:'Formulation and analysis of mathematical models for real-world problems.',                     prereqs:['MATH 254','MATH 355'], offered:['Spring'] },
    // Computer Science (BS)
    { code:'CSC 110',   title:'Intro to Programming',         units:3, category:'CS Core',     major:'Computer Science (BS)', description:'Python fundamentals: variables, control flow, functions, I/O.',                          prereqs:[],                      offered:['Fall','Spring','Summer'] },
    { code:'CSC 120',   title:'Intro to Programming II',      units:3, category:'CS Core',     major:'Computer Science (BS)', description:'Python OOP, data structures, algorithms, recursion.',                                   prereqs:['CSC 110'],             offered:['Fall','Spring','Summer'] },
    { code:'CSC 210',   title:'Software Development',         units:3, category:'CS Core',     major:'Computer Science (BS)', description:'Java, OO design, data structures, recursion.',                                          prereqs:['CSC 120'],             offered:['Fall','Spring'] },
    { code:'CSC 252',   title:'Computer Organization',        units:3, category:'CS Core',     major:'Computer Science (BS)', description:'Computer architecture, assembly, memory hierarchy.',                                   prereqs:['CSC 210'],             offered:['Fall','Spring'] },
    { code:'CSC 335',   title:'OO Programming & Design',      units:3, category:'CS Core',     major:'Computer Science (BS)', description:'Design patterns, refactoring, unit testing, agile practices.',                          prereqs:['CSC 210'],             offered:['Fall','Spring'] },
    { code:'CSC 345',   title:'Discrete Structures',          units:3, category:'CS Core',     major:'Computer Science (BS)', description:'Graph theory, combinatorics, Boolean algebra, automata.',                               prereqs:['CSC 210'],             offered:['Fall','Spring'] },
    { code:'CSC 380',   title:'Principles of Data Science',   units:3, category:'CS Elective', major:'Computer Science (BS)', description:'Data wrangling, visualization, statistical analysis, intro ML.',                        prereqs:['CSC 210','MATH 464'],  offered:['Fall','Spring'] },
    { code:'CSC 422',   title:'Parallel & Distributed',       units:3, category:'CS Elective', major:'Computer Science (BS)', description:'Threads, concurrency, distributed systems, MapReduce.',                                prereqs:['CSC 335'],             offered:['Spring'] },
    { code:'CSC 460',   title:'Database Design',              units:3, category:'CS Elective', major:'Computer Science (BS)', description:'SQL, relational model, normalization, indexing, NoSQL basics.',                         prereqs:['CSC 335'],             offered:['Fall','Spring'] },
    { code:'CSC 473',   title:'Advanced Algorithms',          units:3, category:'CS Elective', major:'Computer Science (BS)', description:'Divide-and-conquer, dynamic programming, greedy, NP-completeness.',                    prereqs:['CSC 345'],             offered:['Fall'] },
    { code:'CSC 483',   title:'Natural Language Processing',  units:3, category:'CS Elective', major:'Computer Science (BS)', description:'Language models, text classification, machine learning for NLP.',                      prereqs:['CSC 335','MATH 464'],  offered:['Fall'] },
    { code:'CSC 498',   title:'Senior Capstone',              units:3, category:'CS Capstone', major:'Computer Science (BS)', description:'Year-long team project solving a real-world problem.',                                  prereqs:['CSC 335'],             offered:['Spring'] },
  ];

  let count = 0;
  db.run('BEGIN TRANSACTION');
  for (const c of SEED) {
    db.run(`
      INSERT OR IGNORE INTO courses
        (code,title,units,category,major,description,syllabus,prereqs,offered)
      VALUES ($code,$title,$units,$category,$major,$description,$syllabus,$prereqs,$offered)
    `, {
      $code:        c.code,
      $title:       c.title,
      $units:       c.units,
      $category:    c.category,
      $major:       c.major,
      $description: c.description,
      $syllabus:    '',
      $prereqs:     JSON.stringify(c.prereqs),
      $offered:     JSON.stringify(c.offered),
    });
    count += db.getRowsModified();
  }
  db.run('COMMIT');

  fs.writeFileSync(dbPath, Buffer.from(db.export()));
  db.close();

  console.log(`✅  Seeded ${count} new courses (${SEED.length - count} already existed).`);
  console.log(`📦  DB → ${dbPath}`);
}

main().catch(err => { console.error('Seed failed:', err); process.exit(1); });
