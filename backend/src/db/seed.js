import { randomUUID } from 'node:crypto'
import { pathToFileURL } from 'node:url'
import bcrypt from 'bcrypt'
import { pool, query, withTransaction } from './pool.js'
import { runMigrations } from './migrate.js'
import { seed } from './seedData.js'
import { BCRYPT_ROUNDS } from '../config/env.js'

// Runs on every server start: inserts the demo schools, resources, lessons and
// results only when the database is completely empty. One transaction, so a
// failure leaves the database empty rather than half-seeded.
export async function seedBaseDataIfEmpty() {
  const { rows } = await query(
    'SELECT (SELECT COUNT(*) FROM lessons) AS lessons, (SELECT COUNT(*) FROM schools) AS schools'
  )
  if (rows[0].lessons > 0 || rows[0].schools > 0) return false

  await withTransaction(async (client) => {
    for (const s of seed.schools) {
      await query(
        `INSERT INTO schools (id, name, village, district, students, teachers, internet_mbps, uptime_pct, has_computers)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [s.id, s.name, s.village, s.district, s.students, s.teachers, s.internetMbps, s.uptimePct, s.hasComputers],
        client
      )
    }
    for (const r of seed.resources) {
      await query(
        'INSERT INTO resources (id, school_id, item, stock, needed) VALUES ($1, $2, $3, $4, $5)',
        [r.id, r.schoolId, r.item, r.stock, r.needed],
        client
      )
    }
    for (const l of seed.lessons) {
      await query(
        'INSERT INTO lessons (id, title, summary, summary_hi, quiz) VALUES ($1, $2, $3, $4, $5)',
        [l.id, l.title, l.summary, l.summary_hi, JSON.stringify(l.quiz)],
        client
      )
    }
    for (const r of seed.results) {
      await query(
        'INSERT INTO results (lesson_id, lesson_title, village, score, total, at) VALUES ($1, $2, $3, $4, $5, $6)',
        [r.lessonId, r.lessonTitle, r.village, r.score, r.total, r.at],
        client
      )
    }
    await query("SELECT setval('lessons_id_seq', (SELECT MAX(id) FROM lessons))", [], client)
  })
  console.log('[seed] inserted demo schools, resources, lessons and results')
  return true
}

const DEMO_USERS = [
  { name: 'Anita Sharma', email: 'teacher@gramshiksha.in', role: 'teacher', village: 'Bargi' },
  { name: 'Rakesh Verma', email: 'planner@gramshiksha.in', role: 'planner', village: null },
  { name: 'Priya Patel', email: 'student1@gramshiksha.in', role: 'student', village: 'Bargi' },
  { name: 'Arjun Singh', email: 'student2@gramshiksha.in', role: 'student', village: 'Dholera' },
]

// `npm run seed`: creates the four demo accounts (password from SEED_PASSWORD,
// never hard-coded) and gives each student two quiz results of their own.
async function seedDemoUsers() {
  const password = process.env.SEED_PASSWORD
  if (!password || password.length < 8) {
    throw new Error('Set SEED_PASSWORD (at least 8 characters) in backend/.env before running the seed')
  }
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)

  for (const u of DEMO_USERS) {
    const { rows } = await query(
      `INSERT INTO users (name, email, password_hash, role, village)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT ((lower(email))) DO NOTHING
       RETURNING id`,
      [u.name, u.email, passwordHash, u.role, u.village]
    )
    const status = rows.length ? 'created' : 'already exists'
    console.log(`[seed] ${u.role.padEnd(7)} ${u.email} (${status})`)
  }

  const { rows: lessons } = await query('SELECT id, title FROM lessons ORDER BY id LIMIT 2')
  const { rows: students } = await query(
    "SELECT id, village FROM users WHERE role = 'student' ORDER BY id"
  )
  for (const s of students) {
    const { rows } = await query('SELECT COUNT(*) AS n FROM results WHERE user_id = $1', [s.id])
    if (rows[0].n > 0) continue
    for (const [i, l] of lessons.entries()) {
      await query(
        `INSERT INTO results (lesson_id, lesson_title, village, score, total, at, user_id, client_id)
         VALUES ($1, $2, $3, $4, 2, $5, $6, $7)`,
        [l.id, l.title, s.village, (s.id + i) % 3, Date.now() - i * 86_400_000, s.id, randomUUID()]
      )
    }
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await runMigrations()
    await seedBaseDataIfEmpty()
    await seedDemoUsers()
    console.log('[seed] done')
  } catch (err) {
    console.error(err.message)
    process.exitCode = 1
  } finally {
    await pool.end()
  }
}
