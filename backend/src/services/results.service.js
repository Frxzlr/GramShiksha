import { query } from '../db/pool.js'
import { forbidden, notFound } from '../utils/AppError.js'

const SELECT_RESULT = `
  SELECT id, lesson_id AS "lessonId", lesson_title AS "lessonTitle", village,
         score, total, at, user_id AS "userId"
  FROM results`

// Saves a batch in ONE statement: the arrays are expanded into rows by
// unnest(), so 50 results cost one round trip, not 50.
// ON CONFLICT (client_id) DO NOTHING makes retries safe: the same quiz
// attempt (same clientId) sent twice is stored once.
export async function createResults(items, userId) {
  const cols = {
    lessonId: [], lessonTitle: [], village: [], score: [], total: [], at: [], clientId: [],
  }
  for (const r of items) {
    cols.lessonId.push(r.lessonId ?? null)
    cols.lessonTitle.push(r.lessonTitle)
    cols.village.push(r.village)
    cols.score.push(r.score)
    cols.total.push(r.total)
    cols.at.push(r.at ?? Date.now())
    cols.clientId.push(r.clientId ?? null)
  }

  const { rows } = await query(
    `INSERT INTO results (lesson_id, lesson_title, village, score, total, at, client_id, user_id)
     SELECT l, t, v, s, tot, a, c, $8
     FROM unnest($1::bigint[], $2::text[], $3::text[], $4::int[], $5::int[], $6::bigint[], $7::uuid[])
          AS x(l, t, v, s, tot, a, c)
     ON CONFLICT (client_id) DO NOTHING
     RETURNING id`,
    [cols.lessonId, cols.lessonTitle, cols.village, cols.score, cols.total, cols.at, cols.clientId, userId ?? null]
  )
  return { created: rows.length, duplicates: items.length - rows.length, ids: rows.map((r) => r.id) }
}

// Column names can't be sent as $ parameters, so ORDER BY only ever uses a
// value from this whitelist (the validator already rejected anything else).
const SORT_SQL = {
  at: 'at ASC', '-at': 'at DESC',
  score: 'score ASC', '-score': 'score DESC',
  village: 'village ASC', '-village': 'village DESC',
}

// Filtering + sorting + pagination, all done by the database.
export async function listResults({ page, limit, village, lessonId, minScore, sort }, { onlyUserId } = {}) {
  const where = []
  const params = []
  const add = (sql, value) => {
    params.push(value)
    where.push(sql.replace('?', `$${params.length}`))
  }
  if (onlyUserId !== undefined) add('user_id = ?', onlyUserId)
  if (village) add('village = ?', village)
  if (lessonId !== undefined) add('lesson_id = ?', lessonId)
  if (minScore !== undefined) add('score >= ?', minScore)

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const offset = (page - 1) * limit

  // The page and the total count are two independent queries, so they run
  // at the same time on two pooled connections.
  const [pageRes, countRes] = await Promise.all([
    query(
      `${SELECT_RESULT} ${whereSql} ORDER BY ${SORT_SQL[sort]}, id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    ),
    query(`SELECT COUNT(*) AS n FROM results ${whereSql}`, params),
  ])

  const totalItems = countRes.rows[0].n
  return {
    data: pageRes.rows,
    meta: { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) },
  }
}

// Object-level authorization: a student may read only their own result.
// Teachers and planners may read any result.
export async function getResult(id, user) {
  const { rows } = await query(`${SELECT_RESULT} WHERE id = $1`, [id])
  const result = rows[0]
  if (!result) throw notFound('Result')
  if (user.role === 'student' && result.userId !== user.id) {
    throw forbidden('You can only view your own results')
  }
  return result
}
