import pg from 'pg'
import { env } from '../config/env.js'

// BIGINT (oid 20) and NUMERIC (oid 1700) arrive from Postgres as strings.
// Our values fit safely in a JS number, so parse them once, globally.
pg.types.setTypeParser(20, (v) => (v === null ? null : Number(v)))
pg.types.setTypeParser(1700, (v) => (v === null ? null : Number(v)))

const isLocal = /localhost|127\.0\.0\.1|\/tmp/.test(env.DATABASE_URL)

// ONE pool for the whole process, created when this module is first imported.
// Every request borrows a connection and gives it back, so we never pay for a
// new TCP + TLS handshake per request and never exceed Neon's connection limit.
export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false },
  max: env.DB_POOL_MAX,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
})

pool.on('error', (err) => {
  // An idle client lost its connection (for example Neon scaled to zero).
  // The pool replaces it; log it instead of crashing the process.
  console.error('[db] idle client error:', err.message)
})

const oneLine = (sql) => sql.replace(/\s+/g, ' ').trim()

// Every query goes through here so we can log the SQL that actually runs.
// Values are sent separately as $1, $2 ... parameters, never pasted into the
// SQL string, which is what prevents SQL injection.
export async function query(text, params = [], client = pool) {
  const start = performance.now()
  const result = await client.query(text, params)
  if (env.logSql) {
    const ms = (performance.now() - start).toFixed(1)
    const shownParams = params.length ? ` -- params ${JSON.stringify(params).slice(0, 200)}` : ''
    console.log(`[sql ${ms}ms] ${oneLine(text).slice(0, 400)}${shownParams} -> ${result.rowCount ?? 0} rows`)
  }
  return result
}

// Runs fn inside BEGIN/COMMIT on one dedicated connection.
// Any error rolls everything back, so a multi-row change is all or nothing.
export async function withTransaction(fn) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
