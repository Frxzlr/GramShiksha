import { query } from '../db/pool.js'

const COLUMNS = 'id, title, summary, summary_hi, quiz'

export async function listLessons() {
  const { rows } = await query(`SELECT ${COLUMNS} FROM lessons ORDER BY id`)
  return rows
}

// The id comes from the lessons_id_seq sequence (migration 004).
export async function createLesson(lesson, teacherId) {
  const { rows } = await query(
    `INSERT INTO lessons (title, summary, summary_hi, quiz, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${COLUMNS}`,
    [lesson.title, lesson.summary, lesson.summary_hi, JSON.stringify(lesson.quiz), teacherId]
  )
  return rows[0]
}
