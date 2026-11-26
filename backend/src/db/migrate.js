import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { pool } from './pool.js'

const MIGRATIONS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../migrations')
const LOCK_ID = 727274 // any constant: stops two server instances migrating at once

// Applies every migrations/NNN_name.sql file that has not run yet, in order.
// Each file runs inside its own transaction and is recorded in schema_migrations,
// so a half-applied migration is impossible and each file runs exactly once.
export async function runMigrations({ log = console.log } = {}) {
  const client = await pool.connect()
  try {
    await client.query('SELECT pg_advisory_lock($1)', [LOCK_ID])
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `)

    const files = (await fs.readdir(MIGRATIONS_DIR)).filter((f) => /^\d+_.+\.sql$/.test(f)).sort()
    const { rows } = await client.query('SELECT version FROM schema_migrations')
    const applied = new Set(rows.map((r) => r.version))

    let count = 0
    for (const file of files) {
      if (applied.has(file)) continue
      const sql = await fs.readFile(path.join(MIGRATIONS_DIR, file), 'utf8')
      try {
        await client.query('BEGIN')
        await client.query(sql)
        await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [file])
        await client.query('COMMIT')
      } catch (err) {
        await client.query('ROLLBACK')
        throw new Error(`Migration ${file} failed: ${err.message}`)
      }
      log(`[migrate] applied ${file}`)
      count += 1
    }
    log(count ? `[migrate] ${count} migration(s) applied` : '[migrate] database is up to date')
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [LOCK_ID]).catch(() => {})
    client.release()
  }
}

// `npm run migrate` runs this file directly.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runMigrations()
    .then(() => pool.end())
    .catch(async (err) => {
      console.error(err.message)
      await pool.end()
      process.exit(1)
    })
}
