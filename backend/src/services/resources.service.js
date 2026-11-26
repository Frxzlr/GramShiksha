import { query } from '../db/pool.js'
import { notFound } from '../utils/AppError.js'

const RESOURCE = `r.id, r.school_id AS "schoolId", r.item, r.stock, r.needed`

// One JOIN returns each resource with its school's name, instead of fetching
// resources and then one school per resource (the N+1 problem).
export async function listResources({ schoolId }) {
  const params = []
  let where = ''
  if (schoolId !== undefined) {
    params.push(schoolId)
    where = 'WHERE r.school_id = $1'
  }
  const { rows } = await query(
    `SELECT ${RESOURCE}, s.name AS "schoolName"
     FROM resources r JOIN schools s ON s.id = r.school_id
     ${where}
     ORDER BY r.id`,
    params
  )
  return rows
}

// "delta" (+1 / -1 from the buttons) is applied by the database in one
// atomic statement: stock = stock + $1. Postgres locks the row while it
// updates, so two planners clicking + at the same moment both count (no lost
// update). The CHECK (stock >= 0) constraint stops it going negative.
export async function updateResource(id, { delta, stock, needed }) {
  const { rows } = await query(
    `UPDATE resources r
     SET stock  = CASE WHEN $2::int IS NOT NULL THEN r.stock + $2::int ELSE COALESCE($3::int, r.stock) END,
         needed = COALESCE($4::int, r.needed)
     WHERE r.id = $1
     RETURNING ${RESOURCE}`,
    [id, delta ?? null, stock ?? null, needed ?? null]
  )
  if (!rows[0]) throw notFound('Resource')
  return rows[0]
}
