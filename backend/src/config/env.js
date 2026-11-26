import { z } from 'zod'

// Every setting the server needs, validated once at startup.
// Secrets come only from environment variables (backend/.env locally,
// the Render dashboard in production). Nothing secret is in the repository.
const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required (Neon connection string)'),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_DAYS: z.coerce.number().int().positive().default(7),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:5173,http://localhost:4173,https://gram-shiksha-mu.vercel.app'),
  TRUST_PROXY: z.coerce.number().int().min(0).default(1),
  DB_POOL_MAX: z.coerce.number().int().positive().default(10),
  LOG_SQL: z.enum(['true', 'false']).optional(),
  GEMINI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  // Print which settings are wrong, never their values.
  console.error('Invalid server configuration:')
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`)
  }
  process.exit(1)
}

const raw = parsed.data

// bcrypt work factor: 2^12 rounds, about 0.2 s per hash. Slow on purpose so
// stolen hashes are expensive to brute-force.
export const BCRYPT_ROUNDS = 12

export const env = {
  ...raw,
  isProduction: raw.NODE_ENV === 'production',
  corsOrigins: raw.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean),
  // SQL logging is on by default in development, off in production unless asked for.
  logSql: raw.LOG_SQL ? raw.LOG_SQL === 'true' : raw.NODE_ENV !== 'production',
}
