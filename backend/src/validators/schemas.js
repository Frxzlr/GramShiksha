import { z } from 'zod'

// Reusable pieces
const text = (max) => z.string().trim().min(1, 'Required').max(max, `Must be at most ${max} characters`)
const email = z.string().trim().toLowerCase().email('Must be a valid email').max(254)
export const idParam = z
  .object({ id: z.coerce.number({ invalid_type_error: 'id must be a number' }).int().positive('id must be a positive integer') })
  .strict()
const safeInt = z.number().int().max(Number.MAX_SAFE_INTEGER)

// ---------- auth ----------
export const registerBody = z
  .object({
    name: text(80),
    email,
    // bcrypt only uses the first 72 bytes, so longer passwords are rejected.
    password: z.string().min(8, 'Password must be at least 8 characters').max(72),
    village: text(80).optional(),
  })
  .strict() // a client cannot sneak in "role": "planner"

export const loginBody = z.object({ email, password: z.string().min(1).max(72) }).strict()

// ---------- lessons ----------
const question = z
  .object({
    q: text(300),
    options: z.array(text(200)).min(2).max(6),
    answer: z.number().int().min(0),
  })
  .strict()
  .refine((qn) => qn.answer < qn.options.length, { message: 'answer must point to one of the options', path: ['answer'] })

export const createLessonBody = z
  .object({
    title: text(120),
    summary: text(2000),
    summary_hi: text(2000),
    quiz: z.array(question).min(1).max(20),
  })
  .strict() // the id is assigned by the database, never by the client

export const generateBody = z
  .object({
    text: z
      .string()
      .trim()
      .min(40, 'Please paste at least 40 characters of chapter text')
      .max(20_000, 'Text too long (max 20,000 characters)'),
  })
  .strict()

// ---------- results ----------
const resultItem = z
  .object({
    clientId: z.string().uuid('clientId must be a UUID').optional(),
    lessonId: safeInt.min(0).nullable().optional(),
    lessonTitle: text(200),
    village: text(80),
    score: z.number().int().min(0),
    total: z.number().int().min(1).max(100),
    at: safeInt.positive().optional(),
  })
  .strict()
  .refine((r) => r.score <= r.total, { message: 'score cannot be greater than total', path: ['score'] })

// One result, or a batch of up to 50 queued offline.
export const createResultsBody = z.union([resultItem, z.array(resultItem).min(1).max(50)])

const SORTABLE = ['at', '-at', 'score', '-score', 'village', '-village']

export const listResultsQuery = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100, 'limit cannot be more than 100').default(20),
    village: text(80).optional(),
    lessonId: z.coerce.number().int().min(0).optional(),
    minScore: z.coerce.number().int().min(0).optional(),
    sort: z.enum(SORTABLE, { message: `sort must be one of ${SORTABLE.join(', ')}` }).default('-at'),
  })
  .strict()

// ---------- resources ----------
export const listResourcesQuery = z
  .object({ schoolId: z.coerce.number().int().positive().optional() })
  .strict()

export const updateResourceBody = z
  .object({
    delta: z.number().int().min(-100).max(100).optional(), // +1 / -1 from the buttons
    stock: z.number().int().min(0).optional(), // set an absolute value
    needed: z.number().int().min(0).optional(),
  })
  .strict()
  .refine((b) => b.delta !== undefined || b.stock !== undefined || b.needed !== undefined, {
    message: 'Send at least one of delta, stock or needed',
  })
  .refine((b) => !(b.delta !== undefined && b.stock !== undefined), {
    message: 'Send either delta or stock, not both',
  })

// ---------- connectivity ----------
const reading = z
  .object({
    village: text(80),
    mbps: z.number().min(0).max(10_000),
    rttMs: z.number().min(0).max(60_000).nullable().optional(),
    online: z.boolean(),
    at: safeInt.positive(),
  })
  .strict()

export const connectivityBody = z.union([reading, z.array(reading).min(1).max(50)])
