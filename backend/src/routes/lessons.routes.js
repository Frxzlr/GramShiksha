import { Router } from 'express'
import * as ctrl from '../controllers/lessons.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { createLessonBody } from '../validators/schemas.js'

const router = Router()

router.get('/', ctrl.list) // public: students read lessons, also offline-cached
router.post('/', requireAuth, requireRole('teacher'), validate({ body: createLessonBody }), ctrl.create)

export default router
