import { query } from '../db/pool.js'
import { notFound } from '../utils/AppError.js'

const SCHOOL = `s.id, s.name, s.village, s.district, s.students, s.teachers,
  s.internet_mbps AS "internetMbps", s.uptime_pct AS "uptimePct", s.has_computers AS "hasComputers"`

export async function listSchools() {
  const { rows } = await query(`SELECT ${SCHOOL} FROM schools s ORDER BY s.id`)
  return rows
}

// A school AND its resources in ONE query: LEFT JOIN, then json_agg folds the
// resource rows into an array. Only the columns we need are selected.
export async function getSchoolWithResources(id) {
  const { rows } = await query(
    `SELECT ${SCHOOL},
            COALESCE(
              json_agg(json_build_object('id', r.id, 'item', r.item, 'stock', r.stock, 'needed', r.needed)
                       ORDER BY r.id) FILTER (WHERE r.id IS NOT NULL),
              '[]'
            ) AS resources
     FROM schools s
     LEFT JOIN resources r ON r.school_id = s.id
     WHERE s.id = $1
     GROUP BY s.id`,
    [id]
  )
  if (!rows[0]) throw notFound('School')
  return rows[0]
}
