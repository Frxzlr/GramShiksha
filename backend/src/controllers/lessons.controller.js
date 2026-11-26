import * as lessons from '../services/lessons.service.js'

export async function list(req, res) {
  res.json(await lessons.listLessons())
}

export async function create(req, res) {
  const lesson = await lessons.createLesson(req.valid.body, req.user.id)
  res.status(201).location(`/api/v1/lessons/${lesson.id}`).json(lesson)
}
