// Entry point: check config, migrate the database, then start listening.
import { env } from './src/config/env.js'
import { createApp } from './src/app.js'
import { pool } from './src/db/pool.js'
import { runMigrations } from './src/db/migrate.js'
import { seedBaseDataIfEmpty } from './src/db/seed.js'

try {
  await runMigrations()
  await seedBaseDataIfEmpty()
} catch (err) {
  console.error('Database setup failed:', err.message)
  process.exit(1)
}

const app = createApp()
const server = app.listen(env.PORT, '0.0.0.0', () => {
  console.log(`API listening on port ${env.PORT} (${env.NODE_ENV}, PostgreSQL)`)
})

// Graceful shutdown: stop accepting requests, let running ones finish,
// then close the database pool.
async function shutdown(signal) {
  console.log(`${signal} received, shutting down`)
  server.close(async () => {
    await pool.end().catch(() => {})
    process.exit(0)
  })
  setTimeout(() => process.exit(1), 10_000).unref()
}
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

process.on('unhandledRejection', (err) => {
  console.error('[unhandledRejection]', err)
})
